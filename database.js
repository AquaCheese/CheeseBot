const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'guardian.db'));
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

        // Run migrations
        this.runMigrations();
    }

    runMigrations() {
        // Migration: Add updated_at column to tickets table if it doesn't exist
        this.db.run(`
            ALTER TABLE tickets ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        `, (err) => {
            // Ignore error if column already exists
            if (err && !err.message.includes('duplicate column name')) {
                console.log('Migration note:', err.message);
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
            const { adminChannelId, logsChannelId, safeRoles } = config;
            this.db.run(
                `INSERT OR REPLACE INTO server_configs 
                 (guild_id, admin_channel_id, logs_channel_id, safe_roles, updated_at) 
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [guildId, adminChannelId, logsChannelId, JSON.stringify(safeRoles || [])],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
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

    close() {
        this.db.close();
    }
}

module.exports = Database;
