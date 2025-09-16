const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'cheesebot.db'));
        this.initializeTables();
    }

    initializeTables() {
        // Authentication tables
        this.db.run(`
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
        `);

        // Authorized users table (users granted access by primary admin)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS authorized_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE,
                username TEXT,
                granted_by TEXT,
                granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                permissions TEXT DEFAULT '["*"]'
            )
        `);

        // Server configurations table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS server_configs (
                guild_id TEXT PRIMARY KEY,
                admin_channel_id TEXT,
                logs_channel_id TEXT,
                panic_mode BOOLEAN DEFAULT 0,
                safe_roles TEXT DEFAULT '[]',
                youtube_channel_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                left_at DATETIME
            )
        `);

        // Moderation settings table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS moderation_settings (
                guild_id TEXT PRIMARY KEY,
                spam_protection BOOLEAN DEFAULT 0,
                spam_message_count INTEGER DEFAULT 5,
                spam_time_window INTEGER DEFAULT 5000,
                spam_punishment TEXT DEFAULT 'timeout',
                spam_punishment_duration INTEGER DEFAULT 300,
                spam_punishment_unit TEXT DEFAULT 'seconds',
                
                raid_protection BOOLEAN DEFAULT 0,
                raid_user_threshold INTEGER DEFAULT 10,
                raid_time_window INTEGER DEFAULT 60,
                raid_punishment TEXT DEFAULT 'ban',
                
                auto_mod BOOLEAN DEFAULT 0,
                profanity_filter BOOLEAN DEFAULT 0,
                link_filter BOOLEAN DEFAULT 0,
                invite_filter BOOLEAN DEFAULT 0,
                caps_filter BOOLEAN DEFAULT 0,
                caps_threshold INTEGER DEFAULT 70,
                
                anti_nuke BOOLEAN DEFAULT 0,
                channel_create_limit INTEGER DEFAULT 3,
                channel_delete_limit INTEGER DEFAULT 3,
                role_create_limit INTEGER DEFAULT 5,
                role_delete_limit INTEGER DEFAULT 5,
                member_kick_limit INTEGER DEFAULT 3,
                member_ban_limit INTEGER DEFAULT 3,
                mass_ban_limit INTEGER DEFAULT 5,
                
                warning_system BOOLEAN DEFAULT 0,
                warning_threshold INTEGER DEFAULT 3,
                warning_auto_punishment TEXT DEFAULT 'timeout',
                
                auto_actions BOOLEAN DEFAULT 1,
                detailed_logging BOOLEAN DEFAULT 1,
                whitelist_mode BOOLEAN DEFAULT 0,
                auto_backup BOOLEAN DEFAULT 0,
                analytics_enabled BOOLEAN DEFAULT 1,
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Warnings table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                user_id TEXT,
                moderator_id TEXT,
                reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Moderation logs table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS mod_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                user_id TEXT,
                moderator_id TEXT,
                action TEXT,
                reason TEXT,
                duration INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Spam tracking table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS spam_tracking (
                user_id TEXT,
                guild_id TEXT,
                message_count INTEGER DEFAULT 1,
                first_message_time INTEGER,
                last_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, guild_id)
            )
        `);

        // AFK tracking table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS afk_users (
                user_id TEXT,
                guild_id TEXT,
                start_time INTEGER,
                end_time INTEGER,
                duration_minutes INTEGER,
                unit TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, guild_id)
            )
        `);

        // Birthdays table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS birthdays (
                user_id TEXT,
                guild_id TEXT,
                day INTEGER,
                month INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, guild_id)
            )
        `);

        // Ticketing system tables
        this.db.run(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                channel_id TEXT UNIQUE,
                user_id TEXT,
                username TEXT,
                subject TEXT,
                status TEXT DEFAULT 'open',
                priority TEXT DEFAULT 'normal',
                claimed_by TEXT,
                claimed_by_username TEXT,
                thread_id TEXT,
                ticket_number INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                closed_at DATETIME,
                close_reason TEXT
            )
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS ticket_config (
                guild_id TEXT PRIMARY KEY,
                ticket_category_id TEXT,
                transcript_channel_id TEXT,
                staff_role_id TEXT,
                ticket_counter INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Cheese Clicker game tables
        this.db.run(`
            CREATE TABLE IF NOT EXISTS cheese_clicker_players (
                user_id TEXT,
                guild_id TEXT,
                cheese_count REAL DEFAULT 0,
                total_cheese_clicked REAL DEFAULT 0,
                cheese_per_second REAL DEFAULT 0,
                cheese_per_click REAL DEFAULT 1,
                last_updated INTEGER DEFAULT (strftime('%s', 'now')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, guild_id)
            )
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS cheese_clicker_upgrades (
                user_id TEXT,
                guild_id TEXT,
                upgrade_id TEXT,
                quantity INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, guild_id, upgrade_id)
            )
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS ticket_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER,
                user_id TEXT,
                username TEXT,
                message_content TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets (id)
            )
        `);

        // Counting system tables
        this.db.run(`
            CREATE TABLE IF NOT EXISTS counting_channels (
                guild_id TEXT,
                channel_id TEXT,
                current_number INTEGER DEFAULT 0,
                last_user_id TEXT,
                highest_number INTEGER DEFAULT 0,
                total_correct INTEGER DEFAULT 0,
                total_incorrect INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (guild_id, channel_id)
            )
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS counting_stats (
                user_id TEXT,
                guild_id TEXT,
                correct_count INTEGER DEFAULT 0,
                incorrect_count INTEGER DEFAULT 0,
                highest_number INTEGER DEFAULT 0,
                last_number INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                best_streak INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, guild_id)
            )
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS counting_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                channel_id TEXT,
                user_id TEXT,
                username TEXT,
                number_attempted INTEGER,
                expected_number INTEGER,
                was_correct BOOLEAN,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Illegal content incidents table for law enforcement reporting
        this.db.run(`
            CREATE TABLE IF NOT EXISTS illegal_content_incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT UNIQUE,
                guild_id TEXT,
                guild_name TEXT,
                channel_id TEXT,
                channel_name TEXT,
                user_id TEXT,
                username TEXT,
                discriminator TEXT,
                user_created_at TEXT,
                account_age_days INTEGER,
                message_id TEXT,
                message_content TEXT,
                attachment_count INTEGER DEFAULT 0,
                attachment_info TEXT,
                incident_type TEXT,
                severity TEXT DEFAULT 'high',
                reporter_id TEXT,
                reporter_username TEXT,
                evidence_preserved BOOLEAN DEFAULT 0,
                law_enforcement_contacted BOOLEAN DEFAULT 0,
                discord_reported BOOLEAN DEFAULT 0,
                ncmec_reported BOOLEAN DEFAULT 0,
                user_banned BOOLEAN DEFAULT 0,
                ban_reason TEXT,
                additional_notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Enhanced moderation logs for detailed incident tracking
        this.db.run(`
            CREATE TABLE IF NOT EXISTS enhanced_mod_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                log_id TEXT UNIQUE,
                guild_id TEXT,
                action_type TEXT,
                severity TEXT DEFAULT 'medium',
                target_user_id TEXT,
                target_username TEXT,
                moderator_user_id TEXT,
                moderator_username TEXT,
                channel_id TEXT,
                message_id TEXT,
                evidence_data TEXT,
                user_info TEXT,
                action_taken TEXT,
                follow_up_required BOOLEAN DEFAULT 0,
                case_number TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User info cache for incident reporting
        this.db.run(`
            CREATE TABLE IF NOT EXISTS user_info_cache (
                user_id TEXT,
                guild_id TEXT,
                username TEXT,
                discriminator TEXT,
                display_name TEXT,
                avatar_url TEXT,
                account_created TEXT,
                first_seen TEXT,
                last_seen TEXT,
                message_count INTEGER DEFAULT 0,
                warning_count INTEGER DEFAULT 0,
                previous_violations TEXT,
                risk_level TEXT DEFAULT 'unknown',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, guild_id)
            )
        `);

        // Server setup history for easy redeployment
        this.db.run(`
            CREATE TABLE IF NOT EXISTS server_setup_history (
                guild_id TEXT PRIMARY KEY,
                guild_name TEXT,
                setup_by_user_id TEXT,
                setup_by_username TEXT,
                setup_by_display_name TEXT,
                admin_channel_id TEXT,
                logs_channel_id TEXT,
                password_hash TEXT,
                totp_secret TEXT,
                backup_codes TEXT,
                authorized_users TEXT DEFAULT '[]',
                configuration_backup TEXT,
                first_setup_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_access_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                setup_version TEXT DEFAULT '1.0.0',
                is_active BOOLEAN DEFAULT 1,
                access_count INTEGER DEFAULT 1
            )
        `);

        // Server setup history table (for persistent configurations)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS server_setup_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                guild_name TEXT,
                setup_by_user_id TEXT,
                setup_by_username TEXT,
                admin_password_hash TEXT,
                admin_channel_id TEXT,
                logs_channel_id TEXT,
                configuration_data TEXT,
                auth_users_backup TEXT,
                authorized_users_backup TEXT,
                moderation_settings_backup TEXT,
                first_setup_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_restored_at DATETIME,
                setup_version TEXT DEFAULT '1.0.0',
                is_active BOOLEAN DEFAULT 1,
                restore_count INTEGER DEFAULT 0,
                notes TEXT
            )
        `);

        // Bot status table for version tracking
        this.db.run(`
            CREATE TABLE IF NOT EXISTS bot_status (
                id INTEGER PRIMARY KEY,
                last_version TEXT,
                last_restart TEXT DEFAULT (datetime('now')),
                restart_count INTEGER DEFAULT 1
            )
        `);

        // YouTube monitoring tables
        this.db.run(`
            CREATE TABLE IF NOT EXISTS youtube_content (
                id TEXT PRIMARY KEY,
                channel_id TEXT,
                title TEXT,
                description TEXT,
                published_at TEXT,
                thumbnail_url TEXT,
                video_url TEXT,
                content_type TEXT,
                view_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                is_live BOOLEAN DEFAULT 0,
                duration TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS youtube_notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                content_id TEXT,
                content_type TEXT,
                notification_sent BOOLEAN DEFAULT 0,
                sent_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (content_id) REFERENCES youtube_content (id)
            )
        `);

        // Goal system tables
        this.db.run(`
            CREATE TABLE IF NOT EXISTS server_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                goal_type TEXT,
                title TEXT,
                description TEXT,
                emoji TEXT DEFAULT '🎯',
                target_amount INTEGER,
                current_progress INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                is_completed BOOLEAN DEFAULT 0,
                completed_at DATETIME,
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS goal_progress_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER,
                guild_id TEXT,
                previous_progress INTEGER,
                new_progress INTEGER,
                change_amount INTEGER,
                change_type TEXT,
                updated_by TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES server_goals (id)
            )
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS goal_celebrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER,
                guild_id TEXT,
                celebrated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                celebration_message_id TEXT,
                celebration_channel_id TEXT,
                progress_at_celebration INTEGER,
                FOREIGN KEY (goal_id) REFERENCES server_goals (id)
            )
        `);

        // Run migrations
        this.runMigrations();
        
        // Verify YouTube column exists
        this.verifyYouTubeColumn();
    }

    verifyYouTubeColumn() {
        // Check if youtube_channel_id column exists in server_configs
        this.db.get(`PRAGMA table_info(server_configs)`, (err, rows) => {
            if (err) {
                console.log('Could not verify YouTube column:', err.message);
                return;
            }
            
            // This will help us see if the column exists
            this.db.all(`PRAGMA table_info(server_configs)`, (err, columns) => {
                if (err) return;
                
                const hasYouTubeColumn = columns.some(col => col.name === 'youtube_channel_id');
                if (hasYouTubeColumn) {
                    console.log('✅ YouTube column verified in server_configs');
                } else {
                    console.log('⚠️ YouTube column missing, attempting to add...');
                    this.db.run(`ALTER TABLE server_configs ADD COLUMN youtube_channel_id TEXT`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.log('❌ Failed to add YouTube column:', err.message);
                        } else {
                            console.log('✅ YouTube column added successfully');
                        }
                    });
                }
            });
        });
    }

    runMigrations() {
        // Migration: Add updated_at column to tickets table if it doesn't exist
        this.db.run(`
            ALTER TABLE tickets ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        `, (err) => {
            // Ignore error if column already exists or table doesn't exist
            if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
                console.log('Migration note:', err.message);
            }
        });

        // Migration: Add youtube_channel_id column to server_configs table
        this.db.run(`
            ALTER TABLE server_configs ADD COLUMN youtube_channel_id TEXT
        `, (err) => {
            // Ignore error if column already exists or table doesn't exist
            if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
                console.log('YouTube migration note:', err.message);
            }
        });

        // Migration: Add announcements_channel_id column to server_configs table
        this.db.run(`
            ALTER TABLE server_configs ADD COLUMN announcements_channel_id TEXT
        `, (err) => {
            // Ignore error if column already exists or table doesn't exist
            if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
                console.log('Announcements migration note:', err.message);
            }
        });

        // Migration: Add aquacheese_announcements column to server_configs table
        this.db.run(`
            ALTER TABLE server_configs ADD COLUMN aquacheese_announcements BOOLEAN DEFAULT 0
        `, (err) => {
            // Ignore error if column already exists or table doesn't exist
            if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
                console.log('AquaCheese announcements migration note:', err.message);
            }
        });
    }

    // Server configuration methods
    async getServerConfig(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM server_configs WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async setServerConfig(guildId, config) {
        return new Promise((resolve, reject) => {
            const { adminChannelId, logsChannelId, announcementsChannelId, safeRoles } = config;
            this.db.run(
                `INSERT OR REPLACE INTO server_configs 
                 (guild_id, admin_channel_id, logs_channel_id, announcements_channel_id, safe_roles, updated_at) 
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [guildId, adminChannelId, logsChannelId, announcementsChannelId, JSON.stringify(safeRoles || [])],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    // Server setup history methods for easy redeployment
    async getServerSetupHistory(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM server_setup_history WHERE guild_id = ? AND is_active = 1 ORDER BY last_restored_at DESC, first_setup_at DESC LIMIT 1',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async saveServerSetupHistory(guildId, setupData) {
        return new Promise((resolve, reject) => {
            const {
                guildName,
                setupByUserId,
                setupByUsername,
                adminPasswordHash,
                adminChannelId,
                logsChannelId,
                notes = ''
            } = setupData;

            // Get current configurations to backup
            const configData = this.getServerConfig(guildId);
            const authUsers = this.db.all('SELECT * FROM auth_users');
            const authorizedUsers = this.db.all('SELECT * FROM authorized_users');
            const moderationSettings = this.getModerationSettings(guildId);

            this.db.run(
                `INSERT OR REPLACE INTO server_setup_history 
                 (guild_id, guild_name, setup_by_user_id, setup_by_username, admin_password_hash, 
                  admin_channel_id, logs_channel_id, configuration_data, auth_users_backup, 
                  authorized_users_backup, moderation_settings_backup, notes, last_restored_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    guildId, 
                    guildName, 
                    setupByUserId, 
                    setupByUsername, 
                    adminPasswordHash,
                    adminChannelId,
                    logsChannelId,
                    JSON.stringify(configData),
                    JSON.stringify(authUsers),
                    JSON.stringify(authorizedUsers),
                    JSON.stringify(moderationSettings),
                    notes
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async restoreServerConfiguration(guildId, historyId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM server_setup_history WHERE id = ? AND guild_id = ?',
                [historyId, guildId],
                async (err, setupHistory) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!setupHistory) {
                        reject(new Error('Setup history not found'));
                        return;
                    }

                    try {
                        // Restore server configuration
                        if (setupHistory.configuration_data) {
                            const configData = JSON.parse(setupHistory.configuration_data);
                            await this.setServerConfig(guildId, {
                                adminChannelId: setupHistory.admin_channel_id,
                                logsChannelId: setupHistory.logs_channel_id,
                                safeRoles: configData.safe_roles || []
                            });
                        }

                        // Restore auth users
                        if (setupHistory.auth_users_backup) {
                            const authUsers = JSON.parse(setupHistory.auth_users_backup);
                            for (const user of authUsers) {
                                this.db.run(
                                    `INSERT OR REPLACE INTO auth_users 
                                     (user_id, username, password_hash, totp_secret, backup_codes, is_setup_complete) 
                                     VALUES (?, ?, ?, ?, ?, ?)`,
                                    [user.user_id, user.username, user.password_hash, user.totp_secret, user.backup_codes, user.is_setup_complete]
                                );
                            }
                        }

                        // Restore authorized users
                        if (setupHistory.authorized_users_backup) {
                            const authorizedUsers = JSON.parse(setupHistory.authorized_users_backup);
                            for (const user of authorizedUsers) {
                                this.db.run(
                                    `INSERT OR REPLACE INTO authorized_users 
                                     (user_id, username, granted_by, is_active, permissions) 
                                     VALUES (?, ?, ?, ?, ?)`,
                                    [user.user_id, user.username, user.granted_by, user.is_active, user.permissions]
                                );
                            }
                        }

                        // Update restore count
                        this.db.run(
                            'UPDATE server_setup_history SET restore_count = restore_count + 1, last_restored_at = CURRENT_TIMESTAMP WHERE id = ?',
                            [historyId]
                        );

                        resolve(setupHistory);
                    } catch (restoreError) {
                        reject(restoreError);
                    }
                }
            );
        });
    }

    async markServerSetupHistoryInactive(guildId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE server_setup_history SET is_active = 0 WHERE guild_id = ?',
                [guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Server setup history methods for easy redeployment
    async getServerSetupHistory(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM server_setup_history WHERE guild_id = ? AND is_active = 1',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async saveServerSetupHistory(guildId, setupData) {
        return new Promise((resolve, reject) => {
            const {
                guildName,
                setupByUserId,
                setupByUsername,
                setupByDisplayName,
                adminChannelId,
                logsChannelId,
                passwordHash,
                totpSecret,
                backupCodes,
                authorizedUsers,
                configurationBackup,
                setupVersion
            } = setupData;

            this.db.run(
                `INSERT OR REPLACE INTO server_setup_history 
                 (guild_id, guild_name, setup_by_user_id, setup_by_username, setup_by_display_name,
                  admin_channel_id, logs_channel_id, password_hash, totp_secret, backup_codes,
                  authorized_users, configuration_backup, setup_version, last_access_at, access_count) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 
                         COALESCE((SELECT access_count FROM server_setup_history WHERE guild_id = ?), 0) + 1)`,
                [guildId, guildName, setupByUserId, setupByUsername, setupByDisplayName,
                 adminChannelId, logsChannelId, passwordHash, totpSecret, 
                 JSON.stringify(backupCodes || []), JSON.stringify(authorizedUsers || []),
                 JSON.stringify(configurationBackup || {}), setupVersion || '1.0.0', guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async updateServerAccess(guildId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE server_setup_history 
                 SET last_access_at = CURRENT_TIMESTAMP, access_count = access_count + 1
                 WHERE guild_id = ?`,
                [guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async resetServerSetup(guildId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE server_setup_history SET is_active = 0 WHERE guild_id = ?',
                [guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getServerSetupStats(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT 
                    COUNT(*) as total_setups,
                    MAX(access_count) as max_access_count,
                    MAX(last_access_at) as last_access,
                    MIN(first_setup_at) as first_setup
                 FROM server_setup_history 
                 WHERE guild_id = ?`,
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || {});
                }
            );
        });
    }

    // Moderation settings methods
    async getModerationSettings(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM moderation_settings WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || {});
                }
            );
        });
    }

    async updateModerationSettings(guildId, settings) {
        return new Promise((resolve, reject) => {
            // First check if a record exists
            this.db.get(
                'SELECT guild_id FROM moderation_settings WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (row) {
                        // Update existing record
                        const updateColumns = Object.keys(settings).map(key => `${key} = ?`).join(', ');
                        const values = [...Object.values(settings), guildId];
                        
                        this.db.run(
                            `UPDATE moderation_settings SET ${updateColumns}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?`,
                            values,
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.changes);
                            }
                        );
                    } else {
                        // Insert new record with all default values plus the provided settings
                        const defaultSettings = {
                            spam_protection: 0,
                            spam_message_count: 5,
                            spam_time_window: 5000,
                            spam_punishment: 'timeout',
                            spam_punishment_duration: 300,
                            spam_punishment_unit: 'seconds',
                            raid_protection: 0,
                            raid_user_threshold: 10,
                            raid_time_window: 60,
                            raid_punishment: 'ban',
                            auto_mod: 0,
                            profanity_filter: 0,
                            link_filter: 0,
                            invite_filter: 0,
                            caps_filter: 0,
                            caps_threshold: 70,
                            anti_nuke: 0,
                            channel_create_limit: 3,
                            channel_delete_limit: 3,
                            role_create_limit: 5,
                            role_delete_limit: 5,
                            member_kick_limit: 3,
                            member_ban_limit: 3,
                            mass_ban_limit: 5,
                            warning_system: 0,
                            warning_threshold: 3,
                            warning_auto_punishment: 'timeout',
                            auto_actions: 1,
                            detailed_logging: 1,
                            whitelist_mode: 0,
                            auto_backup: 0,
                            analytics_enabled: 1,
                            ...settings // Override with provided settings
                        };
                        
                        const columns = Object.keys(defaultSettings).join(', ');
                        const placeholders = Object.keys(defaultSettings).map(() => '?').join(', ');
                        const values = [guildId, ...Object.values(defaultSettings)];
                        
                        this.db.run(
                            `INSERT INTO moderation_settings (guild_id, ${columns}, updated_at) VALUES (?, ${placeholders}, CURRENT_TIMESTAMP)`,
                            values,
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    }
                }
            );
        });
    }

    // Warning methods
    async addWarning(guildId, userId, moderatorId, reason) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
                [guildId, userId, moderatorId, reason],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getWarnings(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC',
                [guildId, userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Spam tracking methods
    async updateSpamTracking(guildId, userId) {
        return new Promise((resolve, reject) => {
            const now = Date.now();
            this.db.run(
                `INSERT OR REPLACE INTO spam_tracking 
                 (user_id, guild_id, message_count, first_message_time, last_reset) 
                 VALUES (?, ?, 
                    CASE 
                        WHEN (SELECT first_message_time FROM spam_tracking WHERE user_id = ? AND guild_id = ?) IS NULL 
                        THEN 1
                        ELSE (SELECT message_count FROM spam_tracking WHERE user_id = ? AND guild_id = ?) + 1
                    END,
                    CASE 
                        WHEN (SELECT first_message_time FROM spam_tracking WHERE user_id = ? AND guild_id = ?) IS NULL 
                        THEN ?
                        ELSE (SELECT first_message_time FROM spam_tracking WHERE user_id = ? AND guild_id = ?)
                    END,
                    CURRENT_TIMESTAMP)`,
                [userId, guildId, userId, guildId, userId, guildId, userId, guildId, now, userId, guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getSpamTracking(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM spam_tracking WHERE guild_id = ? AND user_id = ?',
                [guildId, userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async resetSpamTracking(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM spam_tracking WHERE guild_id = ? AND user_id = ?',
                [guildId, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // AFK tracking methods
    async setUserAFK(guildId, userId, durationMinutes, unit) {
        const startTime = Date.now();
        const endTime = startTime + (durationMinutes * 60 * 1000);
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO afk_users 
                 (user_id, guild_id, start_time, end_time, duration_minutes, unit, is_active, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
                [userId, guildId, startTime, endTime, durationMinutes, unit],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getUserAFK(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM afk_users WHERE guild_id = ? AND user_id = ? AND is_active = 1',
                [guildId, userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async removeUserAFK(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE afk_users SET is_active = 0 WHERE guild_id = ? AND user_id = ?',
                [guildId, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getExpiredAFKUsers() {
        const currentTime = Date.now();
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM afk_users WHERE is_active = 1 AND end_time <= ?',
                [currentTime],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // Authorized users methods
    async addAuthorizedUser(userId, username, grantedBy, permissions = ['*']) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO authorized_users 
                 (user_id, username, granted_by, granted_at, is_active, permissions) 
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1, ?)`,
                [userId, username, grantedBy, JSON.stringify(permissions)],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async removeAuthorizedUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE authorized_users SET is_active = 0 WHERE user_id = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async isUserAuthorized(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM authorized_users WHERE user_id = ? AND is_active = 1',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(!!row);
                }
            );
        });
    }

    async getAuthorizedUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM authorized_users WHERE user_id = ? AND is_active = 1',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async getAllAuthorizedUsers() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM authorized_users WHERE is_active = 1 ORDER BY granted_at ASC',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // Ticketing system methods
    async createTicket(guildId, channelId, userId, username, subject, priority = 'normal') {
        return new Promise((resolve, reject) => {
            // First get and increment ticket counter
            this.db.get(
                'SELECT ticket_counter FROM ticket_config WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const ticketNumber = (row?.ticket_counter || 0) + 1;
                    
                    // Update counter
                    this.db.run(
                        `INSERT OR REPLACE INTO ticket_config 
                         (guild_id, ticket_counter, updated_at) 
                         VALUES (?, ?, CURRENT_TIMESTAMP)`,
                        [guildId, ticketNumber],
                        (updateErr) => {
                            if (updateErr) {
                                reject(updateErr);
                                return;
                            }
                            
                            // Create ticket
                            this.db.run(
                                `INSERT INTO tickets 
                                 (guild_id, channel_id, user_id, username, subject, priority, ticket_number) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [guildId, channelId, userId, username, subject, priority, ticketNumber],
                                function(err) {
                                    if (err) reject(err);
                                    else resolve({ ticketId: this.lastID, ticketNumber });
                                }
                            );
                        }
                    );
                }
            );
        });
    }

    async getTicket(channelId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM tickets WHERE channel_id = ? AND status != "closed"',
                [channelId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async getTicketById(ticketId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM tickets WHERE id = ?',
                [ticketId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async updateTicket(ticketId, updates) {
        return new Promise((resolve, reject) => {
            const updateColumns = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), ticketId];
            
            this.db.run(
                `UPDATE tickets SET ${updateColumns}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async closeTicket(ticketId, reason = 'No reason provided') {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP, close_reason = ? WHERE id = ?`,
                [reason, ticketId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getTicketConfig(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM ticket_config WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async setTicketConfig(guildId, config) {
        return new Promise((resolve, reject) => {
            const columns = Object.keys(config).join(', ');
            const placeholders = Object.keys(config).map(() => '?').join(', ');
            const values = [guildId, ...Object.values(config)];
            
            this.db.run(
                `INSERT OR REPLACE INTO ticket_config (guild_id, ${columns}, updated_at) VALUES (?, ${placeholders}, CURRENT_TIMESTAMP)`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async addTicketMessage(ticketId, userId, username, messageContent) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO ticket_messages (ticket_id, user_id, username, message_content) VALUES (?, ?, ?, ?)',
                [ticketId, userId, username, messageContent],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getTicketMessages(ticketId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY timestamp ASC',
                [ticketId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async getGuildTickets(guildId, status = 'open') {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM tickets WHERE guild_id = ? AND status = ? ORDER BY created_at DESC',
                [guildId, status],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // ===== COUNTING SYSTEM METHODS =====
    
    async setCountingChannel(guildId, channelId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO counting_channels (guild_id, channel_id, current_number, last_user_id, highest_number, total_correct, total_incorrect, updated_at) VALUES (?, ?, 0, NULL, 0, 0, 0, CURRENT_TIMESTAMP)',
                [guildId, channelId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getCountingChannel(guildId, channelId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM counting_channels WHERE guild_id = ? AND channel_id = ?',
                [guildId, channelId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async getAllCountingChannels(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM counting_channels WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async updateCountingChannel(guildId, channelId, updates) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), guildId, channelId];
            
            this.db.run(
                `UPDATE counting_channels SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ? AND channel_id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async removeCountingChannel(guildId, channelId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM counting_channels WHERE guild_id = ? AND channel_id = ?',
                [guildId, channelId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getCountingStats(userId, guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM counting_stats WHERE user_id = ? AND guild_id = ?',
                [userId, guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async updateCountingStats(userId, guildId, updates) {
        return new Promise((resolve, reject) => {
            // First check if user stats exist
            this.db.get(
                'SELECT * FROM counting_stats WHERE user_id = ? AND guild_id = ?',
                [userId, guildId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        // Create new stats entry
                        this.db.run(
                            'INSERT INTO counting_stats (user_id, guild_id, correct_count, incorrect_count, highest_number, last_number, streak, best_streak) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [userId, guildId, updates.correct_count || 0, updates.incorrect_count || 0, updates.highest_number || 0, updates.last_number || 0, updates.streak || 0, updates.best_streak || 0],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    } else {
                        // Update existing stats
                        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
                        const values = [...Object.values(updates), userId, guildId];
                        
                        this.db.run(
                            `UPDATE counting_stats SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?`,
                            values,
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.changes);
                            }
                        );
                    }
                }
            );
        });
    }

    async getTopCountingUsers(guildId, limit = 10, sortBy = 'correct_count') {
        return new Promise((resolve, reject) => {
            const validSortFields = ['correct_count', 'highest_number', 'best_streak'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'correct_count';
            
            this.db.all(
                `SELECT * FROM counting_stats WHERE guild_id = ? ORDER BY ${sortField} DESC LIMIT ?`,
                [guildId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async addCountingHistory(guildId, channelId, userId, username, numberAttempted, expectedNumber, wasCorrect) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO counting_history (guild_id, channel_id, user_id, username, number_attempted, expected_number, was_correct) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [guildId, channelId, userId, username, numberAttempted, expectedNumber, wasCorrect],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getCountingHistory(guildId, channelId, limit = 50) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM counting_history WHERE guild_id = ? AND channel_id = ? ORDER BY timestamp DESC LIMIT ?',
                [guildId, channelId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async getCountingLeaderboard(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT 
                    user_id,
                    correct_count,
                    incorrect_count,
                    highest_number,
                    best_streak,
                    ROUND((CAST(correct_count AS FLOAT) / NULLIF(correct_count + incorrect_count, 0)) * 100, 2) as accuracy_rate
                FROM counting_stats 
                WHERE guild_id = ? AND (correct_count > 0 OR incorrect_count > 0)
                ORDER BY correct_count DESC, accuracy_rate DESC 
                LIMIT 20`,
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // ===== CONFIGURATION PERSISTENCE METHODS =====

    async initializeServerDefaults(guildId) {
        return new Promise((resolve, reject) => {
            // Create default server config
            this.db.run(
                `INSERT OR IGNORE INTO server_configs (guild_id, panic_mode, safe_roles) 
                 VALUES (?, 0, '[]')`,
                [guildId],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Create default moderation settings
                    this.db.run(
                        `INSERT OR IGNORE INTO moderation_settings (guild_id) VALUES (?)`,
                        [guildId],
                        (settingsErr) => {
                            if (settingsErr) reject(settingsErr);
                            else resolve();
                        }
                    );
                }
            );
        });
    }

    async markServerAsLeft(guildId) {
        return new Promise((resolve, reject) => {
            // Update the server config to mark when the bot left
            this.db.run(
                `UPDATE server_configs 
                 SET updated_at = CURRENT_TIMESTAMP,
                     left_at = CURRENT_TIMESTAMP
                 WHERE guild_id = ?`,
                [guildId],
                (err) => {
                    if (err) {
                        // If no config exists, create one with left_at timestamp
                        this.db.run(
                            `INSERT OR IGNORE INTO server_configs (guild_id, panic_mode, safe_roles, left_at) 
                             VALUES (?, 0, '[]', CURRENT_TIMESTAMP)`,
                            [guildId],
                            (insertErr) => {
                                if (insertErr) reject(insertErr);
                                else resolve();
                            }
                        );
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    async updateServerConfig(guildId, updates) {
        return new Promise((resolve, reject) => {
            const updateFields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                updateFields.push(`${key} = ?`);
                values.push(value);
            }
            
            if (updateFields.length === 0) {
                resolve();
                return;
            }
            
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(guildId);
            
            const query = `UPDATE server_configs SET ${updateFields.join(', ')} WHERE guild_id = ?`;
            
            this.db.run(query, values, function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async createServerConfig(guildId, config = {}) {
        return new Promise((resolve, reject) => {
            const fields = ['guild_id'];
            const placeholders = ['?'];
            const values = [guildId];
            
            // Add any provided config fields
            for (const [key, value] of Object.entries(config)) {
                fields.push(key);
                placeholders.push('?');
                values.push(value);
            }
            
            const query = `INSERT OR REPLACE INTO server_configs (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            
            this.db.run(query, values, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getConfigurationBackup(guildId) {
        return new Promise((resolve, reject) => {
            // Get complete configuration including timestamps
            this.db.get(
                `SELECT sc.*, ms.* 
                 FROM server_configs sc 
                 LEFT JOIN moderation_settings ms ON sc.guild_id = ms.guild_id 
                 WHERE sc.guild_id = ?`,
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async exportServerConfiguration(guildId) {
        return new Promise((resolve, reject) => {
            // Get all configuration data for complete backup/export
            const configData = {
                guildId: guildId,
                exportedAt: new Date().toISOString(),
                botVersion: require('./package.json').version || '1.0.0',
                exportType: 'complete_backup'
            };
            
            // Counter for tracking completion
            let completedQueries = 0;
            const totalQueries = 12;
            const errors = [];
            
            const checkCompletion = () => {
                completedQueries++;
                if (completedQueries === totalQueries) {
                    if (errors.length > 0) {
                        console.warn('Some data could not be exported:', errors);
                    }
                    resolve(configData);
                }
            };
            
            // 1. Server configuration
            this.db.get(
                'SELECT * FROM server_configs WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) errors.push('server_configs: ' + err.message);
                    else configData.serverConfig = row;
                    checkCompletion();
                }
            );
            
            // 2. Moderation settings
            this.db.get(
                'SELECT * FROM moderation_settings WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) errors.push('moderation_settings: ' + err.message);
                    else configData.moderationSettings = row;
                    checkCompletion();
                }
            );
            
            // 3. Authorized users (global, not guild-specific)
            this.db.all(
                'SELECT * FROM authorized_users WHERE is_active = 1',
                [],
                (err, rows) => {
                    if (err) errors.push('authorized_users: ' + err.message);
                    else configData.authorizedUsers = rows || [];
                    checkCompletion();
                }
            );
            
            // 4. User warnings for this guild
            this.db.all(
                'SELECT * FROM user_warnings WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) errors.push('user_warnings: ' + err.message);
                    else configData.userWarnings = rows || [];
                    checkCompletion();
                }
            );
            
            // 5. AFK users for this guild
            this.db.all(
                'SELECT * FROM afk_users WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) errors.push('afk_users: ' + err.message);
                    else configData.afkUsers = rows || [];
                    checkCompletion();
                }
            );
            
            // 6. Birthday data for this guild
            this.db.all(
                'SELECT * FROM birthdays WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) errors.push('birthdays: ' + err.message);
                    else configData.birthdays = rows || [];
                    checkCompletion();
                }
            );
            
            // 7. Tickets for this guild
            this.db.all(
                'SELECT * FROM tickets WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) errors.push('tickets: ' + err.message);
                    else configData.tickets = rows || [];
                    checkCompletion();
                }
            );
            
            // 8. Ticket configuration
            this.db.get(
                'SELECT * FROM ticket_config WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) errors.push('ticket_config: ' + err.message);
                    else configData.ticketConfig = row;
                    checkCompletion();
                }
            );
            
            // 9. Counting channels
            this.db.all(
                'SELECT * FROM counting_channels WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) errors.push('counting_channels: ' + err.message);
                    else configData.countingChannels = rows || [];
                    checkCompletion();
                }
            );
            
            // 10. Counting statistics
            this.db.all(
                'SELECT * FROM counting_stats WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) errors.push('counting_stats: ' + err.message);
                    else configData.countingStats = rows || [];
                    checkCompletion();
                }
            );
            
            // 11. Counting history (last 100 entries to avoid huge files)
            this.db.all(
                'SELECT * FROM counting_history WHERE guild_id = ? ORDER BY timestamp DESC LIMIT 100',
                [guildId],
                (err, rows) => {
                    if (err) errors.push('counting_history: ' + err.message);
                    else configData.countingHistory = rows || [];
                    checkCompletion();
                }
            );
            
            // 12. User info cache for this guild
            this.db.all(
                'SELECT * FROM user_info_cache WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) errors.push('user_info_cache: ' + err.message);
                    else configData.userInfoCache = rows || [];
                    checkCompletion();
                }
            );
        });
    }

    async importServerConfiguration(guildId, configData) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                try {
                    // 1. Import server config
                    if (configData.serverConfig) {
                        const config = configData.serverConfig;
                        this.db.run(
                            `INSERT OR REPLACE INTO server_configs 
                             (guild_id, admin_channel_id, logs_channel_id, panic_mode, safe_roles, updated_at) 
                             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                            [guildId, config.admin_channel_id, config.logs_channel_id, 
                             config.panic_mode, config.safe_roles]
                        );
                    }
                    
                    // 2. Import moderation settings
                    if (configData.moderationSettings) {
                        const settings = configData.moderationSettings;
                        const fields = Object.keys(settings).filter(key => 
                            key !== 'guild_id' && key !== 'created_at' && key !== 'updated_at'
                        );
                        const placeholders = fields.map(() => '?').join(', ');
                        const values = fields.map(field => settings[field]);
                        
                        this.db.run(
                            `INSERT OR REPLACE INTO moderation_settings 
                             (guild_id, ${fields.join(', ')}, updated_at) 
                             VALUES (?, ${placeholders}, CURRENT_TIMESTAMP)`,
                            [guildId, ...values]
                        );
                    }
                    
                    // 3. Import authorized users (global data)
                    if (configData.authorizedUsers && configData.authorizedUsers.length > 0) {
                        // Clear existing authorized users first
                        this.db.run('DELETE FROM authorized_users WHERE is_active = 1');
                        
                        for (const user of configData.authorizedUsers) {
                            this.db.run(
                                `INSERT OR REPLACE INTO authorized_users 
                                 (user_id, username, granted_by, granted_at, is_active, permissions) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [user.user_id, user.username, user.granted_by, 
                                 user.granted_at, user.is_active, user.permissions]
                            );
                        }
                    }
                    
                    // 4. Import user warnings
                    if (configData.userWarnings && configData.userWarnings.length > 0) {
                        // Clear existing warnings for this guild
                        this.db.run('DELETE FROM user_warnings WHERE guild_id = ?', [guildId]);
                        
                        for (const warning of configData.userWarnings) {
                            this.db.run(
                                `INSERT INTO user_warnings 
                                 (user_id, guild_id, warned_by, reason, created_at) 
                                 VALUES (?, ?, ?, ?, ?)`,
                                [warning.user_id, guildId, warning.warned_by, 
                                 warning.reason, warning.created_at]
                            );
                        }
                    }
                    
                    // 5. Import AFK users
                    if (configData.afkUsers && configData.afkUsers.length > 0) {
                        this.db.run('DELETE FROM afk_users WHERE guild_id = ?', [guildId]);
                        
                        for (const afkUser of configData.afkUsers) {
                            this.db.run(
                                `INSERT INTO afk_users 
                                 (user_id, guild_id, reason, until_timestamp, created_at) 
                                 VALUES (?, ?, ?, ?, ?)`,
                                [afkUser.user_id, guildId, afkUser.reason, 
                                 afkUser.until_timestamp, afkUser.created_at]
                            );
                        }
                    }
                    
                    // 6. Import birthdays
                    if (configData.birthdays && configData.birthdays.length > 0) {
                        this.db.run('DELETE FROM birthdays WHERE guild_id = ?', [guildId]);
                        
                        for (const birthday of configData.birthdays) {
                            this.db.run(
                                `INSERT INTO birthdays 
                                 (user_id, guild_id, day, month, created_at, updated_at) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [birthday.user_id, guildId, birthday.day, birthday.month,
                                 birthday.created_at, birthday.updated_at]
                            );
                        }
                    }
                    
                    // 7. Import ticket configuration
                    if (configData.ticketConfig) {
                        const config = configData.ticketConfig;
                        this.db.run(
                            `INSERT OR REPLACE INTO ticket_config 
                             (guild_id, ticket_category_id, transcript_channel_id, staff_role_id, ticket_counter, updated_at) 
                             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                            [guildId, config.ticket_category_id, config.transcript_channel_id,
                             config.staff_role_id, config.ticket_counter]
                        );
                    }
                    
                    // 8. Import tickets (closed tickets only for history)
                    if (configData.tickets && configData.tickets.length > 0) {
                        this.db.run('DELETE FROM tickets WHERE guild_id = ? AND status = "closed"', [guildId]);
                        
                        for (const ticket of configData.tickets.filter(t => t.status === 'closed')) {
                            this.db.run(
                                `INSERT INTO tickets 
                                 (guild_id, channel_id, user_id, username, subject, status, priority, 
                                  claimed_by, claimed_by_username, thread_id, ticket_number, 
                                  created_at, updated_at, closed_at, close_reason) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [guildId, ticket.channel_id, ticket.user_id, ticket.username,
                                 ticket.subject, ticket.status, ticket.priority, ticket.claimed_by,
                                 ticket.claimed_by_username, ticket.thread_id, ticket.ticket_number,
                                 ticket.created_at, ticket.updated_at, ticket.closed_at, ticket.close_reason]
                            );
                        }
                    }
                    
                    // 9. Import counting channels
                    if (configData.countingChannels && configData.countingChannels.length > 0) {
                        this.db.run('DELETE FROM counting_channels WHERE guild_id = ?', [guildId]);
                        
                        for (const channel of configData.countingChannels) {
                            this.db.run(
                                `INSERT INTO counting_channels 
                                 (guild_id, channel_id, current_number, last_user_id, created_at, updated_at) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [guildId, channel.channel_id, channel.current_number,
                                 channel.last_user_id, channel.created_at, channel.updated_at]
                            );
                        }
                    }
                    
                    // 10. Import counting statistics
                    if (configData.countingStats && configData.countingStats.length > 0) {
                        this.db.run('DELETE FROM counting_stats WHERE guild_id = ?', [guildId]);
                        
                        for (const stat of configData.countingStats) {
                            this.db.run(
                                `INSERT INTO counting_stats 
                                 (user_id, guild_id, correct_count, incorrect_count, highest_number, 
                                  last_number, streak, best_streak, created_at, updated_at) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [stat.user_id, guildId, stat.correct_count, stat.incorrect_count,
                                 stat.highest_number, stat.last_number, stat.streak, stat.best_streak,
                                 stat.created_at, stat.updated_at]
                            );
                        }
                    }
                    
                    // 11. Import counting history (recent entries only)
                    if (configData.countingHistory && configData.countingHistory.length > 0) {
                        this.db.run('DELETE FROM counting_history WHERE guild_id = ?', [guildId]);
                        
                        for (const entry of configData.countingHistory) {
                            this.db.run(
                                `INSERT INTO counting_history 
                                 (guild_id, channel_id, user_id, username, number_attempted, 
                                  expected_number, was_correct, timestamp) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                [guildId, entry.channel_id, entry.user_id, entry.username,
                                 entry.number_attempted, entry.expected_number, entry.was_correct, entry.timestamp]
                            );
                        }
                    }
                    
                    // 12. Import user info cache
                    if (configData.userInfoCache && configData.userInfoCache.length > 0) {
                        this.db.run('DELETE FROM user_info_cache WHERE guild_id = ?', [guildId]);
                        
                        for (const userInfo of configData.userInfoCache) {
                            this.db.run(
                                `INSERT INTO user_info_cache 
                                 (user_id, guild_id, username, discriminator, display_name, avatar_url,
                                  account_created, first_seen, last_seen, message_count, warning_count,
                                  previous_violations, risk_level, updated_at) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [userInfo.user_id, guildId, userInfo.username, userInfo.discriminator,
                                 userInfo.display_name, userInfo.avatar_url, userInfo.account_created,
                                 userInfo.first_seen, userInfo.last_seen, userInfo.message_count,
                                 userInfo.warning_count, userInfo.previous_violations, userInfo.risk_level,
                                 userInfo.updated_at]
                            );
                        }
                    }
                    
                    this.db.run('COMMIT', (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                    
                } catch (error) {
                    this.db.run('ROLLBACK');
                    reject(error);
                }
            });
        });
    }

    // ===== ILLEGAL CONTENT INCIDENT MANAGEMENT =====

    async createIllegalContentIncident(incidentData) {
        return new Promise((resolve, reject) => {
            const incidentId = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            this.db.run(
                `INSERT INTO illegal_content_incidents (
                    incident_id, guild_id, guild_name, channel_id, channel_name,
                    user_id, username, discriminator, user_created_at, account_age_days,
                    message_id, message_content, attachment_count, attachment_info,
                    incident_type, severity, reporter_id, reporter_username,
                    evidence_preserved, additional_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    incidentId, incidentData.guild_id, incidentData.guild_name,
                    incidentData.channel_id, incidentData.channel_name,
                    incidentData.user_id, incidentData.username, incidentData.discriminator,
                    incidentData.user_created_at, incidentData.account_age_days,
                    incidentData.message_id, incidentData.message_content,
                    incidentData.attachment_count, incidentData.attachment_info,
                    incidentData.incident_type, incidentData.severity,
                    incidentData.reporter_id, incidentData.reporter_username,
                    incidentData.evidence_preserved, incidentData.additional_notes
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve({ incidentId, dbId: this.lastID });
                }
            );
        });
    }

    async updateIllegalContentIncident(incidentId, updates) {
        return new Promise((resolve, reject) => {
            const updateFields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                updateFields.push(`${key} = ?`);
                values.push(value);
            }
            
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(incidentId);
            
            const query = `UPDATE illegal_content_incidents SET ${updateFields.join(', ')} WHERE incident_id = ?`;
            
            this.db.run(query, values, function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async getIllegalContentIncident(incidentId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM illegal_content_incidents WHERE incident_id = ?',
                [incidentId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async getAllIllegalContentIncidents(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM illegal_content_incidents WHERE guild_id = ? ORDER BY created_at DESC',
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // ===== ENHANCED MODERATION LOGGING =====

    async createEnhancedModLog(logData) {
        return new Promise((resolve, reject) => {
            const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            this.db.run(
                `INSERT INTO enhanced_mod_logs (
                    log_id, guild_id, action_type, severity, target_user_id, target_username,
                    moderator_user_id, moderator_username, channel_id, message_id,
                    evidence_data, user_info, action_taken, follow_up_required, case_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    logId, logData.guild_id, logData.action_type, logData.severity,
                    logData.target_user_id, logData.target_username,
                    logData.moderator_user_id, logData.moderator_username,
                    logData.channel_id, logData.message_id,
                    JSON.stringify(logData.evidence_data), JSON.stringify(logData.user_info),
                    logData.action_taken, logData.follow_up_required, logData.case_number
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve({ logId, dbId: this.lastID });
                }
            );
        });
    }

    // ===== USER INFO CACHE =====

    async updateUserInfoCache(userId, guildId, userInfo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO user_info_cache (
                    user_id, guild_id, username, discriminator, display_name,
                    avatar_url, account_created, first_seen, last_seen,
                    message_count, warning_count, previous_violations, risk_level, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    userId, guildId, userInfo.username, userInfo.discriminator,
                    userInfo.display_name, userInfo.avatar_url, userInfo.account_created,
                    userInfo.first_seen, userInfo.last_seen, userInfo.message_count,
                    userInfo.warning_count, JSON.stringify(userInfo.previous_violations),
                    userInfo.risk_level
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getUserInfoCache(userId, guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM user_info_cache WHERE user_id = ? AND guild_id = ?',
                [userId, guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    // Goal system methods
    async createGoal(guildId, goalData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO server_goals 
                (guild_id, goal_type, title, description, emoji, target_amount, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    guildId,
                    goalData.type,
                    goalData.title,
                    goalData.description,
                    goalData.emoji || '🎯',
                    goalData.target,
                    goalData.createdBy
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getServerGoals(guildId, activeOnly = true) {
        return new Promise((resolve, reject) => {
            const query = activeOnly 
                ? 'SELECT * FROM server_goals WHERE guild_id = ? AND is_active = 1 ORDER BY created_at DESC'
                : 'SELECT * FROM server_goals WHERE guild_id = ? ORDER BY created_at DESC';
            
            this.db.all(query, [guildId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async getGoalById(goalId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM server_goals WHERE id = ?',
                [goalId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async updateGoalProgress(goalId, newProgress, updatedBy, changeType = 'manual') {
        return new Promise((resolve, reject) => {
            // First get current progress
            this.db.get('SELECT * FROM server_goals WHERE id = ?', [goalId], (err, goal) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!goal) {
                    reject(new Error('Goal not found'));
                    return;
                }

                const previousProgress = goal.current_progress;
                const changeAmount = newProgress - previousProgress;
                const isCompleted = newProgress >= goal.target_amount;

                // Update goal progress
                this.db.run(
                    `UPDATE server_goals 
                    SET current_progress = ?, 
                        is_completed = ?, 
                        completed_at = ?,
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?`,
                    [newProgress, isCompleted, isCompleted ? new Date().toISOString() : null, goalId],
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Log progress change
                        this.db.run(
                            `INSERT INTO goal_progress_history 
                            (goal_id, guild_id, previous_progress, new_progress, change_amount, change_type, updated_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [goalId, goal.guild_id, previousProgress, newProgress, changeAmount, changeType, updatedBy],
                            (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({
                                        goalId,
                                        previousProgress,
                                        newProgress,
                                        changeAmount,
                                        isCompleted,
                                        wasCompleted: goal.is_completed
                                    });
                                }
                            }
                        );
                    }
                );
            });
        });
    }

    async deleteGoal(goalId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE server_goals SET is_active = 0 WHERE id = ?',
                [goalId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }

    async logGoalCelebration(goalId, guildId, celebrationData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO goal_celebrations 
                (goal_id, guild_id, celebration_message_id, celebration_channel_id, progress_at_celebration)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    goalId,
                    guildId,
                    celebrationData.messageId,
                    celebrationData.channelId,
                    celebrationData.progress
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getGoalProgressHistory(goalId, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM goal_progress_history WHERE goal_id = ? ORDER BY updated_at DESC LIMIT ?',
                [goalId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // Auto-tracking methods for different goal types
    async updateBoostGoals(guildId, currentBoosts) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM server_goals WHERE guild_id = ? AND goal_type = ? AND is_active = 1',
                [guildId, 'boosts'],
                async (err, goals) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const updates = [];
                    for (const goal of goals) {
                        if (goal.current_progress !== currentBoosts) {
                            try {
                                const result = await this.updateGoalProgress(
                                    goal.id, 
                                    currentBoosts, 
                                    'system', 
                                    'auto_boost_update'
                                );
                                updates.push(result);
                            } catch (error) {
                                console.error('Error updating boost goal:', error);
                            }
                        }
                    }
                    resolve(updates);
                }
            );
        });
    }

    async updateMemberGoals(guildId, currentMembers) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM server_goals WHERE guild_id = ? AND goal_type = ? AND is_active = 1',
                [guildId, 'members'],
                async (err, goals) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const updates = [];
                    for (const goal of goals) {
                        if (goal.current_progress !== currentMembers) {
                            try {
                                const result = await this.updateGoalProgress(
                                    goal.id, 
                                    currentMembers, 
                                    'system', 
                                    'auto_member_update'
                                );
                                updates.push(result);
                            } catch (error) {
                                console.error('Error updating member goal:', error);
                            }
                        }
                    }
                    resolve(updates);
                }
            );
        });
    }

    // Cheese Clicker Game Methods
    async getCheeseClickerPlayer(userId, guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM cheese_clicker_players WHERE user_id = ? AND guild_id = ?',
                [userId, guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async createCheeseClickerPlayer(userId, guildId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO cheese_clicker_players 
                 (user_id, guild_id, cheese_count, total_cheese_clicked, cheese_per_second, cheese_per_click) 
                 VALUES (?, ?, 0, 0, 0, 1)`,
                [userId, guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async updateCheeseClickerPlayer(userId, guildId, data) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];
            
            if (data.cheese_count !== undefined) {
                fields.push('cheese_count = ?');
                values.push(data.cheese_count);
            }
            if (data.total_cheese_clicked !== undefined) {
                fields.push('total_cheese_clicked = ?');
                values.push(data.total_cheese_clicked);
            }
            if (data.cheese_per_second !== undefined) {
                fields.push('cheese_per_second = ?');
                values.push(data.cheese_per_second);
            }
            if (data.cheese_per_click !== undefined) {
                fields.push('cheese_per_click = ?');
                values.push(data.cheese_per_click);
            }
            
            fields.push('last_updated = ?');
            values.push(Math.floor(Date.now() / 1000));
            
            values.push(userId, guildId);
            
            this.db.run(
                `UPDATE cheese_clicker_players SET ${fields.join(', ')} WHERE user_id = ? AND guild_id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getCheeseClickerUpgrades(userId, guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM cheese_clicker_upgrades WHERE user_id = ? AND guild_id = ?',
                [userId, guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async updateCheeseClickerUpgrade(userId, guildId, upgradeId, quantity) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO cheese_clicker_upgrades 
                 (user_id, guild_id, upgrade_id, quantity) 
                 VALUES (?, ?, ?, ?)`,
                [userId, guildId, upgradeId, quantity],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getCheeseClickerLeaderboard(guildId, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT user_id, cheese_count, total_cheese_clicked, cheese_per_second 
                 FROM cheese_clicker_players 
                 WHERE guild_id = ? 
                 ORDER BY cheese_count DESC 
                 LIMIT ?`,
                [guildId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;
