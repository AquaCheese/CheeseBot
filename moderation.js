const { EmbedBuilder } = require('discord.js');

class ModerationSystem {
    constructor(database) {
        this.db = database;
        this.spamTracking = new Map(); // user_id -> { messages: [], firstMessage: timestamp }
        this.raidTracking = new Map(); // guild_id -> { joins: [], firstJoin: timestamp }
        this.antiNukeTracking = new Map(); // guild_id -> { user_id -> { action_type -> timestamps[] } }
    }

    async checkSpamProtection(message) {
        try {
            const settings = await this.db.getModerationSettings(message.guild.id);
            if (!settings || !settings.spam_protection) {
                return false;
            }

            const userId = message.author.id;
            const guildId = message.guild.id;
            const now = Date.now();
            
            const key = `${guildId}_${userId}`;
            
            // Initialize tracking if not exists
            if (!this.spamTracking.has(key)) {
                this.spamTracking.set(key, {
                    messages: [now],
                    firstMessage: now
                });
                return false;
            }

            const userData = this.spamTracking.get(key);
            
            // Clean old messages outside the time window
            const timeWindow = settings.spam_time_window || 5000;
            const cutoffTime = now - timeWindow;
            userData.messages = userData.messages.filter(timestamp => timestamp > cutoffTime);
            
            // Add current message
            userData.messages.push(now);
            
            // Check if spam threshold is exceeded
            const messageThreshold = settings.spam_message_count || 5;
            
            console.log(`🔍 Spam check for ${message.author.tag}:`, {
                messageCount: userData.messages.length,
                threshold: messageThreshold,
                timeWindow: timeWindow / 1000 + 's',
                punishment: settings.spam_punishment,
                duration: settings.spam_punishment_duration
            });
            
            if (userData.messages.length >= messageThreshold) {
                console.log(`🚨 Spam detected! User ${message.author.tag} sent ${userData.messages.length} messages in ${timeWindow/1000}s`);
                
                // Delete the spam message
                try {
                    await message.delete();
                } catch (deleteError) {
                    console.error('Failed to delete spam message:', deleteError);
                }
                
                // Apply punishment
                await this.punishUser(
                    message.member, 
                    settings.spam_punishment || 'timeout', 
                    settings.spam_punishment_duration || 600, 
                    settings.spam_punishment_unit || 'seconds', 
                    `Spam detected: ${userData.messages.length} messages in ${timeWindow/1000} seconds`
                );
                
                // Reset tracking for this user
                this.spamTracking.delete(key);
                
                // Log the action
                await this.logModerationAction(
                    message.guild, 
                    message.author, 
                    message.client.user, 
                    'spam_punishment', 
                    `Automatic spam detection: ${userData.messages.length} messages in ${timeWindow/1000}s`
                );
                
                return true;
            }

            // Update tracking data
            this.spamTracking.set(key, userData);
            return false;
            
        } catch (error) {
            console.error('Error in spam protection:', error);
            return false;
        }
    }

    async checkRaidProtection(member) {
        const settings = await this.db.getModerationSettings(member.guild.id);
        if (!settings.raid_protection) return false;

        const guildId = member.guild.id;
        const now = Date.now();
        
        if (!this.raidTracking.has(guildId)) {
            this.raidTracking.set(guildId, {
                joins: [{ userId: member.id, timestamp: now }],
                firstJoin: now
            });
            return false;
        }

        const guildData = this.raidTracking.get(guildId);
        
        // Clean old joins outside the time window
        const timeWindow = (settings.raid_time_window || 60) * 1000;
        guildData.joins = guildData.joins.filter(join => now - join.timestamp < timeWindow);
        
        // Add current join
        guildData.joins.push({ userId: member.id, timestamp: now });
        
        // Check if raid threshold is exceeded
        const userThreshold = settings.raid_user_threshold || 10;
        if (guildData.joins.length >= userThreshold) {
            // Trigger raid protection
            await this.handleRaidDetection(member.guild, guildData.joins, settings);
            
            // Reset tracking
            this.raidTracking.delete(guildId);
            
            return true;
        }

        this.raidTracking.set(guildId, guildData);
        return false;
    }

    async handleRaidDetection(guild, raidMembers, settings) {
        console.log(`🚨 Raid detected in ${guild.name}! Taking action against ${raidMembers.length} users.`);
        
        for (const raidMember of raidMembers) {
            try {
                const member = await guild.members.fetch(raidMember.userId);
                if (member) {
                    if (settings.raid_punishment === 'ban') {
                        await member.ban({ reason: 'Automatic raid protection' });
                    } else if (settings.raid_punishment === 'kick') {
                        await member.kick('Automatic raid protection');
                    }
                }
            } catch (error) {
                console.error(`Failed to punish raid member ${raidMember.userId}:`, error);
            }
        }

        // Log the raid event
        await this.logModerationAction(guild, null, guild.client.user, 'raid_protection', `Raid detected: ${raidMembers.length} users affected`);
    }

