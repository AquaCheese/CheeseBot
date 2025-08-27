const { 
    Client, 
    GatewayIntentBits, 
    Events, 
    Collection,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const http = require('http');
require('dotenv').config();

const Database = require('./database');
const SetupSystem = require('./setup');
const ModerationSystem = require('./moderation');
const AuthenticationSystem = require('./authentication');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
    ],
});

// Initialize systems
const database = new Database();
const setupSystem = new SetupSystem(database);
const moderationSystem = new ModerationSystem(database);
const authSystem = new AuthenticationSystem(database);

// Store slash commands
client.commands = new Collection();

// Create slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure Guardian Security Bot settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('config')
        .setDescription('Set up admin and logs channels')
        .addChannelOption(option =>
            option.setName('admin-channel')
                .setDescription('Channel for admin commands')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('logs-channel')
                .setDescription('Channel for moderation logs')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('panic')
        .setDescription('Emergency panic button - locks down the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Check warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    new SlashCommandBuilder()
        .setName('login')
        .setDescription('Authenticate with the bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('logout')
        .setDescription('End your authentication session')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('msg')
        .setDescription('Send a message through the bot')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the message to (defaults to current channel)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('silent')
                .setDescription('Send the message silently (no notification sound)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete a specified number of messages (Authorized users only)')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to clear messages from (defaults to current channel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('user')
        .setDescription('Manage user authorization (Primary admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('auth')
                .setDescription('Grant or revoke bot access to a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('User to grant/revoke access')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Grant Access', value: 'grant' },
                            { name: 'Revoke Access', value: 'revoke' },
                            { name: 'Check Status', value: 'check' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all authorized users'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set yourself as AFK for a specified duration')
        .addStringOption(option =>
            option.setName('set')
                .setDescription('Set AFK status')
                .setRequired(true)
                .addChoices({ name: 'set', value: 'set' }))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('How long to be AFK')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1440))
        .addStringOption(option =>
            option.setName('unit')
                .setDescription('Time unit')
                .setRequired(true)
                .addChoices(
                    { name: 'minutes', value: 'minutes' },
                    { name: 'hours', value: 'hours' }
                )),
    
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check bot status and configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
        .setName('diagnose')
        .setDescription('Run comprehensive diagnostics to check bot permissions and functionality')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
];

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async readyClient => {
    console.log(`🛡️ Guardian Security Bot is ready! Logged in as ${readyClient.user.tag}`);
    
    // Initialize authentication tables
    try {
        await authSystem.initializeAuthTables();
        console.log('✅ Authentication system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize authentication system:', error);
    }
    
    // Register slash commands globally
    try {
        console.log('Started refreshing application (/) commands.');
        await readyClient.application.commands.set(commands);
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
    
    // Set bot status
    client.user.setActivity('🛡️ Protecting servers', { type: 'WATCHING' });
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
    } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
    } else if (interaction.isButton()) {
        await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
    }
});

