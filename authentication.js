const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');

class AuthenticationSystem {
    constructor(database) {
        this.db = database;
        this.authenticatedUsers = new Map(); // userId -> { token, expires, sessionId }
        this.setupAttempts = new Map(); // userId -> { attempts, lastAttempt }
        this.maxAttempts = 3;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        this.jwtSecret = process.env.JWT_SECRET || this.generateRandomSecret();
    }

    generateRandomSecret() {
        return require('crypto').randomBytes(64).toString('hex');
    }

    async initializeAuthTables() {
        return new Promise((resolve, reject) => {
            console.log('[AUTH DEBUG] Initializing auth tables...');
            this.db.db.run(`
                CREATE TABLE IF NOT EXISTS auth_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE,
                    username TEXT,
                    password_hash TEXT,
                    totp_secret TEXT,
                    backup_codes TEXT,
                    is_setup_complete BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    failed_attempts INTEGER DEFAULT 0,
                    locked_until DATETIME
                )
            `, (err) => {
                if (err) {
                    console.log('[AUTH DEBUG] Error creating auth tables:', err);
                    reject(err);
                } else {
                    console.log('[AUTH DEBUG] Auth tables initialized successfully');
                    // Check if any users exist
                    this.db.db.get('SELECT COUNT(*) as count FROM auth_users', [], (countErr, row) => {
                        if (countErr) {
                            console.log('[AUTH DEBUG] Error counting users:', countErr);
                        } else {
                            console.log(`[AUTH DEBUG] Current user count in database: ${row.count}`);
                        }
                    });
                    resolve();
                }
            });
        });
    }

