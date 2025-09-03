const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class SetupSystem {
    constructor(database) {
        this.db = database;
    }

    async createMainSetupMenu() {
        const embed = new EmbedBuilder()
            .setTitle('CheeseBot - Setup Panel')
            .setDescription('Configure your server\'s security and moderation settings')
            .setColor(0x2F3136)
            .addFields(
                { name: '🚨 Spam Protection', value: 'Configure anti-spam measures', inline: true },
                { name: '🛡️ Raid Protection', value: 'Setup anti-raid systems', inline: true },
                { name: '🤖 Auto Moderation', value: 'Configure content filters', inline: true },
                { name: '💥 Anti-Nuke Protection', value: 'Prevent server destruction', inline: true },
                { name: '⚠️ Warning System', value: 'Setup warning thresholds', inline: true },
                { name: '📺 YouTube Announcements', value: 'Configure AquaCheese notifications', inline: true },
                { name: '📊 View Current Config', value: 'See all current settings', inline: true },
                { name: '🆘 Panic Button', value: 'Emergency server lockdown', inline: true },
                { name: '🔧 Advanced Settings', value: 'Fine-tune configurations', inline: true }
            )
            .setFooter({ text: 'Select a category to configure' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('setup_main_menu')
            .setPlaceholder('Choose a configuration category')
            .addOptions(
                {
                    label: 'Spam Protection',
                    description: 'Configure anti-spam measures',
                    value: 'spam_protection',
                    emoji: '🚨'
                },
                {
                    label: 'Raid Protection',
                    description: 'Setup anti-raid systems',
                    value: 'raid_protection',
                    emoji: '🛡️'
                },
                {
                    label: 'Auto Moderation',
                    description: 'Configure content filters',
                    value: 'auto_moderation',
                    emoji: '🤖'
                },
                {
                    label: 'Anti-Nuke Protection',
                    description: 'Prevent server destruction',
                    value: 'anti_nuke',
                    emoji: '💥'
                },
                {
                    label: 'Warning System',
                    description: 'Setup warning thresholds',
                    value: 'warning_system',
                    emoji: '⚠️'
                },
                {
                    label: 'YouTube Announcements',
                    description: 'Configure AquaCheese notifications',
                    value: 'youtube_announcements',
                    emoji: '📺'
                },
                {
                    label: 'View Current Config',
                    description: 'See all current settings',
                    value: 'view_config',
                    emoji: '📊'
                },
                {
                    label: 'Panic Button Setup',
                    description: 'Configure emergency lockdown',
                    value: 'panic_button',
                    emoji: '🆘'
                },
                {
                    label: 'Advanced Settings',
                    description: 'Fine-tune configurations',
                    value: 'advanced_settings',
                    emoji: '🔧'
                }
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        return { embeds: [embed], components: [row] };
    }

    async createSpamProtectionMenu(guildId) {
        const settings = await this.db.getModerationSettings(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('🚨 Spam Protection Configuration')
            .setDescription('Configure how the bot handles spam detection and punishment')
            .setColor(0xFF6B6B)
            .addFields(
                { 
                    name: 'Current Status', 
                    value: settings.spam_protection ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Message Count Threshold', 
                    value: `${settings.spam_message_count || 5} messages`, 
                    inline: true 
                },
                { 
                    name: 'Time Window', 
                    value: `${(settings.spam_time_window || 5000) / 1000} seconds`, 
                    inline: true 
                },
                { 
                    name: 'Punishment Type', 
                    value: settings.spam_punishment || 'timeout', 
                    inline: true 
                },
                { 
                    name: 'Punishment Duration', 
                    value: `${settings.spam_punishment_duration || 300} ${settings.spam_punishment_unit || 'seconds'}`, 
                    inline: true 
                },
                { 
                    name: 'How it works', 
                    value: 'Monitors users for rapid message sending. If a user sends too many messages in a short time, they will be punished according to your settings.', 
                    inline: false 
                }
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('spam_toggle')
                    .setLabel(settings.spam_protection ? 'Disable' : 'Enable')
                    .setStyle(settings.spam_protection ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('spam_configure')
                    .setLabel('Configure Settings')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons] };
    }

    async createRaidProtectionMenu(guildId) {
        const settings = await this.db.getModerationSettings(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Raid Protection Configuration')
            .setDescription('Configure protection against mass user joins (raids)')
            .setColor(0x4ECDC4)
            .addFields(
                { 
                    name: 'Current Status', 
                    value: settings.raid_protection ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'User Join Threshold', 
                    value: `${settings.raid_user_threshold || 10} users`, 
                    inline: true 
                },
                { 
                    name: 'Time Window', 
                    value: `${settings.raid_time_window || 60} seconds`, 
                    inline: true 
                },
                { 
                    name: 'Punishment Type', 
                    value: settings.raid_punishment || 'ban', 
                    inline: true 
                },
                { 
                    name: 'How it works', 
                    value: 'Monitors for suspicious mass user joins. When too many users join in a short time, automatic actions are taken to protect the server.', 
                    inline: false 
                }
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('raid_toggle')
                    .setLabel(settings.raid_protection ? 'Disable' : 'Enable')
                    .setStyle(settings.raid_protection ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('raid_configure')
                    .setLabel('Configure Settings')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons] };
    }

    async createAutoModerationMenu(guildId) {
        const settings = await this.db.getModerationSettings(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Auto Moderation Configuration')
            .setDescription('Configure automatic content filtering and moderation')
            .setColor(0x95E1D3)
            .addFields(
                { 
                    name: 'Auto Moderation', 
                    value: settings.auto_mod ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Profanity Filter', 
                    value: settings.profanity_filter ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Link Filter', 
                    value: settings.link_filter ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Invite Filter', 
                    value: settings.invite_filter ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Caps Filter', 
                    value: settings.caps_filter ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Caps Threshold', 
                    value: `${settings.caps_threshold || 70}%`, 
                    inline: true 
                }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('automod_toggle')
            .setPlaceholder('Toggle auto-moderation features')
            .addOptions([
                {
                    label: 'Auto Moderation Master Switch',
                    value: 'auto_mod',
                    description: settings.auto_mod ? 'Currently enabled' : 'Currently disabled',
                    emoji: '🤖'
                },
                {
                    label: 'Profanity Filter',
                    value: 'profanity_filter',
                    description: settings.profanity_filter ? 'Currently enabled' : 'Currently disabled',
                    emoji: '🤬'
                },
                {
                    label: 'Link Filter',
                    value: 'link_filter',
                    description: settings.link_filter ? 'Currently enabled' : 'Currently disabled',
                    emoji: '🔗'
                },
                {
                    label: 'Invite Filter',
                    value: 'invite_filter',
                    description: settings.invite_filter ? 'Currently enabled' : 'Currently disabled',
                    emoji: '📧'
                },
                {
                    label: 'Caps Filter',
                    value: 'caps_filter',
                    description: settings.caps_filter ? 'Currently enabled' : 'Currently disabled',
                    emoji: '🔠'
                }
            ]);

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_configure')
                    .setLabel('Advanced Configuration')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { 
            embeds: [embed], 
            components: [new ActionRowBuilder().addComponents(selectMenu), buttons] 
        };
    }

    async createPanicButtonMenu(guildId) {
        const config = await this.db.getServerConfig(guildId);
        const safeRoles = config ? JSON.parse(config.safe_roles || '[]') : [];
        
        const embed = new EmbedBuilder()
            .setTitle('🆘 Panic Button Configuration')
            .setDescription('Emergency server lockdown system')
            .setColor(0xFF4757)
            .addFields(
                { 
                    name: '⚠️ Warning', 
                    value: 'The panic button will:\n• Lock all channels\n• Kick all users except safe roles\n• Enable maximum security\n• Log all actions', 
                    inline: false 
                },
                { 
                    name: 'Safe Roles', 
                    value: safeRoles.length > 0 ? safeRoles.map(id => `<@&${id}>`).join(', ') : 'None configured', 
                    inline: false 
                },
                { 
                    name: 'Current Status', 
                    value: config?.panic_mode ? '🔒 PANIC MODE ACTIVE' : '🟢 Normal Operation', 
                    inline: true 
                }
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('panic_activate')
                    .setLabel('🆘 ACTIVATE PANIC MODE')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(config?.panic_mode || false),
                new ButtonBuilder()
                    .setCustomId('panic_deactivate')
                    .setLabel('🔓 Deactivate Panic Mode')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!config?.panic_mode),
                new ButtonBuilder()
                    .setCustomId('panic_configure_roles')
                    .setLabel('Configure Safe Roles')
                    .setStyle(ButtonStyle.Primary)
            );

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons, backButton] };
    }

    async createAntiNukeMenu(guildId) {
        const settings = await this.db.getModerationSettings(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('💥 Anti-Nuke Protection Configuration')
            .setDescription('Protect your server from mass destruction attacks')
            .setColor(0xFF3838)
            .addFields(
                { 
                    name: 'Current Status', 
                    value: settings.anti_nuke ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Channel Create Limit', 
                    value: `${settings.channel_create_limit || 3} per minute`, 
                    inline: true 
                },
                { 
                    name: 'Channel Delete Limit', 
                    value: `${settings.channel_delete_limit || 3} per minute`, 
                    inline: true 
                },
                { 
                    name: 'Role Create Limit', 
                    value: `${settings.role_create_limit || 5} per minute`, 
                    inline: true 
                },
                { 
                    name: 'Role Delete Limit', 
                    value: `${settings.role_delete_limit || 3} per minute`, 
                    inline: true 
                },
                { 
                    name: 'Member Kick Limit', 
                    value: `${settings.member_kick_limit || 5} per minute`, 
                    inline: true 
                },
                { 
                    name: 'How it works', 
                    value: 'Monitors for suspicious mass actions. When limits are exceeded, the bot will:\n• Remove dangerous permissions from the user\n• Log the incident\n• Alert administrators\n• Optionally ban/kick the user', 
                    inline: false 
                }
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('anti_nuke_toggle')
                    .setLabel(settings.anti_nuke ? 'Disable' : 'Enable')
                    .setStyle(settings.anti_nuke ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('anti_nuke_configure')
                    .setLabel('Configure Limits')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons] };
    }

    async createCurrentConfigView(guildId) {
        const settings = await this.db.getModerationSettings(guildId);
        const config = await this.db.getServerConfig(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Current Server Configuration')
            .setDescription('Overview of all security and moderation settings')
            .setColor(0x3742FA)
            .addFields(
                { 
                    name: '🚨 Spam Protection', 
                    value: `**Status:** ${settings.spam_protection ? '✅ Enabled' : '❌ Disabled'}\n**Threshold:** ${settings.spam_message_count || 5} msgs in ${(settings.spam_time_window || 5000)/1000}s\n**Punishment:** ${settings.spam_punishment || 'timeout'}`, 
                    inline: true 
                },
                { 
                    name: '🛡️ Raid Protection', 
                    value: `**Status:** ${settings.raid_protection ? '✅ Enabled' : '❌ Disabled'}\n**Threshold:** ${settings.raid_user_threshold || 10} users in ${settings.raid_time_window || 60}s\n**Action:** ${settings.raid_punishment || 'ban'}`, 
                    inline: true 
                },
                { 
                    name: '🤖 Auto Moderation', 
                    value: `**Master:** ${settings.auto_mod ? '✅' : '❌'}\n**Profanity:** ${settings.profanity_filter ? '✅' : '❌'}\n**Links:** ${settings.link_filter ? '✅' : '❌'}\n**Invites:** ${settings.invite_filter ? '✅' : '❌'}\n**Caps:** ${settings.caps_filter ? '✅' : '❌'}`, 
                    inline: true 
                },
                { 
                    name: '💥 Anti-Nuke', 
                    value: `**Status:** ${settings.anti_nuke ? '✅ Enabled' : '❌ Disabled'}\n**Channel Limits:** ${settings.channel_create_limit || 3}/${settings.channel_delete_limit || 3}\n**Role Limit:** ${settings.role_create_limit || 5}`, 
                    inline: true 
                },
                { 
                    name: '🔧 Channels', 
                    value: `**Admin:** ${config?.admin_channel_id ? `<#${config.admin_channel_id}>` : 'Not set'}\n**Logs:** ${config?.logs_channel_id ? `<#${config.logs_channel_id}>` : 'Not set'}`, 
                    inline: true 
                },
                { 
                    name: '🆘 Emergency', 
                    value: `**Panic Mode:** ${config?.panic_mode ? '🔒 ACTIVE' : '🟢 Inactive'}\n**Safe Roles:** ${config ? JSON.parse(config.safe_roles || '[]').length : 0} configured`, 
                    inline: true 
                },
                { 
                    name: '📺 YouTube Announcements', 
                    value: `**AquaCheese:** ${config?.aquacheese_announcements ? '✅ Enabled' : '❌ Disabled'}\n**Channel:** ${config?.youtube_channel_id ? `<#${config.youtube_channel_id}>` : 'Not set'}`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'Last updated' })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_export')
                    .setLabel('Export Config')
                    .setStyle(ButtonStyle.Primary)
            );

        return { embeds: [embed], components: [buttons] };
    }

    async createWarningSystemMenu(guildId) {
        const settings = await this.db.getModerationSettings(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Warning System Configuration')
            .setDescription('Configure automatic warning thresholds and punishments')
            .setColor(0xF39C12)
            .addFields(
                { 
                    name: 'Warning System', 
                    value: settings.warning_system ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Warning Threshold', 
                    value: `${settings.warning_threshold || 3} warnings`, 
                    inline: true 
                },
                { 
                    name: 'Auto Punishment', 
                    value: settings.warning_auto_punishment || 'timeout', 
                    inline: true 
                },
                { 
                    name: 'How it works', 
                    value: 'When users reach the warning threshold, they will automatically receive the configured punishment. Warnings can be issued manually by moderators or automatically by other protection systems.', 
                    inline: false 
                }
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('warning_system_toggle')
                    .setLabel(settings.warning_system ? 'Disable' : 'Enable')
                    .setStyle(settings.warning_system ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('warning_system_configure')
                    .setLabel('Configure Settings')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons] };
    }

    async createAdvancedSettingsMenu(guildId) {
        const config = await this.db.getServerConfig(guildId);
        const settings = await this.db.getModerationSettings(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('🔧 Advanced Settings')
            .setDescription('Fine-tune your security configuration')
            .setColor(0x9C88FF)
            .addFields(
                { 
                    name: '🔒 Security Level', 
                    value: this.getSecurityLevel(settings), 
                    inline: true 
                },
                { 
                    name: '📝 Moderation Logs', 
                    value: settings.detailed_logging ? '✅ Detailed' : '📄 Basic', 
                    inline: true 
                },
                { 
                    name: '🤖 Auto Actions', 
                    value: settings.auto_actions ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: '🛡️ Whitelist Mode', 
                    value: settings.whitelist_mode ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: '🔄 Auto Backup', 
                    value: settings.auto_backup ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: '📊 Analytics', 
                    value: settings.analytics_enabled ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('advanced_settings_toggle')
            .setPlaceholder('Toggle advanced features')
            .addOptions([
                {
                    label: 'Detailed Logging',
                    value: 'detailed_logging',
                    description: settings.detailed_logging ? 'Currently enabled' : 'Currently disabled',
                    emoji: '📝'
                },
                {
                    label: 'Auto Actions',
                    value: 'auto_actions',
                    description: settings.auto_actions ? 'Currently enabled' : 'Currently disabled',
                    emoji: '🤖'
                },
                {
                    label: 'Whitelist Mode',
                    value: 'whitelist_mode',
                    description: settings.whitelist_mode ? 'Currently enabled' : 'Currently disabled',
                    emoji: '🛡️'
                },
                {
                    label: 'Auto Backup',
                    value: 'auto_backup',
                    description: settings.auto_backup ? 'Currently enabled' : 'Currently disabled',
                    emoji: '🔄'
                },
                {
                    label: 'Analytics',
                    value: 'analytics_enabled',
                    description: settings.analytics_enabled ? 'Currently enabled' : 'Currently disabled',
                    emoji: '📊'
                }
            ]);

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('advanced_reset')
                    .setLabel('Reset to Defaults')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { 
            embeds: [embed], 
            components: [new ActionRowBuilder().addComponents(selectMenu), buttons] 
        };
    }

    async createConfigViewMenu(guildId) {
        const settings = await this.db.getModerationSettings(guildId);
        const config = await this.db.getServerConfig(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Current Configuration')
            .setDescription('Overview of all security and moderation settings')
            .setColor(0x3742FA)
            .addFields(
                { 
                    name: '🚨 Spam Protection', 
                    value: settings.spam_protection ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: '🛡️ Raid Protection', 
                    value: settings.raid_protection ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: '🤖 Auto Moderation', 
                    value: settings.auto_mod ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: '💥 Anti-Nuke', 
                    value: settings.anti_nuke ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: '⚠️ Warning System', 
                    value: settings.warning_system ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: '🔒 Security Level', 
                    value: this.getSecurityLevel(settings), 
                    inline: true 
                },
                { 
                    name: '📋 Admin Channel', 
                    value: config?.admin_channel_id ? `<#${config.admin_channel_id}>` : 'Not set', 
                    inline: true 
                },
                { 
                    name: '📝 Logs Channel', 
                    value: config?.logs_channel_id ? `<#${config.logs_channel_id}>` : 'Not set', 
                    inline: true 
                },
                { 
                    name: '🛡️ Safe Roles', 
                    value: config?.safe_roles ? `${JSON.parse(config.safe_roles).length} roles` : 'None set', 
                    inline: true 
                }
            )
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_export')
                    .setLabel('📄 Export Config')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons] };
    }

    async createYouTubeAnnouncementsMenu(guildId) {
        const config = await this.db.getServerConfig(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('📺 YouTube Announcements Configuration')
            .setDescription('Configure AquaCheese YouTube notifications for your server')
            .setColor(0xFF0000) // YouTube red
            .addFields(
                { 
                    name: 'AquaCheese Announcements', 
                    value: config?.aquacheese_announcements ? '✅ Enabled' : '❌ Disabled', 
                    inline: true 
                },
                { 
                    name: 'Announcements Channel', 
                    value: config?.announcements_channel_id ? `<#${config.announcements_channel_id}>` : 'Not configured', 
                    inline: true 
                },
                { 
                    name: 'Server YouTube Channel', 
                    value: config?.youtube_channel_id || 'Not configured', 
                    inline: true 
                },
                { 
                    name: 'How it works', 
                    value: '• **AquaCheese Announcements**: Get notified when AquaCheese uploads new videos or goes live\n• **Channel Setup**: Use `/config` to set your announcements channel\n• **Server Channel**: Use `/yt setup` to configure your own YouTube channel for monitoring', 
                    inline: false 
                },
                { 
                    name: 'Available Commands', 
                    value: '• `/aquacheese recent` - Latest AquaCheese video\n• `/aquacheese channel` - Channel information\n• `/yt setup` - Configure server YouTube channel\n• `/testnotification` - Test the notification system (Admin only)', 
                    inline: false 
                }
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('aquacheese_announcements_toggle')
                    .setLabel(config?.aquacheese_announcements ? 'Disable AquaCheese Announcements' : 'Enable AquaCheese Announcements')
                    .setStyle(config?.aquacheese_announcements ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('youtube_channel_configure')
                    .setLabel('Configure Channels')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('setup_back')
                    .setLabel('Back to Main Menu')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [buttons] };
    }

    getSecurityLevel(settings) {
        let score = 0;
        if (settings.spam_protection) score++;
        if (settings.raid_protection) score++;
        if (settings.auto_mod) score++;
        if (settings.anti_nuke) score++;
        if (settings.warning_system) score++;

        if (score >= 4) return '🔴 Maximum';
        if (score >= 3) return '🟠 High';
        if (score >= 2) return '🟡 Medium';
        if (score >= 1) return '🟢 Low';
        return '⚪ Minimal';
    }

    // Menu selection handlers
    async handleSetupMenuSelection(interaction, selectedValue) {
        try {
            await interaction.reply({ 
                content: `⚙️ Setup menu option "${selectedValue}" selected. This feature is being configured.`, 
                flags: [4096] 
            });
        } catch (error) {
            console.error('Setup menu selection error:', error);
            await interaction.reply({ content: 'Error processing setup menu selection!', flags: [4096] });
        }
    }

    async handleModerationMenuSelection(interaction, selectedValue) {
        try {
            await interaction.reply({ 
                content: `🛡️ Moderation option "${selectedValue}" selected. Use the main setup menu for full configuration.`, 
                flags: [4096] 
            });
        } catch (error) {
            console.error('Moderation menu selection error:', error);
            await interaction.reply({ content: 'Error processing moderation menu selection!', flags: [4096] });
        }
    }

    async handleAdvancedMenuSelection(interaction, selectedValue) {
        try {
            await interaction.reply({ 
                content: `🔧 Advanced setting "${selectedValue}" selected. Use `/config` command for detailed configuration.`, 
                flags: [4096] 
            });
        } catch (error) {
            console.error('Advanced menu selection error:', error);
            await interaction.reply({ content: 'Error processing advanced menu selection!', flags: [4096] });
        }
    }

    async handleLogsMenuSelection(interaction, selectedValue) {
        try {
            await interaction.reply({ 
                content: `📊 Logs option "${selectedValue}" selected. Configure logging channels in server settings.`, 
                flags: [4096] 
            });
        } catch (error) {
            console.error('Logs menu selection error:', error);
            await interaction.reply({ content: 'Error processing logs menu selection!', flags: [4096] });
        }
    }

    async handleTicketMenuSelection(interaction, selectedValue) {
        try {
            await interaction.reply({ 
                content: `🎫 Ticket option "${selectedValue}" selected. Ticket system is available via buttons and commands.`, 
                flags: [4096] 
            });
        } catch (error) {
            console.error('Ticket menu selection error:', error);
            await interaction.reply({ content: 'Error processing ticket menu selection!', flags: [4096] });
        }
    }
}

module.exports = SetupSystem;