async function handleSlashCommand(interaction) {
    const { commandName } = interaction;

    try {
        // Commands that don't require authentication
        const publicCommands = ['login', 'status', 'afk'];
        
        if (!publicCommands.includes(commandName)) {
            // Special check for user command - only primary admin can use it
            if (commandName === 'user') {
                const authCheck = await authSystem.requireAuthentication(interaction, moderationSystem, true);
                if (authCheck.required) {
                    return await interaction.reply(authCheck.response);
                }
                // Only primary admin can use user command
                if (!authCheck.isPrimaryAdmin) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Access Denied')
                        .setDescription('Only the primary administrator can manage user authorization.')
                        .setColor(0xE74C3C);
                    
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } else {
                // Check authentication for other protected commands
                const authCheck = await authSystem.requireAuthentication(interaction, moderationSystem);
                if (authCheck.required) {
                    return await interaction.reply(authCheck.response);
                }
            }
        }

        switch (commandName) {
            case 'setup':
                await handleSetupCommand(interaction);
                break;
            
            case 'config':
                await handleConfigCommand(interaction);
                break;
            
            case 'panic':
                await handlePanicCommand(interaction);
                break;
            
            case 'warn':
                await handleWarnCommand(interaction);
                break;
            
            case 'warnings':
                await handleWarningsCommand(interaction);
                break;
            
            case 'login':
                await handleLoginCommand(interaction);
                break;
            
            case 'logout':
                await handleLogoutCommand(interaction);
                break;
            
            case 'msg':
                await handleMsgCommand(interaction);
                break;
            
            case 'status':
                await handleStatusCommand(interaction);
                break;
            
            case 'afk':
                await handleAfkCommand(interaction);
                break;
            
            case 'clear':
                await handleClearCommand(interaction);
                break;
            
            case 'user':
                await handleUserCommand(interaction);
                break;
            
            case 'diagnose':
                await handleDiagnoseCommand(interaction);
                break;
            
            default:
                await interaction.reply({ content: 'Unknown command!', ephemeral: true });
        }
    } catch (error) {
        console.error('Slash command error:', error);
        const response = { content: 'There was an error executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
}

async function handleSetupCommand(interaction) {
    const config = await database.getServerConfig(interaction.guild.id);
    
    if (!config || !config.admin_channel_id) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Configuration Required')
            .setDescription('Please set up admin and logs channels first using `/config`')
            .setColor(0xFF6B6B);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    if (interaction.channel.id !== config.admin_channel_id) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Wrong Channel')
            .setDescription(`This command can only be used in <#${config.admin_channel_id}>`)
            .setColor(0xFF6B6B);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const setupMenu = await setupSystem.createMainSetupMenu();
    await interaction.reply(setupMenu);
}

async function handleConfigCommand(interaction) {
    const adminChannel = interaction.options.getChannel('admin-channel');
    const logsChannel = interaction.options.getChannel('logs-channel');
    
    try {
        await database.setServerConfig(interaction.guild.id, {
            adminChannelId: adminChannel.id,
            logsChannelId: logsChannel.id,
            safeRoles: []
        });
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Configuration Updated')
            .setDescription('Server configuration has been set up successfully!')
            .addFields(
                { name: 'Admin Channel', value: `<#${adminChannel.id}>`, inline: true },
                { name: 'Logs Channel', value: `<#${logsChannel.id}>`, inline: true }
            )
            .setColor(0x4ECDC4);
        
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Config command error:', error);
        await interaction.reply({ content: 'Failed to update configuration!', ephemeral: true });
    }
}

async function handlePanicCommand(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🆘 EMERGENCY PANIC BUTTON')
        .setDescription('⚠️ **WARNING**: This will immediately:\n• Lock all channels\n• Kick all users (except safe roles)\n• Enable maximum security mode\n\n**This action cannot be undone easily!**')
        .setColor(0xFF4757);
    
    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('panic_confirm')
                .setLabel('🆘 CONFIRM PANIC MODE')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('panic_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );
    
    await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
}

async function handleWarnCommand(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
        await database.addWarning(interaction.guild.id, user.id, interaction.user.id, reason);
        
        const embed = new EmbedBuilder()
            .setTitle('⚠️ User Warned')
            .setDescription(`${user.tag} has been warned`)
            .addFields(
                { name: 'Reason', value: reason, inline: false },
                { name: 'Moderator', value: interaction.user.tag, inline: true }
            )
            .setColor(0xFFA502);
        
        await interaction.reply({ embeds: [embed] });
        
        // Log the warning
        await moderationSystem.logModerationAction(interaction.guild, user, interaction.user, 'warning', reason);
    } catch (error) {
        console.error('Warn command error:', error);
        await interaction.reply({ content: 'Failed to add warning!', ephemeral: true });
    }
}

async function handleWarningsCommand(interaction) {
    const user = interaction.options.getUser('user');
    
    try {
        const warnings = await database.getWarnings(interaction.guild.id, user.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`⚠️ Warnings for ${user.tag}`)
            .setColor(0xFFA502);
        
        if (warnings.length === 0) {
            embed.setDescription('No warnings found for this user.');
        } else {
            const warningList = warnings.slice(0, 10).map((warning, index) => {
                const date = new Date(warning.created_at).toLocaleDateString();
                return `**${index + 1}.** ${warning.reason} (${date})`;
            }).join('\n');
            
            embed.setDescription(warningList);
            embed.setFooter({ text: `Total warnings: ${warnings.length}` });
        }
        
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Warnings command error:', error);
        await interaction.reply({ content: 'Failed to fetch warnings!', ephemeral: true });
    }
}

async function handleLoginCommand(interaction) {
    const authCheck = await authSystem.requireAuthentication(interaction);
    if (authCheck.required) {
        await interaction.reply(authCheck.response);
    } else {
        const embed = new EmbedBuilder()
            .setTitle('✅ Already Authenticated')
            .setDescription('You are already logged in and authenticated.')
            .setColor(0x2ECC71);
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handleLogoutCommand(interaction) {
    await authSystem.logout(interaction.user.id);
    
    const embed = new EmbedBuilder()
        .setTitle('👋 Logged Out')
        .setDescription('You have been successfully logged out. Use `/login` to authenticate again.')
        .setColor(0x95A5A6);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleMsgCommand(interaction) {
    try {
        const message = interaction.options.getString('message');
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        const silent = interaction.options.getBoolean('silent') || false;
        
        // Validate that the target channel is a text channel
        if (targetChannel.type !== 0 && targetChannel.type !== 5) { // Text or Announcement channel
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Channel')
                .setDescription('You can only send messages to text channels.')
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Check if bot has permission to send messages in the target channel
        const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
        const permissions = targetChannel.permissionsFor(botMember);
        
        if (!permissions.has(PermissionFlagsBits.SendMessages)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Missing Permissions')
                .setDescription(`I don't have permission to send messages in ${targetChannel}.`)
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Send the message through the bot
        const messageOptions = {
            content: message
        };
        
        if (silent) {
            messageOptions.flags = [4096]; // SUPPRESS_NOTIFICATIONS flag
        }
        
        await targetChannel.send(messageOptions);
        
        // Confirm to the user
        const confirmEmbed = new EmbedBuilder()
            .setTitle('✅ Message Sent')
            .setDescription(`Message sent to ${targetChannel}`)
            .addFields(
                { name: 'Message', value: message.length > 1024 ? message.substring(0, 1021) + '...' : message, inline: false },
                { name: 'Channel', value: `${targetChannel}`, inline: true },
                { name: 'Silent', value: silent ? 'Yes' : 'No', inline: true },
                { name: 'Sent by', value: `${interaction.user.tag}`, inline: true }
            )
            .setColor(0x2ECC71)
            .setTimestamp();
        
        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        
        // Log the action
        await moderationSystem.logModerationAction(
            interaction.guild,
            null,
            interaction.user,
            'bot_message_sent',
            `Message sent to ${targetChannel.name}: "${message.length > 100 ? message.substring(0, 97) + '...' : message}"`
        );
        
    } catch (error) {
        console.error('Message command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error Sending Message')
            .setDescription('There was an error sending your message. Please try again.')
            .setColor(0xE74C3C);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleStatusCommand(interaction) {
    const config = await database.getServerConfig(interaction.guild.id);
    const settings = await database.getModerationSettings(interaction.guild.id);
    
    const embed = new EmbedBuilder()
        .setTitle('🛡️ Guardian Security Bot Status')
        .setDescription('Current bot status and configuration overview')
        .addFields(
            { 
                name: '🏆 Server Info', 
                value: `**Name:** ${interaction.guild.name}\n**Members:** ${interaction.guild.memberCount}\n**Created:** ${interaction.guild.createdAt.toDateString()}`, 
                inline: true 
            },
            { 
                name: '🔧 Configuration', 
                value: `**Admin Channel:** ${config?.admin_channel_id ? `<#${config.admin_channel_id}>` : 'Not set'}\n**Logs Channel:** ${config?.logs_channel_id ? `<#${config.logs_channel_id}>` : 'Not set'}\n**Panic Mode:** ${config?.panic_mode ? '🔒 ACTIVE' : '🟢 Inactive'}`, 
                inline: true 
            },
            { 
                name: '🛡️ Protection Status', 
                value: `**Spam Protection:** ${settings.spam_protection ? '✅' : '❌'}\n**Raid Protection:** ${settings.raid_protection ? '✅' : '❌'}\n**Auto Moderation:** ${settings.auto_mod ? '✅' : '❌'}\n**Anti-Nuke:** ${settings.anti_nuke ? '✅' : '❌'}`, 
                inline: true 
            }
        )
        .setColor(0x3742FA)
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

async function handleDiagnoseCommand(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const { PermissionChecker } = require('./permissions');
        const checker = new PermissionChecker(client, interaction.guild);
        
        // Run comprehensive diagnostics
        const diagnostics = await checker.runComprehensiveDiagnostics();
        
        // Create main status embed
        const statusEmbed = new EmbedBuilder()
            .setTitle('🔍 Bot Diagnostics Report')
            .setDescription('Comprehensive analysis of bot permissions and functionality')
            .addFields(
                {
                    name: '✅ Basic Permissions',
                    value: diagnostics.basic.map(p => `${p.hasPermission ? '✅' : '❌'} ${p.permission}`).join('\n'),
                    inline: true
                },
                {
                    name: '🛡️ Moderation Permissions', 
                    value: diagnostics.moderation.map(p => `${p.hasPermission ? '✅' : '❌'} ${p.permission}`).join('\n'),
                    inline: true
                },
                {
                    name: '🚨 Advanced Permissions',
                    value: diagnostics.advanced.map(p => `${p.hasPermission ? '✅' : '❌'} ${p.permission}`).join('\n'),
                    inline: true
                }
            )
            .setColor(diagnostics.overallHealth === 'excellent' ? 0x00FF00 : 
                     diagnostics.overallHealth === 'good' ? 0xFFFF00 : 0xFF0000)
            .setTimestamp();
        
        // Create detailed report
        const detailsEmbed = new EmbedBuilder()
            .setTitle('📊 Detailed Analysis')
            .setDescription(diagnostics.recommendations.length > 0 ? 
                `**Recommendations:**\n${diagnostics.recommendations.join('\n')}` : 
                '✅ All systems operating optimally!')
            .addFields(
                {
                    name: '🏥 Overall Health',
                    value: `**Status:** ${diagnostics.overallHealth.toUpperCase()}\n**Score:** ${diagnostics.score}/100`,
                    inline: true
                },
                {
                    name: '🔧 Configuration',
                    value: `**Database:** ${diagnostics.databaseConnected ? '✅ Connected' : '❌ Error'}\n**Guild Access:** ${diagnostics.guildAccessible ? '✅ Available' : '❌ Limited'}`,
                    inline: true
                }
            )
            .setColor(0x3742FA);
        
        // Send embeds
        await interaction.editReply({ 
            embeds: [statusEmbed, detailsEmbed]
        });
        
    } catch (error) {
        console.error('Diagnostics error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Diagnostics Failed')
            .setDescription('An error occurred while running diagnostics. This may indicate permission issues.')
            .addFields({
                name: '🔍 Error Details',
                value: `\`\`\`${error.message}\`\`\``,
                inline: false
            })
            .setColor(0xFF0000);
        
        if (interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleAfkCommand(interaction) {
    const user = interaction.user;
    const guild = interaction.guild;
    const duration = interaction.options.getInteger('duration');
    const unit = interaction.options.getString('unit');
    
    try {
        // Check if user is already AFK
        const existingAFK = await database.getUserAFK(guild.id, user.id);
        if (existingAFK) {
            const embed = new EmbedBuilder()
                .setTitle('⏰ Already AFK')
                .setDescription('You are already marked as AFK! Your previous AFK status has been updated.')
                .setColor(0xF39C12);
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Convert to minutes
        const durationMinutes = unit === 'hours' ? duration * 60 : duration;
        
        // Set user as AFK in database
        await database.setUserAFK(guild.id, user.id, durationMinutes, unit);
        
        // Find general channel (or default to first text channel)
        let generalChannel = guild.channels.cache.find(channel => 
            channel.name.toLowerCase().includes('general') && channel.type === 0
        );
        
        if (!generalChannel) {
            generalChannel = guild.channels.cache.find(channel => channel.type === 0);
        }
        
        // Send AFK announcement to general channel
        if (generalChannel) {
            const afkEmbed = new EmbedBuilder()
                .setTitle('💤 User is now AFK')
                .setDescription(`**${user.tag}** is AFK for **${duration} ${unit}**`)
                .setColor(0x9B59B6)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();
            
            await generalChannel.send({ embeds: [afkEmbed] });
        }
        
        // Confirm to user
        const confirmEmbed = new EmbedBuilder()
            .setTitle('💤 AFK Status Set')
            .setDescription(`You are now marked as AFK for **${duration} ${unit}**.`)
            .addFields(
                { name: '⏰ Duration', value: `${duration} ${unit}`, inline: true },
                { name: '🔚 Ends at', value: `<t:${Math.floor((Date.now() + durationMinutes * 60 * 1000) / 1000)}:F>`, inline: true },
                { name: '📢 Announcement', value: generalChannel ? `Posted in ${generalChannel}` : 'No general channel found', inline: false }
            )
            .setColor(0x9B59B6)
            .setFooter({ text: 'Send any message to cancel your AFK status early!' });
        
        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        
        console.log(`🛡️ ${user.tag} set AFK for ${duration} ${unit}`);
        
    } catch (error) {
        console.error('AFK command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error Setting AFK')
            .setDescription('There was an error setting your AFK status. Please try again.')
            .setColor(0xE74C3C);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleClearCommand(interaction) {
    const number = interaction.options.getInteger('number');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const user = interaction.user;
    
    try {
        // Verify the target channel is a text channel
        if (targetChannel.type !== 0) { // 0 = GUILD_TEXT
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Invalid Channel')
                .setDescription('You can only clear messages from text channels.')
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Check if bot has permissions to manage messages in the target channel
        const botMember = targetChannel.guild.members.me;
        if (!targetChannel.permissionsFor(botMember).has(['ManageMessages', 'ReadMessageHistory'])) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Insufficient Permissions')
                .setDescription(`I don't have permission to manage messages in ${targetChannel}.\n\nRequired permissions:\n• Manage Messages\n• Read Message History`)
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Defer the reply since bulk delete might take time
        await interaction.deferReply({ ephemeral: true });
        
        // Fetch messages to delete (Discord only allows bulk delete of messages less than 14 days old)
        const messages = await targetChannel.messages.fetch({ limit: number });
        
        if (messages.size === 0) {
            const embed = new EmbedBuilder()
                .setTitle('❌ No Messages Found')
                .setDescription('No messages found to delete in this channel.')
                .setColor(0xE74C3C);
            
            return await interaction.editReply({ embeds: [embed] });
        }
        
        // Filter messages that are less than 14 days old (Discord limitation)
        const now = Date.now();
        const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);
        const deletableMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
        const undeletableCount = messages.size - deletableMessages.size;
        
        let deletedCount = 0;
        
        if (deletableMessages.size > 1) {
            // Use bulk delete for multiple messages
            const deleted = await targetChannel.bulkDelete(deletableMessages, true);
            deletedCount = deleted.size;
        } else if (deletableMessages.size === 1) {
            // Delete single message
            await deletableMessages.first().delete();
            deletedCount = 1;
        }
        
        // Create success embed
        const successEmbed = new EmbedBuilder()
            .setTitle('🗑️ Messages Cleared')
            .setDescription(`Successfully deleted **${deletedCount}** message${deletedCount !== 1 ? 's' : ''} from ${targetChannel}`)
            .addFields(
                { name: '📊 Requested', value: `${number} messages`, inline: true },
                { name: '✅ Deleted', value: `${deletedCount} messages`, inline: true },
                { name: '📍 Channel', value: `${targetChannel}`, inline: true }
            )
            .setColor(0x2ECC71)
            .setTimestamp()
            .setFooter({ text: `Cleared by ${user.tag}` });
        
        if (undeletableCount > 0) {
            successEmbed.addFields({
                name: '⚠️ Note',
                value: `${undeletableCount} message${undeletableCount !== 1 ? 's' : ''} couldn't be deleted (older than 14 days)`,
                inline: false
            });
        }
        
        await interaction.editReply({ embeds: [successEmbed] });
        
        // Log the action
        await moderationSystem.logModerationAction(
            interaction.guild,
            null,
            user,
            'bulk_message_delete',
            `Cleared ${deletedCount} messages from ${targetChannel.name} (${number} requested)`
        );
        
        console.log(`🛡️ ${user.tag} cleared ${deletedCount} messages from #${targetChannel.name}`);
        
    } catch (error) {
        console.error('Clear command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error Clearing Messages')
            .setDescription('There was an error clearing messages. This could be due to:\n• Missing permissions\n• Messages being too old (>14 days)\n• Rate limiting')
            .addFields(
                { name: '🔧 Troubleshooting', value: 'Ensure the bot has **Manage Messages** permission in the target channel.', inline: false }
            )
            .setColor(0xE74C3C);
        
        if (interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleUserCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
        switch (subcommand) {
            case 'auth':
                await handleUserAuth(interaction);
                break;
            
            case 'list':
                await handleUserList(interaction);
                break;
            
            default:
                await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
        }
    } catch (error) {
        console.error('User command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error processing your request.')
            .setColor(0xE74C3C);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleUserAuth(interaction) {
    const targetUser = interaction.options.getUser('target');
    const action = interaction.options.getString('action');
    const executor = interaction.user;
    
    try {
        // Prevent self-authorization
        if (targetUser.id === executor.id) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Target')
                .setDescription('You cannot modify your own authorization status.')
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Prevent authorizing bots
        if (targetUser.bot) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Target')
                .setDescription('You cannot authorize bot accounts.')
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        switch (action) {
            case 'grant':
                await handleGrantAccess(interaction, targetUser, executor);
                break;
            
            case 'revoke':
                await handleRevokeAccess(interaction, targetUser, executor);
                break;
            
            case 'check':
                await handleCheckAccess(interaction, targetUser);
                break;
        }
    } catch (error) {
        console.error('User auth error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Authorization Error')
            .setDescription('There was an error managing user authorization.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleGrantAccess(interaction, targetUser, executor) {
    const isAlreadyAuthorized = await database.isUserAuthorized(targetUser.id);
    
    if (isAlreadyAuthorized) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Already Authorized')
            .setDescription(`**${targetUser.tag}** is already authorized to use the bot.`)
            .setColor(0xF39C12);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    await database.addAuthorizedUser(targetUser.id, targetUser.tag, executor.id);
    
    const embed = new EmbedBuilder()
        .setTitle('✅ Access Granted')
        .setDescription(`**${targetUser.tag}** has been granted access to the bot.`)
        .addFields(
            { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
            { name: '🔑 Granted by', value: `${executor.tag}`, inline: true },
            { name: '⏰ Granted at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            { name: '🛡️ Permissions', value: 'All commands except user management', inline: false }
        )
        .setColor(0x2ECC71)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
    // Log the action
    await moderationSystem.logModerationAction(
        interaction.guild,
        targetUser,
        executor,
        'user_authorization_granted',
        `User granted bot access by ${executor.tag}`
    );
    
    console.log(`🛡️ ${executor.tag} granted bot access to ${targetUser.tag}`);
}

async function handleRevokeAccess(interaction, targetUser, executor) {
    const isAuthorized = await database.isUserAuthorized(targetUser.id);
    
    if (!isAuthorized) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Not Authorized')
            .setDescription(`**${targetUser.tag}** is not currently authorized to use the bot.`)
            .setColor(0xF39C12);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    await database.removeAuthorizedUser(targetUser.id);
    
    const embed = new EmbedBuilder()
        .setTitle('🔒 Access Revoked')
        .setDescription(`**${targetUser.tag}** no longer has access to the bot.`)
        .addFields(
            { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
            { name: '🔑 Revoked by', value: `${executor.tag}`, inline: true },
            { name: '⏰ Revoked at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setColor(0xE74C3C)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
    // Log the action
    await moderationSystem.logModerationAction(
        interaction.guild,
        targetUser,
        executor,
        'user_authorization_revoked',
        `User access revoked by ${executor.tag}`
    );
    
    console.log(`🛡️ ${executor.tag} revoked bot access from ${targetUser.tag}`);
}

async function handleCheckAccess(interaction, targetUser) {
    const authorizedUser = await database.getAuthorizedUser(targetUser.id);
    
    if (!authorizedUser) {
        const embed = new EmbedBuilder()
            .setTitle('🔒 Access Status: Denied')
            .setDescription(`**${targetUser.tag}** is not authorized to use the bot.`)
            .addFields(
                { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                { name: '🔑 Status', value: 'Not Authorized', inline: true }
            )
            .setColor(0xE74C3C)
            .setThumbnail(targetUser.displayAvatarURL());
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
        .setTitle('✅ Access Status: Authorized')
        .setDescription(`**${targetUser.tag}** is authorized to use the bot.`)
        .addFields(
            { name: '👤 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
            { name: '🔑 Status', value: 'Authorized', inline: true },
            { name: '⏰ Granted at', value: `<t:${Math.floor(new Date(authorizedUser.granted_at).getTime() / 1000)}:F>`, inline: true },
            { name: '🛡️ Permissions', value: 'All commands except user management', inline: false }
        )
        .setColor(0x2ECC71)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleUserList(interaction) {
    const authorizedUsers = await database.getAllAuthorizedUsers();
    
    const embed = new EmbedBuilder()
        .setTitle('👥 Authorized Users')
        .setDescription('List of all users authorized to use the bot')
        .setColor(0x3742FA)
        .setTimestamp();
    
    if (authorizedUsers.length === 0) {
        embed.addFields({
            name: '📝 No Authorized Users',
            value: 'No users have been granted bot access yet.',
            inline: false
        });
    } else {
        const userList = authorizedUsers.map((user, index) => {
            const grantedAt = Math.floor(new Date(user.granted_at).getTime() / 1000);
            return `**${index + 1}.** ${user.username}\n📅 Granted: <t:${grantedAt}:R>\n🆔 ID: \`${user.user_id}\``;
        }).join('\n\n');
        
        embed.addFields({
            name: `📋 Authorized Users (${authorizedUsers.length})`,
            value: userList.length > 1024 ? userList.substring(0, 1021) + '...' : userList,
            inline: false
        });
    }
    
    embed.setFooter({ text: `Total: ${authorizedUsers.length} authorized user${authorizedUsers.length !== 1 ? 's' : ''}` });
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Handle select menu interactions
async function handleSelectMenu(interaction) {
    const { customId, values } = interaction;
    
    try {
        // Check authentication for protected select menus
        const authCheck = await authSystem.requireAuthentication(interaction);
        if (authCheck.required) {
            return await interaction.reply(authCheck.response);
        }
        
        switch (customId) {
            case 'setup_main_menu':
                await handleMainMenuSelection(interaction, values[0]);
                break;
            
            case 'automod_toggle':
                await handleAutoModToggle(interaction, values[0]);
                break;
            
            case 'advanced_settings_toggle':
                await handleAdvancedSettingsToggle(interaction, values[0]);
                break;
            
            default:
                await interaction.reply({ content: 'Unknown menu interaction!', ephemeral: true });
        }
    } catch (error) {
        console.error('Select menu error:', error);
        await interaction.reply({ content: 'There was an error processing your selection!', ephemeral: true });
    }
}

async function handleMainMenuSelection(interaction, selection) {
    const guildId = interaction.guild.id;
    
    switch (selection) {
        case 'spam_protection':
            const spamMenu = await setupSystem.createSpamProtectionMenu(guildId);
            await interaction.update(spamMenu);
            break;
        
        case 'raid_protection':
            const raidMenu = await setupSystem.createRaidProtectionMenu(guildId);
            await interaction.update(raidMenu);
            break;
        
        case 'auto_moderation':
            const autoModMenu = await setupSystem.createAutoModerationMenu(guildId);
            await interaction.update(autoModMenu);
            break;
        
        case 'anti_nuke':
            const antiNukeMenu = await setupSystem.createAntiNukeMenu(guildId);
            await interaction.update(antiNukeMenu);
            break;
        
        case 'panic_button':
            const panicMenu = await setupSystem.createPanicButtonMenu(guildId);
            await interaction.update(panicMenu);
            break;
        
        case 'view_config':
            const configView = await setupSystem.createCurrentConfigView(guildId);
            await interaction.update(configView);
            break;
        
        case 'warning_system':
            const warningMenu = await setupSystem.createWarningSystemMenu(guildId);
            await interaction.update(warningMenu);
            break;
        
        case 'advanced_settings':
            const advancedMenu = await setupSystem.createAdvancedSettingsMenu(guildId);
            await interaction.update(advancedMenu);
            break;
        
        default:
            await interaction.reply({ content: 'This feature is coming soon!', ephemeral: true });
    }
}

async function handleAutoModToggle(interaction, feature) {
    const guildId = interaction.guild.id;
    const settings = await database.getModerationSettings(guildId);
    
    // Toggle the selected feature
    const newValue = !settings[feature];
    await database.updateModerationSettings(guildId, { [feature]: newValue });
    
    // Update the menu to reflect changes
    const autoModMenu = await setupSystem.createAutoModerationMenu(guildId);
    await interaction.update(autoModMenu);
}

// Handle button interactions
async function handleButton(interaction) {
    const { customId } = interaction;
    
    try {
        // Authentication buttons don't require auth check
        const authButtons = [
            'auth_start_setup', 'auth_login', 'auth_verify_setup'
        ];
        
        if (!authButtons.includes(customId)) {
            // Check authentication for protected buttons
            const authCheck = await authSystem.requireAuthentication(interaction);
            if (authCheck.required) {
                return await interaction.reply(authCheck.response);
            }
        }

        switch (customId) {
            // Authentication buttons
            case 'auth_start_setup':
                await handleAuthStartSetup(interaction);
                break;
            
            case 'auth_login':
                await handleAuthLogin(interaction);
                break;
            
            case 'auth_verify_setup':
                await handleAuthVerifySetup(interaction);
                break;
            
            // Regular bot buttons (require authentication)
            case 'setup_back':
                const mainMenu = await setupSystem.createMainSetupMenu();
                await interaction.update(mainMenu);
                break;
            
            case 'spam_toggle':
                await handleSpamToggle(interaction);
                break;
            
            case 'raid_toggle':
                await handleRaidToggle(interaction);
                break;
            
            case 'panic_activate':
                await handlePanicActivate(interaction);
                break;
            
            case 'panic_deactivate':
                await handlePanicDeactivate(interaction);
                break;
            
            case 'panic_confirm':
                await handlePanicConfirm(interaction);
                break;
            
            case 'panic_cancel':
                await interaction.update({ content: 'Panic mode cancelled.', embeds: [], components: [] });
                break;
            
            case 'spam_configure':
                await showSpamConfigModal(interaction);
                break;
            
            case 'anti_nuke_toggle':
                await handleAntiNukeToggle(interaction);
                break;
            
            case 'anti_nuke_configure':
                await showAntiNukeConfigModal(interaction);
                break;
            
            case 'warning_system_toggle':
                await handleWarningSystemToggle(interaction);
                break;
            
            case 'warning_system_configure':
                await showWarningConfigModal(interaction);
                break;
            
            case 'advanced_reset':
                await handleAdvancedReset(interaction);
                break;
            
            default:
                await interaction.reply({ content: 'Unknown button interaction!', ephemeral: true });
        }
    } catch (error) {
        console.error('Button error:', error);
        await interaction.reply({ content: 'There was an error processing your request!', ephemeral: true });
    }
}

async function handleSpamToggle(interaction) {
    const guildId = interaction.guild.id;
    const settings = await database.getModerationSettings(guildId);
    
    const newValue = !settings.spam_protection;
    await database.updateModerationSettings(guildId, { spam_protection: newValue });
    
    const spamMenu = await setupSystem.createSpamProtectionMenu(guildId);
    await interaction.update(spamMenu);
}

async function handleRaidToggle(interaction) {
    const guildId = interaction.guild.id;
    const settings = await database.getModerationSettings(guildId);
    
    const newValue = !settings.raid_protection;
    await database.updateModerationSettings(guildId, { raid_protection: newValue });
    
    const raidMenu = await setupSystem.createRaidProtectionMenu(guildId);
    await interaction.update(raidMenu);
}

async function handleAntiNukeToggle(interaction) {
    const guildId = interaction.guild.id;
    const settings = await database.getModerationSettings(guildId);
    
    const newValue = !settings.anti_nuke;
    await database.updateModerationSettings(guildId, { anti_nuke: newValue });
    
    const antiNukeMenu = await setupSystem.createAntiNukeMenu(guildId);
    await interaction.update(antiNukeMenu);
}

async function handlePanicActivate(interaction) {
    const result = await moderationSystem.activatePanicMode(interaction.guild, interaction.user);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setTitle('🆘 PANIC MODE ACTIVATED')
            .setDescription(`Server lockdown initiated!\n\n**Actions taken:**\n• All channels locked\n• ${result.kickedCount} members kicked\n• Maximum security enabled`)
            .setColor(0xFF4757)
            .setTimestamp();
        
        await interaction.update({ embeds: [embed], components: [] });
    } else {
        await interaction.reply({ content: `Failed to activate panic mode: ${result.error}`, ephemeral: true });
    }
}

async function handlePanicDeactivate(interaction) {
    const result = await moderationSystem.deactivatePanicMode(interaction.guild, interaction.user);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setTitle('🔓 Panic Mode Deactivated')
            .setDescription('Server has been unlocked and returned to normal operation.')
            .setColor(0x4ECDC4)
            .setTimestamp();
        
        const panicMenu = await setupSystem.createPanicButtonMenu(interaction.guild.id);
        await interaction.update(panicMenu);
    } else {
        await interaction.reply({ content: `Failed to deactivate panic mode: ${result.error}`, ephemeral: true });
    }
}

async function handleWarningSystemToggle(interaction) {
    const guildId = interaction.guild.id;
    const settings = await database.getModerationSettings(guildId);
    
    const newValue = !settings.warning_system;
    await database.updateModerationSettings(guildId, { warning_system: newValue });
    
    const warningMenu = await setupSystem.createWarningSystemMenu(guildId);
    await interaction.update(warningMenu);
}

async function handleAdvancedSettingsToggle(interaction, feature) {
    const guildId = interaction.guild.id;
    const settings = await database.getModerationSettings(guildId);
    
    // Toggle the selected feature
    const newValue = !settings[feature];
    await database.updateModerationSettings(guildId, { [feature]: newValue });
    
    // Update the menu to reflect changes
    const advancedMenu = await setupSystem.createAdvancedSettingsMenu(guildId);
    await interaction.update(advancedMenu);
}

async function handleAdvancedReset(interaction) {
    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Reset Configuration')
        .setDescription('Are you sure you want to reset all settings to defaults? This action cannot be undone!')
        .setColor(0xFF6B6B);

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('advanced_reset_confirm')
                .setLabel('Yes, Reset All')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('advanced_reset_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [confirmEmbed], components: [buttons] });
}

async function handlePanicConfirm(interaction) {
    const result = await moderationSystem.activatePanicMode(interaction.guild, interaction.user);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setTitle('🆘 PANIC MODE ACTIVATED')
            .setDescription(`**EMERGENCY LOCKDOWN INITIATED**\n\n**Actions taken:**\n• All channels locked 🔒\n• ${result.kickedCount} members kicked 👢\n• Maximum security enabled 🛡️\n\nServer is now in emergency mode.`)
            .setColor(0xFF4757)
            .setTimestamp();
        
        await interaction.update({ embeds: [embed], components: [] });
    } else {
        await interaction.update({ content: `❌ Failed to activate panic mode: ${result.error}`, embeds: [], components: [] });
    }
}

async function showSpamConfigModal(interaction) {
    const settings = await database.getModerationSettings(interaction.guild.id);
    
    const modal = new ModalBuilder()
        .setCustomId('spam_config_modal')
        .setTitle('Spam Protection Configuration');

    const messageCountInput = new TextInputBuilder()
        .setCustomId('spam_message_count')
        .setLabel('Number of messages')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('5')
        .setValue((settings.spam_message_count || 5).toString())
        .setRequired(true);

    const timeWindowInput = new TextInputBuilder()
        .setCustomId('spam_time_window')
        .setLabel('Time window (seconds)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('5')
        .setValue(((settings.spam_time_window || 5000) / 1000).toString())
        .setRequired(true);

    const punishmentInput = new TextInputBuilder()
        .setCustomId('spam_punishment')
        .setLabel('Punishment type')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('timeout, mute, kick, ban, warn')
        .setValue(settings.spam_punishment || 'timeout')
        .setRequired(true);

    const durationInput = new TextInputBuilder()
        .setCustomId('spam_duration')
        .setLabel('Punishment duration')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('600 (in seconds)')
        .setValue((settings.spam_punishment_duration || 600).toString())
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(messageCountInput),
        new ActionRowBuilder().addComponents(timeWindowInput),
        new ActionRowBuilder().addComponents(punishmentInput),
        new ActionRowBuilder().addComponents(durationInput)
    );

    await interaction.showModal(modal);
}

async function showAntiNukeConfigModal(interaction) {
    const settings = await database.getModerationSettings(interaction.guild.id);
    
    const modal = new ModalBuilder()
        .setCustomId('anti_nuke_config_modal')
        .setTitle('Configure Anti-Nuke Protection');

    const channelCreateInput = new TextInputBuilder()
        .setCustomId('channel_create_limit')
        .setLabel('Channel create limit per minute')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('3')
        .setValue((settings.channel_create_limit || 3).toString())
        .setRequired(true);

    const channelDeleteInput = new TextInputBuilder()
        .setCustomId('channel_delete_limit')
        .setLabel('Channel delete limit per minute')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('3')
        .setValue((settings.channel_delete_limit || 3).toString())
        .setRequired(true);

    const roleCreateInput = new TextInputBuilder()
        .setCustomId('role_create_limit')
        .setLabel('Role create limit per minute')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('5')
        .setValue((settings.role_create_limit || 5).toString())
        .setRequired(true);

    const roleDeleteInput = new TextInputBuilder()
        .setCustomId('role_delete_limit')
        .setLabel('Role delete limit per minute')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('3')
        .setValue((settings.role_delete_limit || 3).toString())
        .setRequired(true);

    const kickLimitInput = new TextInputBuilder()
        .setCustomId('member_kick_limit')
        .setLabel('Member kick limit per minute')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('5')
        .setValue((settings.member_kick_limit || 5).toString())
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(channelCreateInput),
        new ActionRowBuilder().addComponents(channelDeleteInput),
        new ActionRowBuilder().addComponents(roleCreateInput),
        new ActionRowBuilder().addComponents(roleDeleteInput),
        new ActionRowBuilder().addComponents(kickLimitInput)
    );

    await interaction.showModal(modal);
}

// Handle modal submissions
async function handleModal(interaction) {
    try {
        switch (interaction.customId) {
            case 'auth_password_setup':
                await handleAuthPasswordSetup(interaction);
                break;
            
            case 'auth_login_submit':
                await handleAuthLoginSubmit(interaction);
                break;
            
            case 'auth_verify_setup_submit':
                await handleAuthVerifySetupSubmit(interaction);
                break;
            
            case 'spam_config_modal':
                await handleSpamConfigModal(interaction);
                break;
            
            case 'anti_nuke_config_modal':
                await handleAntiNukeConfigModal(interaction);
                break;
            
            case 'warning_config_modal':
                await handleWarningConfigModal(interaction);
                break;
        }
    } catch (error) {
        console.error('Modal error:', error);
        const response = { content: 'There was an error processing your submission!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
}

async function handleSpamConfigModal(interaction) {
    try {
        const messageCount = parseInt(interaction.fields.getTextInputValue('spam_message_count'));
        const timeWindow = parseInt(interaction.fields.getTextInputValue('spam_time_window')) * 1000; // Convert to milliseconds
        const punishment = interaction.fields.getTextInputValue('spam_punishment').toLowerCase().trim();
        const duration = parseInt(interaction.fields.getTextInputValue('spam_duration'));
        
        // Validate inputs
        if (isNaN(messageCount) || messageCount < 1 || messageCount > 50) {
            throw new Error('Message count must be between 1 and 50');
        }
        
        if (isNaN(timeWindow) || timeWindow < 1000 || timeWindow > 60000) {
            throw new Error('Time window must be between 1 and 60 seconds');
        }
        
        const validPunishments = ['timeout', 'mute', 'kick', 'ban', 'warn'];
        if (!validPunishments.includes(punishment)) {
            throw new Error('Invalid punishment type. Use: timeout, mute, kick, ban, or warn');
        }
        
        if (punishment !== 'kick' && punishment !== 'warn' && (isNaN(duration) || duration < 1)) {
            throw new Error('Duration must be a positive number for timed punishments');
        }
        
        console.log(`🛡️ Updating spam protection settings:`, {
            messageCount,
            timeWindow,
            punishment,
            duration
        });
        
        // Update settings in database
        await database.updateModerationSettings(interaction.guild.id, {
            spam_message_count: messageCount,
            spam_time_window: timeWindow,
            spam_punishment: punishment,
            spam_punishment_duration: duration,
            spam_punishment_unit: 'seconds' // Always seconds for now
        });
        
        // Return to the spam protection menu to show updated settings
        const spamMenu = await setupSystem.createSpamProtectionMenu(interaction.guild.id);
        await interaction.update(spamMenu);
        
        console.log(`✅ Spam protection settings updated successfully for guild ${interaction.guild.id}`);
        
    } catch (error) {
        console.error('Error updating spam config:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Configuration Error')
            .setDescription(`Failed to update spam protection settings: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleAntiNukeConfigModal(interaction) {
    const channelCreateLimit = parseInt(interaction.fields.getTextInputValue('channel_create_limit'));
    const channelDeleteLimit = parseInt(interaction.fields.getTextInputValue('channel_delete_limit'));
    const roleCreateLimit = parseInt(interaction.fields.getTextInputValue('role_create_limit'));
    const roleDeleteLimit = parseInt(interaction.fields.getTextInputValue('role_delete_limit'));
    const memberKickLimit = parseInt(interaction.fields.getTextInputValue('member_kick_limit'));
    
    await database.updateModerationSettings(interaction.guild.id, {
        channel_create_limit: channelCreateLimit,
        channel_delete_limit: channelDeleteLimit,
        role_create_limit: roleCreateLimit,
        role_delete_limit: roleDeleteLimit,
        member_kick_limit: memberKickLimit
    });
    
    // Return to the anti-nuke menu to show updated settings
    const antiNukeMenu = await setupSystem.createAntiNukeMenu(interaction.guild.id);
    await interaction.update(antiNukeMenu);
}

async function showWarningConfigModal(interaction) {
    const settings = await database.getModerationSettings(interaction.guild.id);
    
    const modal = new ModalBuilder()
        .setCustomId('warning_config_modal')
        .setTitle('Warning System Configuration');

    const thresholdInput = new TextInputBuilder()
        .setCustomId('warning_threshold')
        .setLabel('Warning threshold (number of warnings before action)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('3')
        .setValue((settings.warning_threshold || 3).toString())
        .setRequired(true);

    const autoPunishmentInput = new TextInputBuilder()
        .setCustomId('warning_auto_punishment')
        .setLabel('Auto punishment type')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('timeout, kick, ban')
        .setValue(settings.warning_auto_punishment || 'timeout')
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(thresholdInput),
        new ActionRowBuilder().addComponents(autoPunishmentInput)
    );

    await interaction.showModal(modal);
}

async function handleWarningConfigModal(interaction) {
    try {
        const threshold = parseInt(interaction.fields.getTextInputValue('warning_threshold'));
        const autoPunishment = interaction.fields.getTextInputValue('warning_auto_punishment').toLowerCase().trim();
        
        // Validate inputs
        if (isNaN(threshold) || threshold < 1 || threshold > 10) {
            throw new Error('Warning threshold must be between 1 and 10');
        }
        
        const validPunishments = ['timeout', 'kick', 'ban'];
        if (!validPunishments.includes(autoPunishment)) {
            throw new Error('Invalid punishment type. Use: timeout, kick, or ban');
        }
        
        console.log(`🛡️ Updating warning system settings:`, {
            threshold,
            autoPunishment
        });
        
        // Update settings in database
        await database.updateModerationSettings(interaction.guild.id, {
            warning_threshold: threshold,
            warning_auto_punishment: autoPunishment
        });
        
        // Return to the warning system menu to show updated settings
        const warningMenu = await setupSystem.createWarningSystemMenu(interaction.guild.id);
        await interaction.update(warningMenu);
        
        console.log(`✅ Warning system settings updated successfully for guild ${interaction.guild.id}`);
        
    } catch (error) {
        console.error('Error updating warning config:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Configuration Error')
            .setDescription(`Failed to update warning system settings: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

// Authentication button handlers
async function handleAuthStartSetup(interaction) {
    const hasRegistered = await authSystem.hasAnyRegisteredUser();
    if (hasRegistered) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Setup Already Complete')
            .setDescription('Authentication has already been set up by another user. Only one person can control this bot.')
            .setColor(0xE74C3C);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const modal = await authSystem.createPasswordSetupModal();
    await interaction.showModal(modal);
}

async function handleAuthLogin(interaction) {
    const modal = await authSystem.createLoginModal();
    await interaction.showModal(modal);
}

async function handleAuthVerifySetup(interaction) {
    const modal = await authSystem.createVerifySetupModal();
    await interaction.showModal(modal);
}

// Authentication modal handlers
async function handleAuthPasswordSetup(interaction) {
    try {
        const password = interaction.fields.getTextInputValue('password');
        const confirmPassword = interaction.fields.getTextInputValue('confirm_password');
        const username = interaction.user.username;
        const userId = interaction.user.id;
        
        const result = await authSystem.setupPassword(userId, username, password, confirmPassword);
        
        // Generate QR code
        const qrBuffer = await authSystem.generateQRCode(result.qrCode);
        
        // Create setup embed with QR code
        const setupEmbed = await authSystem.createQRSetupEmbed(result.secret, qrBuffer, result.backupCodes);
        
        await interaction.reply({ ...setupEmbed, ephemeral: true });
        
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Setup Failed')
            .setDescription(`Error: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handleAuthLoginSubmit(interaction) {
    try {
        const password = interaction.fields.getTextInputValue('password');
        const totpCode = interaction.fields.getTextInputValue('totp_code');
        const userId = interaction.user.id;
        
        await authSystem.authenticateUser(userId, password, totpCode);
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Login Successful')
            .setDescription(`Welcome back, ${interaction.user.username}! You are now authenticated.`)
            .addFields(
                { name: '🕒 Session Duration', value: '24 hours', inline: true },
                { name: '🛡️ Security Status', value: 'Fully authenticated', inline: true }
            )
            .setColor(0x2ECC71);
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Login Failed')
            .setDescription(`Error: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handleAuthVerifySetupSubmit(interaction) {
    try {
        const totpCode = interaction.fields.getTextInputValue('totp_code');
        const userId = interaction.user.id;
        
        await authSystem.completeSetup(userId, totpCode);
        
        // Create session for the user
        await authSystem.createSession(userId);
        
        const successEmbed = await authSystem.createSuccessEmbed(interaction.user.username);
        await interaction.reply({ ...successEmbed, ephemeral: true });
        
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Verification Failed')
            .setDescription(`Error: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

// Handle user returning from AFK
async function handleUserReturnFromAFK(message) {
    try {
        const user = message.author;
        const guild = message.guild;
        
        // Remove AFK status
        await database.removeUserAFK(guild.id, user.id);
        
        // Find general channel
        let generalChannel = guild.channels.cache.find(channel => 
            channel.name.toLowerCase().includes('general') && channel.type === 0
        );
        
        if (!generalChannel) {
            generalChannel = guild.channels.cache.find(channel => channel.type === 0);
        }
        
        // Send return announcement to general channel
        if (generalChannel) {
            const returnEmbed = new EmbedBuilder()
                .setTitle('👋 User is back!')
                .setDescription(`**${user.tag}** is no longer AFK!`)
                .setColor(0x27AE60)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();
            
            await generalChannel.send({ embeds: [returnEmbed] });
        }
        
        console.log(`🛡️ ${user.tag} returned from AFK`);
        
    } catch (error) {
        console.error('Error handling AFK return:', error);
    }
}

// Check for expired AFK users periodically
async function checkExpiredAFKUsers() {
    try {
        const expiredUsers = await database.getExpiredAFKUsers();
        
        for (const afkUser of expiredUsers) {
            try {
                const guild = client.guilds.cache.get(afkUser.guild_id);
                if (!guild) continue;
                
                const user = await guild.members.fetch(afkUser.user_id).catch(() => null);
                if (!user) continue;
                
                // Remove AFK status
                await database.removeUserAFK(afkUser.guild_id, afkUser.user_id);
                
                // Find general channel
                let generalChannel = guild.channels.cache.find(channel => 
                    channel.name.toLowerCase().includes('general') && channel.type === 0
                );
                
                if (!generalChannel) {
                    generalChannel = guild.channels.cache.find(channel => channel.type === 0);
                }
                
                // Send return announcement
                if (generalChannel) {
                    const returnEmbed = new EmbedBuilder()
                        .setTitle('⏰ AFK Time Expired')
                        .setDescription(`**${user.user.tag}** is no longer AFK!`)
                        .setColor(0x27AE60)
                        .setThumbnail(user.user.displayAvatarURL())
                        .setTimestamp();
                    
                    await generalChannel.send({ embeds: [returnEmbed] });
                }
                
                console.log(`🛡️ ${user.user.tag} AFK time expired automatically`);
                
            } catch (error) {
                console.error('Error processing expired AFK user:', error);
            }
        }
    } catch (error) {
        console.error('Error checking expired AFK users:', error);
    }
}

// Start periodic AFK check
setInterval(checkExpiredAFKUsers, 60000); // Check every minute

// Listen for messages to check for spam and auto-moderation
client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild) return;
    
    // Check if user is AFK and remove status if they send a message
    try {
        const afkStatus = await database.getUserAFK(message.guild.id, message.author.id);
        if (afkStatus) {
            await handleUserReturnFromAFK(message);
            return; // Don't process other moderation for this message
        }
    } catch (error) {
        console.error('Error checking AFK status:', error);
    }
    
    // Check spam protection
    const isSpam = await moderationSystem.checkSpamProtection(message);
    if (isSpam) {
        try {
            await message.delete();
        } catch (error) {
            console.error('Failed to delete spam message:', error);
        }
        return;
    }
    
    // Check auto-moderation
    await moderationSystem.checkAutoModeration(message);
});

// Listen for member joins to check for raids
client.on(Events.GuildMemberAdd, async member => {
    await moderationSystem.checkRaidProtection(member);
});

// Anti-Nuke Protection Event Listeners
client.on(Events.ChannelCreate, async channel => {
    if (channel.guild) {
        await moderationSystem.checkAntiNuke(channel.guild, 'channel_create', channel.guild.members.me);
    }
});

client.on(Events.ChannelDelete, async channel => {
    if (channel.guild) {
        // Try to get the user who deleted the channel from audit logs
        try {
            const botMember = channel.guild.members.me;
            if (!botMember || !botMember.permissions.has('ViewAuditLog')) {
                console.log('⚠️ Missing "View Audit Log" permission for anti-nuke protection');
                return;
            }
            
            const auditLogs = await channel.guild.fetchAuditLogs({
                type: 12, // CHANNEL_DELETE
                limit: 1
            });
            const deleteLog = auditLogs.entries.first();
            if (deleteLog && Date.now() - deleteLog.createdTimestamp < 5000) {
                await moderationSystem.checkAntiNuke(channel.guild, 'channel_delete', deleteLog.executor);
            }
        } catch (error) {
            if (error.code === 50013) {
                console.log('⚠️ Missing permissions for audit log access');
            } else if (error.code === 10004) {
                console.log('⚠️ Guild not found in audit logs');
            } else {
                console.error('Error checking channel delete audit logs:', error);
            }
        }
    }
});

client.on(Events.GuildRoleCreate, async role => {
    try {
        const botMember = role.guild.members.me;
        if (!botMember || !botMember.permissions.has('ViewAuditLog')) {
            console.log('⚠️ Missing "View Audit Log" permission for anti-nuke protection');
            return;
        }
        
        const auditLogs = await role.guild.fetchAuditLogs({
            type: 30, // ROLE_CREATE
            limit: 1
        });
        const createLog = auditLogs.entries.first();
        if (createLog && Date.now() - createLog.createdTimestamp < 5000) {
            await moderationSystem.checkAntiNuke(role.guild, 'role_create', createLog.executor);
        }
    } catch (error) {
        if (error.code === 50013) {
            console.log('⚠️ Missing permissions for audit log access');
        } else if (error.code === 10004) {
            console.log('⚠️ Guild not found in audit logs');
        } else {
            console.error('Error checking role create audit logs:', error);
        }
    }
});

client.on(Events.GuildRoleDelete, async role => {
    try {
        const botMember = role.guild.members.me;
        if (!botMember || !botMember.permissions.has('ViewAuditLog')) {
            console.log('⚠️ Missing "View Audit Log" permission for anti-nuke protection');
            return;
        }
        
        const auditLogs = await role.guild.fetchAuditLogs({
            type: 32, // ROLE_DELETE
            limit: 1
        });
        const deleteLog = auditLogs.entries.first();
        if (deleteLog && Date.now() - deleteLog.createdTimestamp < 5000) {
            await moderationSystem.checkAntiNuke(role.guild, 'role_delete', deleteLog.executor);
        }
    } catch (error) {
        if (error.code === 50013) {
            console.log('⚠️ Missing permissions for audit log access');
        } else if (error.code === 10004) {
            console.log('⚠️ Guild not found in audit logs');
        } else {
            console.error('Error checking role delete audit logs:', error);
        }
    }
});

client.on(Events.GuildMemberRemove, async member => {
    // Check if this was a kick or ban
    try {
        const botMember = member.guild.members.me;
        if (!botMember || !botMember.permissions.has('ViewAuditLog')) {
            console.log('⚠️ Missing "View Audit Log" permission for anti-nuke protection');
            return;
        }
        
        const kickLogs = await member.guild.fetchAuditLogs({
            type: 20, // MEMBER_KICK
            limit: 1
        });
        const kickLog = kickLogs.entries.first();
        if (kickLog && Date.now() - kickLog.createdTimestamp < 5000 && kickLog.target.id === member.id) {
            await moderationSystem.checkAntiNuke(member.guild, 'member_kick', kickLog.executor);
            return;
        }

        const banLogs = await member.guild.fetchAuditLogs({
            type: 22, // MEMBER_BAN_ADD
            limit: 1
        });
        const banLog = banLogs.entries.first();
        if (banLog && Date.now() - banLog.createdTimestamp < 5000 && banLog.target.id === member.id) {
            await moderationSystem.checkAntiNuke(member.guild, 'member_ban', banLog.executor);
        }
    } catch (error) {
        if (error.code === 50013) {
            console.log('⚠️ Missing permissions for audit log access');
        } else if (error.code === 10004) {
            console.log('⚠️ Guild not found in audit logs');
        } else {
            console.error('Error checking member removal audit logs:', error);
        }
    }
});

// Handle errors
client.on(Events.Error, error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Create a simple health check server for hosting platforms
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            uptime: process.uptime(),
            botStatus: client.isReady() ? 'online' : 'offline',
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Health check server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down Guardian Security Bot...');
    database.close();
    client.destroy();
    server.close();
    process.exit(0);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