    async checkAutoModeration(message) {
        const settings = await this.db.getModerationSettings(message.guild.id);
        if (!settings.auto_mod) return false;

        let violations = [];

        // Profanity filter
        if (settings.profanity_filter) {
            if (this.containsProfanity(message.content)) {
                violations.push('profanity');
            }
        }

        // Link filter
        if (settings.link_filter) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            if (urlRegex.test(message.content)) {
                violations.push('links');
            }
        }

        // Invite filter
        if (settings.invite_filter) {
            const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)[a-zA-Z0-9]+/g;
            if (inviteRegex.test(message.content)) {
                violations.push('invites');
            }
        }

        // Caps filter
        if (settings.caps_filter) {
            const capsPercentage = this.calculateCapsPercentage(message.content);
            const threshold = settings.caps_threshold || 70;
            if (capsPercentage > threshold && message.content.length > 10) {
                violations.push('excessive_caps');
            }
        }

        if (violations.length > 0) {
            try {
                await message.delete();
                
                // Send warning to user
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Message Removed')
                    .setDescription(`Your message was removed for: ${violations.join(', ')}`)
                    .setColor(0xFF6B6B)
                    .setTimestamp();

                const warning = await message.channel.send({ 
                    content: `${message.author}`, 
                    embeds: [embed] 
                });

                // Auto-delete warning after 5 seconds
                setTimeout(() => {
                    warning.delete().catch(() => {});
                }, 5000);

                // Log the action
                await this.logModerationAction(message.guild, message.author, message.client.user, 'auto_moderation', `Violations: ${violations.join(', ')}`);
                
                return true;
            } catch (error) {
                console.error('Auto-moderation error:', error);
            }
        }

        return false;
    }

    containsProfanity(content) {
        // Basic profanity filter - in production, use a comprehensive word list
        const profanityWords = [
            'fuck', 'shit', 'damn', 'bitch', 'ass', 'asshole', 'bastard', 'crap',
            'piss', 'slut', 'whore', 'fag', 'nigger', 'retard', 'gay', 'stupid'
        ];
        
        const cleanContent = content.toLowerCase().replace(/[^a-z]/g, '');
        return profanityWords.some(word => cleanContent.includes(word));
    }

    calculateCapsPercentage(text) {
        if (text.length === 0) return 0;
        
        const letters = text.replace(/[^a-zA-Z]/g, '');
        if (letters.length === 0) return 0;
        
        const upperCaseLetters = text.replace(/[^A-Z]/g, '');
        return (upperCaseLetters.length / letters.length) * 100;
    }

    async punishUser(member, punishmentType, duration, unit, reason) {
        try {
            console.log(`🔨 Attempting to punish user ${member.user.tag} with ${punishmentType} for ${duration} ${unit || 'seconds'}`);
            
            // Check if bot has necessary permissions
            const botMember = member.guild.members.me;
            if (!botMember) {
                throw new Error('Bot member not found in guild');
            }
            
            // Convert duration to milliseconds
            const durationMs = this.convertToMilliseconds(duration, unit || 'seconds');
            
            // Check specific permissions based on punishment type
            switch (punishmentType) {
                case 'timeout':
                case 'mute':
                    if (!botMember.permissions.has('ModerateMembers')) {
                        throw new Error('Bot missing "Moderate Members" permission for timeouts');
                    }
                    break;
                case 'kick':
                    if (!botMember.permissions.has('KickMembers')) {
                        throw new Error('Bot missing "Kick Members" permission');
                    }
                    break;
                case 'ban':
                    if (!botMember.permissions.has('BanMembers')) {
                        throw new Error('Bot missing "Ban Members" permission');
                    }
                    break;
            }
            
            // Check role hierarchy
            if (member.roles.highest.position >= botMember.roles.highest.position) {
                throw new Error('Cannot punish user with equal or higher role than bot');
            }
            
            // Send notification to user before punishment
            await this.notifyUser(member, punishmentType, duration, unit || 'seconds', reason);
            
            // Apply punishment
            switch (punishmentType) {
                case 'timeout':
                case 'mute':
                    await member.timeout(durationMs, reason);
                    console.log(`✅ Successfully timed out ${member.user.tag} for ${duration} ${unit || 'seconds'}`);
                    break;
                    
                case 'kick':
                    await member.kick(reason);
                    console.log(`✅ Successfully kicked ${member.user.tag}`);
                    break;
                    
                case 'ban':
                    if (duration && duration !== 'permanent') {
                        await member.ban({ reason });
                        console.log(`✅ Successfully banned ${member.user.tag} for ${duration} ${unit || 'seconds'}`);
                        // Schedule unban (you'd need a job scheduler for this in production)
                        setTimeout(async () => {
                            try {
                                await member.guild.members.unban(member.id, 'Automatic unban after punishment period');
                                console.log(`✅ Auto-unbanned ${member.user.tag}`);
                            } catch (error) {
                                console.error('Failed to auto-unban:', error);
                            }
                        }, durationMs);
                    } else {
                        await member.ban({ reason });
                        console.log(`✅ Successfully permanently banned ${member.user.tag}`);
                    }
                    break;
                    
                case 'warn':
                    await this.db.addWarning(member.guild.id, member.id, member.guild.client.user.id, reason);
                    console.log(`✅ Successfully warned ${member.user.tag}`);
                    break;
                    
                default:
                    throw new Error(`Unknown punishment type: ${punishmentType}`);
            }
            
            // Log successful punishment
            await this.logModerationAction(
                member.guild,
                member.user,
                member.guild.client.user,
                punishmentType,
                `${reason} (Duration: ${duration} ${unit || 'seconds'})`
            );
            
        } catch (error) {
            console.error(`❌ Punishment failed for ${member.user.tag}:`, error.message);
            
            // Try to notify in channel if punishment failed
            try {
                const channels = member.guild.channels.cache.filter(channel => channel.type === 0);
                const systemChannel = member.guild.systemChannel || 
                                   channels.find(channel => channel.name.includes('general')) || 
                                   channels.find(channel => channel.permissionsFor(member.guild.members.me).has('SendMessages'));
                
                if (systemChannel) {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('⚠️ Punishment Failed')
                        .setDescription(`Failed to ${punishmentType} ${member}: ${error.message}`)
                        .addFields(
                            { name: '🔧 Fix Required', value: 'Please check bot permissions and role hierarchy', inline: false },
                            { name: '📋 Required Permissions', value: this.getRequiredPermissions(punishmentType), inline: false }
                        )
                        .setColor(0xFF6B6B)
                        .setTimestamp();
                    
                    await systemChannel.send({ embeds: [errorEmbed] });
                }
            } catch (notifyError) {
                console.error('Failed to send punishment failure notification:', notifyError);
            }
            
            throw error; // Re-throw so calling code knows it failed
        }
    }

    getRequiredPermissions(punishmentType) {
        switch (punishmentType) {
            case 'timeout':
            case 'mute':
                return 'Moderate Members';
            case 'kick':
                return 'Kick Members';
            case 'ban':
                return 'Ban Members';
            case 'warn':
                return 'Send Messages';
            default:
                return 'Unknown';
        }
    }

    async notifyUser(member, punishmentType, duration, unit, reason) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Moderation Action')
                .setDescription(`You have been ${punishmentType === 'timeout' ? 'timed out' : punishmentType}d in **${member.guild.name}**`)
                .addFields(
                    { name: '📋 Reason', value: reason || 'No reason provided', inline: false },
                    { name: '⏱️ Duration', value: duration && unit ? `${duration} ${unit}` : 'N/A', inline: true },
                    { name: '🏠 Server', value: member.guild.name, inline: true }
                )
                .setColor(0xE74C3C)
                .setTimestamp()
                .setFooter({ text: 'CheeseBot' });

            await member.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to notify user (DMs may be disabled):', error);
            // If DM fails, try to send a notification in the channel where the spam occurred
            try {
                const channels = member.guild.channels.cache.filter(channel => channel.type === 0);
                const generalChannel = channels.find(channel => channel.name.includes('general')) || channels.first();
                
                if (generalChannel) {
                    const publicEmbed = new EmbedBuilder()
                        .setTitle('🔨 Moderation Action')
                        .setDescription(`${member} has been ${punishmentType === 'timeout' ? 'timed out' : punishmentType}d for: ${reason}`)
                        .setColor(0xE74C3C)
                        .setTimestamp();
                    
                    await generalChannel.send({ embeds: [publicEmbed] });
                }
            } catch (channelError) {
                console.error('Failed to send public notification:', channelError);
            }
        }
    }

    convertToMilliseconds(duration, unit) {
        const multipliers = {
            'seconds': 1000,
            'minutes': 60 * 1000,
            'hours': 60 * 60 * 1000,
            'days': 24 * 60 * 60 * 1000,
            'weeks': 7 * 24 * 60 * 60 * 1000
        };
        
        return duration * (multipliers[unit] || multipliers['seconds']);
    }

    async logModerationAction(guild, user, moderator, action, reason) {
        try {
            const config = await this.db.getServerConfig(guild.id);
            if (!config || !config.logs_channel_id) return;

            const logsChannel = guild.channels.cache.get(config.logs_channel_id);
            if (!logsChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('📋 Moderation Action')
                .setColor(0x2F3136)
                .addFields(
                    { name: 'Action', value: action.replace(/_/g, ' ').toUpperCase(), inline: true },
                    { name: 'User', value: user ? `${user.tag} (${user.id})` : 'Multiple users', inline: true },
                    { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                    { name: 'Reason', value: reason || 'No reason provided', inline: false }
                )
                .setTimestamp();

            await logsChannel.send({ embeds: [embed] });

            // Also log to database
            if (user) {
                await this.db.db.run(
                    'INSERT INTO mod_logs (guild_id, user_id, moderator_id, action, reason) VALUES (?, ?, ?, ?, ?)',
                    [guild.id, user.id, moderator.id, action, reason]
                );
            }
        } catch (error) {
            console.error('Failed to log moderation action:', error);
        }
    }

    async activatePanicMode(guild, activator) {
        try {
            console.log(`🆘 PANIC MODE ACTIVATED in ${guild.name} by ${activator.tag}`);
            
            const config = await this.db.getServerConfig(guild.id);
            const safeRoles = config ? JSON.parse(config.safe_roles || '[]') : [];
            
            // Lock all channels
            const channels = guild.channels.cache.filter(channel => 
                channel.type === 0 || channel.type === 2 // Text and Voice channels
            );
            
            for (const [channelId, channel] of channels) {
                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: false,
                        Speak: false,
                        Connect: false
                    });
                } catch (error) {
                    console.error(`Failed to lock channel ${channel.name}:`, error);
                }
            }
            
            // Kick all members except those with safe roles
            const members = await guild.members.fetch();
            let kickedCount = 0;
            
            for (const [memberId, member] of members) {
                if (member.id === guild.ownerId || member.user.bot) continue;
                
                const hasSefeRole = member.roles.cache.some(role => safeRoles.includes(role.id));
                if (!hasSefeRole) {
                    try {
                        await member.kick('Emergency panic mode activated');
                        kickedCount++;
                    } catch (error) {
                        console.error(`Failed to kick ${member.user.tag}:`, error);
                    }
                }
            }
            
            // Update panic mode status
            await this.db.db.run(
                'UPDATE server_configs SET panic_mode = 1 WHERE guild_id = ?',
                [guild.id]
            );
            
            // Log the panic mode activation
            await this.logModerationAction(
                guild, 
                null, 
                activator, 
                'panic_mode_activated', 
                `Channels locked, ${kickedCount} members kicked`
            );
            
            return { success: true, kickedCount };
            
        } catch (error) {
            console.error('Panic mode activation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async deactivatePanicMode(guild, deactivator) {
        try {
            console.log(`🔓 Panic mode deactivated in ${guild.name} by ${deactivator.tag}`);
            
            // Unlock all channels
            const channels = guild.channels.cache.filter(channel => 
                channel.type === 0 || channel.type === 2 // Text and Voice channels
            );
            
            for (const [channelId, channel] of channels) {
                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: null,
                        Speak: null,
                        Connect: null
                    });
                } catch (error) {
                    console.error(`Failed to unlock channel ${channel.name}:`, error);
                }
            }
            
            // Update panic mode status
            await this.db.db.run(
                'UPDATE server_configs SET panic_mode = 0 WHERE guild_id = ?',
                [guild.id]
            );
            
            // Log the deactivation
            await this.logModerationAction(
                guild, 
                null, 
                deactivator, 
                'panic_mode_deactivated', 
                'Server unlocked and returned to normal operation'
            );
            
            return { success: true };
            
        } catch (error) {
            console.error('Panic mode deactivation failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Anti-Nuke Protection Methods
    async checkAntiNuke(guild, action, user, actionData = {}) {
        const settings = await this.db.getModerationSettings(guild.id);
        if (!settings.anti_nuke) return false;

        const userId = user.id;
        const guildId = guild.id;
        const now = Date.now();
        const timeWindow = 60000; // 1 minute

        // Initialize tracking for this guild if needed
        if (!this.antiNukeTracking.has(guildId)) {
            this.antiNukeTracking.set(guildId, new Map());
        }

        const guildTracking = this.antiNukeTracking.get(guildId);

        // Initialize tracking for this user if needed
        if (!guildTracking.has(userId)) {
            guildTracking.set(userId, new Map());
        }

        const userTracking = guildTracking.get(userId);

        // Initialize tracking for this action type if needed
        if (!userTracking.has(action)) {
            userTracking.set(action, []);
        }

        const actionTracking = userTracking.get(action);

        // Clean old actions outside the time window
        const recentActions = actionTracking.filter(timestamp => now - timestamp < timeWindow);
        userTracking.set(action, recentActions);

        // Add current action
        recentActions.push(now);

        // Check limits
        let limit = 0;
        switch (action) {
            case 'channel_create':
                limit = settings.channel_create_limit || 3;
                break;
            case 'channel_delete':
                limit = settings.channel_delete_limit || 3;
                break;
            case 'role_create':
                limit = settings.role_create_limit || 5;
                break;
            case 'role_delete':
                limit = settings.role_delete_limit || 3;
                break;
            case 'member_kick':
                limit = settings.member_kick_limit || 5;
                break;
            case 'member_ban':
                limit = settings.member_ban_limit || 3;
                break;
            default:
                return false;
        }

        if (recentActions.length >= limit) {
            await this.handleAntiNukeViolation(guild, user, action, recentActions.length, limit);
            
            // Clear tracking for this user to prevent spam
            guildTracking.delete(userId);
            
            return true;
        }

        return false;
    }

    async handleAntiNukeViolation(guild, user, action, count, limit) {
        console.log(`🚨 Anti-nuke violation detected! ${user.tag} performed ${count} ${action} actions (limit: ${limit})`);

        try {
            // Get member object
            const member = await guild.members.fetch(user.id).catch(() => null);
            if (!member) return;

            // Remove dangerous permissions
            await this.removeDangerousPermissions(member);

            // Send alert to logs channel
            await this.logAntiNukeViolation(guild, user, action, count, limit);

            // Optionally ban the user for severe violations
            const severeActions = ['channel_delete', 'role_delete', 'member_ban'];
            if (severeActions.includes(action) && count >= limit * 2) {
                await member.ban({ reason: `Anti-nuke protection: Mass ${action} detected` });
                console.log(`🔨 Banned ${user.tag} for severe anti-nuke violation`);
            }

        } catch (error) {
            console.error('Anti-nuke violation handling failed:', error);
        }
    }

    async removeDangerousPermissions(member) {
        try {
            // Remove all dangerous permissions from user's roles
            const dangerousPermissions = [
                'Administrator',
                'ManageGuild',
                'ManageRoles',
                'ManageChannels',
                'KickMembers',
                'BanMembers',
                'ManageMessages',
                'MentionEveryone'
            ];

            // Create a new role with safe permissions for the user
            const safeRole = await member.guild.roles.create({
                name: `${member.user.username}-restricted`,
                color: 0xFF0000,
                permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                reason: 'Anti-nuke protection: User permissions restricted'
            });

            // Remove all roles and add only the safe role
            await member.roles.set([safeRole], 'Anti-nuke protection: Dangerous permissions removed');

            console.log(`🛡️ Removed dangerous permissions from ${member.user.tag}`);

        } catch (error) {
            console.error('Failed to remove dangerous permissions:', error);
        }
    }

    async logAntiNukeViolation(guild, user, action, count, limit) {
        try {
            const config = await this.db.getServerConfig(guild.id);
            
            if (config && config.logs_channel_id) {
                const logsChannel = guild.channels.cache.get(config.logs_channel_id);
                
                if (logsChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🚨 ANTI-NUKE VIOLATION DETECTED')
                        .setDescription(`**${user.tag}** triggered anti-nuke protection`)
                        .setColor(0xFF0000)
                        .addFields(
                            { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                            { name: '⚡ Action', value: action.replace('_', ' '), inline: true },
                            { name: '📊 Count', value: `${count}/${limit}`, inline: true },
                            { name: '🛡️ Response', value: 'Permissions removed, user restricted', inline: false },
                            { name: '🕒 Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setThumbnail(user.displayAvatarURL())
                        .setTimestamp()
                        .setFooter({ text: 'Guardian Anti-Nuke Protection' });

                    await logsChannel.send({ embeds: [embed] });
                }
            }

            // Log to moderation logs
            await this.logModerationAction(guild, user, guild.client.user, 'anti_nuke_violation', `${action}: ${count}/${limit}`);

        } catch (error) {
            console.error('Failed to log anti-nuke violation:', error);
        }
    }
}

module.exports = ModerationSystem;
