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

    close() {
        this.db.close();
    }
}

module.exports = Database;
