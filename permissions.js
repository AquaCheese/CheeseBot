const { PermissionsBitField } = require('discord.js');

class PermissionChecker {
    constructor() {
        this.requiredPermissions = {
            // Basic bot permissions
            basic: [
                'ViewChannel',
                'SendMessages',
                'EmbedLinks',
                'ReadMessageHistory',
                'UseSlashCommands'
            ],
            
            // Moderation permissions
            moderation: [
                'ManageMessages',
                'ModerateMembers',
                'KickMembers',
                'BanMembers',
                'ManageRoles',
                'ManageChannels',
                'ViewAuditLog'
            ],
            
            // Advanced permissions
            advanced: [
                'ManageGuild',
                'Administrator'
            ]
        };
    }

    checkPermissions(guild, level = 'basic') {
        const botMember = guild.members.me;
        if (!botMember) {
            return {
                hasPermissions: false,
                missing: ['Bot not found in guild'],
                level: level
            };
        }

        const requiredPerms = this.requiredPermissions[level] || this.requiredPermissions.basic;
        const missing = [];

        for (const permission of requiredPerms) {
            if (!botMember.permissions.has(permission)) {
                missing.push(permission);
            }
        }

        return {
            hasPermissions: missing.length === 0,
            missing: missing,
            level: level,
            botMember: botMember
        };
    }

    async checkChannelPermissions(channel, permissions = ['ViewChannel', 'SendMessages']) {
        const botMember = channel.guild.members.me;
        if (!botMember) return false;

        const channelPerms = channel.permissionsFor(botMember);
        if (!channelPerms) return false;

        return permissions.every(perm => channelPerms.has(perm));
    }

    generatePermissionEmbed(permissionCheck) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🔧 Bot Permissions Check')
            .setColor(permissionCheck.hasPermissions ? 0x2ECC71 : 0xE74C3C)
            .setTimestamp();

        if (permissionCheck.hasPermissions) {
            embed.setDescription('✅ All required permissions are available!')
                .addFields({
                    name: '📋 Permission Level',
                    value: permissionCheck.level.toUpperCase(),
                    inline: true
                });
        } else {
            embed.setDescription('❌ Missing required permissions for full functionality')
                .addFields(
                    {
                        name: '📋 Permission Level',
                        value: permissionCheck.level.toUpperCase(),
                        inline: true
                    },
                    {
                        name: '⚠️ Missing Permissions',
                        value: permissionCheck.missing.map(perm => `• ${perm}`).join('\n'),
                        inline: false
                    },
                    {
                        name: '🔧 How to Fix',
                        value: 'Grant the missing permissions to the bot role in server settings',
                        inline: false
                    }
                );
        }

        return embed;
    }

    async diagnoseIssues(guild) {
        const issues = [];
        
        // Check basic permissions
        const basicCheck = this.checkPermissions(guild, 'basic');
        if (!basicCheck.hasPermissions) {
            issues.push({
                type: 'permission',
                severity: 'high',
                message: `Missing basic permissions: ${basicCheck.missing.join(', ')}`
            });
        }

        // Check moderation permissions
        const modCheck = this.checkPermissions(guild, 'moderation');
        if (!modCheck.hasPermissions) {
            issues.push({
                type: 'permission',
                severity: 'medium',
                message: `Missing moderation permissions: ${modCheck.missing.join(', ')}`
            });
        }

        // Check role hierarchy
        const botMember = guild.members.me;
        if (botMember) {
            const owner = await guild.fetchOwner();
            if (owner && botMember.roles.highest.position >= owner.roles.highest.position) {
                issues.push({
                    type: 'hierarchy',
                    severity: 'medium',
                    message: 'Bot role should be lower than server owner role for safety'
                });
            }
        }

        return issues;
    }
}

module.exports = PermissionChecker;