    async isUserRegistered(userId) {
        return new Promise((resolve, reject) => {
            this.db.db.get(
                'SELECT COUNT(*) as count FROM auth_users WHERE user_id = ? AND is_setup_complete = 1',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count > 0);
                }
            );
        });
    }

    async hasAnyRegisteredUser() {
        return new Promise((resolve, reject) => {
            this.db.db.get(
                'SELECT COUNT(*) as count FROM auth_users WHERE is_setup_complete = 1',
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count > 0);
                }
            );
        });
    }

    async getUser(userId) {
        return new Promise((resolve, reject) => {
            console.log(`[AUTH DEBUG] Querying database for user ID: ${userId}`);
            this.db.db.get(
                'SELECT * FROM auth_users WHERE user_id = ?',
                [userId],
                (err, row) => {
                    if (err) {
                        console.log(`[AUTH DEBUG] Database error:`, err);
                        reject(err);
                    } else {
                        console.log(`[AUTH DEBUG] Database result:`, row ? 'User found' : 'User not found');
                        if (row) {
                            console.log(`[AUTH DEBUG] User data:`, {
                                user_id: row.user_id,
                                username: row.username,
                                has_totp_secret: !!row.totp_secret,
                                is_setup_complete: row.is_setup_complete
                            });
                        }
                        resolve(row);
                    }
                }
            );
        });
    }

    async isUserAuthenticated(userId) {
        const session = this.authenticatedUsers.get(userId);
        if (!session) return false;

        // Check if session has expired
        if (Date.now() > session.expires) {
            this.authenticatedUsers.delete(userId);
            return false;
        }

        return true;
    }

    async isUserLocked(userId) {
        return new Promise((resolve, reject) => {
            this.db.db.get(
                'SELECT locked_until FROM auth_users WHERE user_id = ?',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    else {
                        if (!row || !row.locked_until) resolve(false);
                        else resolve(new Date(row.locked_until) > new Date());
                    }
                }
            );
        });
    }

    async createInitialSetupEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('🔐 Guardian Security Bot - Initial Setup')
            .setDescription('**Welcome to Guardian Security Bot!**\n\nTo ensure maximum security, only **ONE** person can control this bot. You need to set up authentication first.')
            .setColor(0x3498DB)
            .addFields(
                { 
                    name: '🛡️ Security Features', 
                    value: '• Password protection\n• 2FA with authenticator app (Authy, Google Authenticator, etc.)\n• Session management\n• Account lockout protection', 
                    inline: false 
                },
                { 
                    name: '📱 Required App', 
                    value: 'You\'ll need an authenticator app like:\n• Authy\n• Google Authenticator\n• Microsoft Authenticator\n• 1Password', 
                    inline: false 
                },
                { 
                    name: '⚠️ Important', 
                    value: 'Once setup is complete, **only you** will be able to use this bot\'s admin features. Make sure to save your backup codes!', 
                    inline: false 
                }
            )
            .setFooter({ text: 'Click the button below to start setup' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('auth_start_setup')
                    .setLabel('🔐 Start Authentication Setup')
                    .setStyle(ButtonStyle.Primary)
            );

        return { embeds: [embed], components: [button] };
    }

    async createLoginEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('🔐 Guardian Security Bot - Login Required')
            .setDescription('You need to authenticate to use administrative features of this bot.')
            .setColor(0xE74C3C)
            .addFields(
                { 
                    name: '🔑 Authentication Required', 
                    value: 'Please log in with your password and 2FA code to continue.', 
                    inline: false 
                },
                { 
                    name: '📱 2FA Code', 
                    value: 'Open your authenticator app (Authy, Google Authenticator, etc.) and get your 6-digit code.', 
                    inline: false 
                }
            )
            .setFooter({ text: 'Your session will last 24 hours after successful login' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('auth_login')
                    .setLabel('🔐 Login')
                    .setStyle(ButtonStyle.Primary)
            );

        return { embeds: [embed], components: [button] };
    }

    async createPasswordSetupModal() {
        const modal = new ModalBuilder()
            .setCustomId('auth_password_setup')
            .setTitle('🔐 Set Your Password');

        const passwordInput = new TextInputBuilder()
            .setCustomId('password')
            .setLabel('Create a strong password')
            .setStyle(TextInputStyle.Short)
            .setMinLength(8)
            .setMaxLength(128)
            .setPlaceholder('Enter a strong password (minimum 8 characters)')
            .setRequired(true);

        const confirmPasswordInput = new TextInputBuilder()
            .setCustomId('confirm_password')
            .setLabel('Confirm your password')
            .setStyle(TextInputStyle.Short)
            .setMinLength(8)
            .setMaxLength(128)
            .setPlaceholder('Re-enter your password')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(passwordInput),
            new ActionRowBuilder().addComponents(confirmPasswordInput)
        );

        return modal;
    }

    async createLoginModal() {
        const modal = new ModalBuilder()
            .setCustomId('auth_login_submit')
            .setTitle('🔐 Login to Guardian Bot');

        const passwordInput = new TextInputBuilder()
            .setCustomId('password')
            .setLabel('Password')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter your password')
            .setRequired(true);

        const totpInput = new TextInputBuilder()
            .setCustomId('totp_code')
            .setLabel('2FA Code (6 digits)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(6)
            .setMaxLength(6)
            .setPlaceholder('123456')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(passwordInput),
            new ActionRowBuilder().addComponents(totpInput)
        );

        return modal;
    }

    async setupPassword(userId, username, password, confirmPassword) {
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Check password strength
        if (!this.isPasswordStrong(password)) {
            throw new Error('Password is too weak. Please include uppercase, lowercase, numbers, and special characters.');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Check if user already exists (incomplete setup)
        console.log(`[AUTH DEBUG] About to call getUser for ${userId}`);
        const existingUser = await this.getUser(userId);
        console.log(`[AUTH DEBUG] Found existing user for ${userId}:`, existingUser ? 'YES' : 'NO');
        if (existingUser) {
            console.log(`[AUTH DEBUG] Existing user has TOTP secret:`, existingUser.totp_secret ? 'YES' : 'NO');
            console.log(`[AUTH DEBUG] Existing user setup complete:`, existingUser.is_setup_complete);
        }
        let secret, backupCodes;

        if (existingUser && existingUser.totp_secret) {
            // User exists, use existing secret
            console.log(`[AUTH] Reusing existing TOTP secret for user ${userId}`);
            secret = {
                base32: existingUser.totp_secret,
                otpauth_url: `otpauth://totp/Guardian%20Security%20Bot:${username}?secret=${existingUser.totp_secret}&issuer=Guardian%20Security%20Bot`
            };
            
            // Decode existing backup codes or generate new ones
            if (existingUser.backup_codes) {
                try {
                    const hashedCodes = JSON.parse(existingUser.backup_codes);
                    // For security, we'll generate new backup codes during password reset
                    backupCodes = this.generateBackupCodes();
                } catch (e) {
                    backupCodes = this.generateBackupCodes();
                }
            } else {
                backupCodes = this.generateBackupCodes();
            }
        } else {
            // New user, generate new secret
            console.log(`[AUTH] Generating new TOTP secret for user ${userId}`);
            secret = speakeasy.generateSecret({
                name: `Guardian Bot (${username})`,
                issuer: 'Guardian Security Bot',
                length: 32
            });
            backupCodes = this.generateBackupCodes();
        }

        // Hash the backup codes
        const hashedBackupCodes = await Promise.all(
            backupCodes.map(code => bcrypt.hash(code, 12))
        );

        return new Promise((resolve, reject) => {
            this.db.db.run(
                `INSERT OR REPLACE INTO auth_users 
                 (user_id, username, password_hash, totp_secret, backup_codes, is_setup_complete) 
                 VALUES (?, ?, ?, ?, ?, 0)`,
                [userId, username, hashedPassword, secret.base32, JSON.stringify(hashedBackupCodes)],
                function(err) {
                    if (err) reject(err);
                    else resolve({ secret: secret.base32, qrCode: secret.otpauth_url, backupCodes });
                }
            );
        });
    }

    async completeSetup(userId, totpCode) {
        const user = await this.getUser(userId);
        if (!user) throw new Error('User not found');

        const verified = speakeasy.totp.verify({
            secret: user.totp_secret,
            encoding: 'base32',
            token: totpCode,
            window: 2
        });

        if (!verified) {
            throw new Error('Invalid 2FA code');
        }

        return new Promise((resolve, reject) => {
            this.db.db.run(
                'UPDATE auth_users SET is_setup_complete = 1 WHERE user_id = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async authenticateUser(userId, password, totpCode) {
        // Check if user is locked
        const isLocked = await this.isUserLocked(userId);
        if (isLocked) {
            throw new Error('Account is temporarily locked due to too many failed attempts');
        }

        const user = await this.getUser(userId);
        if (!user || !user.is_setup_complete) {
            throw new Error('User not found or setup not complete');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            await this.recordFailedAttempt(userId);
            throw new Error('Invalid password');
        }

        // Verify TOTP
        const totpValid = speakeasy.totp.verify({
            secret: user.totp_secret,
            encoding: 'base32',
            token: totpCode,
            window: 2
        });

        if (!totpValid) {
            await this.recordFailedAttempt(userId);
            throw new Error('Invalid 2FA code');
        }

        // Clear failed attempts and create session
        await this.clearFailedAttempts(userId);
        const session = await this.createSession(userId);
        
        // Update last login
        await this.updateLastLogin(userId);

        return session;
    }

    async createSession(userId) {
        const sessionId = require('crypto').randomBytes(32).toString('hex');
        const token = jwt.sign(
            { userId, sessionId, iat: Date.now() },
            this.jwtSecret,
            { expiresIn: '24h' }
        );

        const expires = Date.now() + this.sessionDuration;
        const session = { token, expires, sessionId };
        
        this.authenticatedUsers.set(userId, session);
        
        return session;
    }

    async logout(userId) {
        this.authenticatedUsers.delete(userId);
    }

    async recordFailedAttempt(userId) {
        return new Promise((resolve, reject) => {
            this.db.db.run(
                `UPDATE auth_users 
                 SET failed_attempts = failed_attempts + 1,
                     locked_until = CASE 
                         WHEN failed_attempts + 1 >= ? THEN datetime('now', '+' || ? || ' seconds')
                         ELSE locked_until 
                     END
                 WHERE user_id = ?`,
                [this.maxAttempts, this.lockoutDuration / 1000, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async clearFailedAttempts(userId) {
        return new Promise((resolve, reject) => {
            this.db.db.run(
                'UPDATE auth_users SET failed_attempts = 0, locked_until = NULL WHERE user_id = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async updateLastLogin(userId) {
        return new Promise((resolve, reject) => {
            this.db.db.run(
                'UPDATE auth_users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    isPasswordStrong(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasNonalphas = /\W/.test(password);
        
        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
    }

    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    async generateQRCode(otpauthUrl) {
        try {
            const qrBuffer = await QRCode.toBuffer(otpauthUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return qrBuffer;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    async createQRSetupEmbed(secret, qrBuffer, backupCodes) {
        const embed = new EmbedBuilder()
            .setTitle('📱 Setup 2FA Authentication')
            .setDescription('**Step 2: Configure your authenticator app**')
            .setColor(0x2ECC71)
            .addFields(
                { 
                    name: '📲 Instructions', 
                    value: '1. Open your authenticator app (Authy, Google Authenticator, etc.)\n2. Scan the QR code below OR enter the secret manually\n3. Enter the 6-digit code from your app to complete setup', 
                    inline: false 
                },
                { 
                    name: '🔑 Manual Setup Secret', 
                    value: `\`${secret}\``, 
                    inline: false 
                },
                { 
                    name: '💾 Backup Codes', 
                    value: `**SAVE THESE CODES SAFELY!**\n\`\`\`${backupCodes.join('\n')}\`\`\`\nThese codes can be used if you lose access to your authenticator app.`, 
                    inline: false 
                },
                { 
                    name: '⚠️ Important', 
                    value: 'Keep your backup codes secure and don\'t share them with anyone!', 
                    inline: false 
                }
            )
            .setImage('attachment://qrcode.png')
            .setFooter({ text: 'Enter the 6-digit code from your app below' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('auth_verify_setup')
                    .setLabel('📱 Enter 2FA Code to Complete Setup')
                    .setStyle(ButtonStyle.Success)
            );

        const attachment = new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' });

        return { embeds: [embed], components: [button], files: [attachment] };
    }

    async createVerifySetupModal() {
        const modal = new ModalBuilder()
            .setCustomId('auth_verify_setup_submit')
            .setTitle('📱 Verify 2FA Setup');

        const totpInput = new TextInputBuilder()
            .setCustomId('totp_code')
            .setLabel('Enter 6-digit code from your app')
            .setStyle(TextInputStyle.Short)
            .setMinLength(6)
            .setMaxLength(6)
            .setPlaceholder('123456')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(totpInput)
        );

        return modal;
    }

    async createSuccessEmbed(username) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Authentication Setup Complete!')
            .setDescription(`**Welcome, ${username}!**\n\nYour Guardian Security Bot is now secured with 2FA authentication.`)
            .setColor(0x2ECC71)
            .addFields(
                { 
                    name: '🎉 Setup Complete', 
                    value: 'You are now the **only person** who can control this bot\'s administrative features.', 
                    inline: false 
                },
                { 
                    name: '🔐 Security Features Active', 
                    value: '• Password protection ✅\n• 2FA authentication ✅\n• Session management ✅\n• Account lockout protection ✅', 
                    inline: false 
                },
                { 
                    name: '🚀 What\'s Next?', 
                    value: 'You can now use all bot commands! Your session will last 24 hours. Use `/setup` to configure server protection.', 
                    inline: false 
                }
            )
            .setFooter({ text: 'Your authentication session is active for 24 hours' });

        return { embeds: [embed] };
    }

    async requireAuthentication(interaction, moderationSystem = null, excludeUserAuth = false) {
        const userId = interaction.user.id;
        const commandName = interaction.commandName;
        
        // Check if any user is registered
        const hasRegistered = await this.hasAnyRegisteredUser();
        
        if (!hasRegistered) {
            // No one has set up authentication yet
            const setupEmbed = await this.createInitialSetupEmbed();
            return { required: true, response: setupEmbed };
        }
        
        // Check if this specific user is registered (primary admin)
        const isRegistered = await this.isUserRegistered(userId);
        
        if (!isRegistered) {
            // Check if user is authorized by primary admin (but only if not the user auth command)
            if (!excludeUserAuth && commandName !== 'user') {
                const isAuthorized = await this.db.isUserAuthorized(userId);
                if (isAuthorized) {
                    // Authorized user - they can access all commands except /user auth
                    return { required: false, isAuthorizedUser: true };
                }
            }
            
            // This user is not registered or authorized - LOG THIS SECURITY VIOLATION
            await this.logUnauthorizedAccess(interaction, 'User not registered or authorized', moderationSystem);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Access Denied')
                .setDescription('You are not authorized to use this bot. Only the registered administrator or authorized users can access these features.')
                .setColor(0xE74C3C)
                .addFields(
                    { name: '⚠️ Security Notice', value: 'This unauthorized access attempt has been logged.', inline: false }
                );
            
            return { 
                required: true, 
                response: { embeds: [embed], ephemeral: true } 
            };
        }
        
        // Check if user is authenticated (primary admin)
        const isAuthenticated = await this.isUserAuthenticated(userId);
        
        if (!isAuthenticated) {
            // Registered user but not logged in - this is normal, just show login
            const loginEmbed = await this.createLoginEmbed();
            return { required: true, response: loginEmbed };
        }
        
        // User is authenticated (primary admin)
        return { required: false, isPrimaryAdmin: true };
    }

    async generateCurrentQRCode(userId) {
        const user = await this.getUser(userId);
        if (!user || !user.is_setup_complete) {
            throw new Error('User not found or setup not complete');
        }

        const otpAuthUrl = `otpauth://totp/Guardian%20Security%20Bot:${user.username}?secret=${user.totp_secret}&issuer=Guardian%20Security%20Bot`;
        
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
            const qrCodeBuffer = await QRCode.toBuffer(otpAuthUrl);
            
            return {
                dataUrl: qrCodeDataUrl,
                buffer: qrCodeBuffer,
                secret: user.totp_secret,
                otpAuthUrl: otpAuthUrl
            };
        } catch (error) {
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }

    async logUnauthorizedAccess(interaction, reason, moderationSystem = null) {
        try {
            const user = interaction.user;
            const guild = interaction.guild;
            const command = interaction.commandName || 'Unknown Command';
            
            console.log(`🚨 SECURITY ALERT: ${user.tag} (${user.id}) attempted unauthorized access to command: ${command}`);
            
            // Get server config to find logs channel
            const config = await this.db.getServerConfig(guild.id);
            
            if (config && config.logs_channel_id) {
                const logsChannel = guild.channels.cache.get(config.logs_channel_id);
                
                if (logsChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🚨 UNAUTHORIZED ACCESS ATTEMPT')
                        .setDescription(`**${user.tag}** attempted to access CheeseBot without authorization`)
                        .setColor(0xFF0000)
                        .addFields(
                            { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                            { name: '🔐 Command', value: `\`/${command}\``, inline: true },
                            { name: '📍 Channel', value: `${interaction.channel}`, inline: true },
                            { name: '⚠️ Reason', value: reason, inline: false },
                            { name: '🕒 Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setThumbnail(user.displayAvatarURL())
                        .setTimestamp()
                        .setFooter({ text: 'Guardian Security Alert' });

                    await logsChannel.send({ embeds: [embed] });
                }
            }
            
            // Also log to database if moderation system is available
            if (moderationSystem) {
                await moderationSystem.logModerationAction(
                    guild,
                    user,
                    guild.client.user,
                    'unauthorized_access_attempt',
                    `Command: /${command}, Reason: ${reason}`
                );
            }
            
        } catch (error) {
            console.error('Failed to log unauthorized access:', error);
        }
    }
}

module.exports = AuthenticationSystem;
