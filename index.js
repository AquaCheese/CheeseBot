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
    TextInputStyle,
    AttachmentBuilder
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
        .setName('qrcode')
        .setDescription('Generate a new QR code for 2FA setup')
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
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // Public commands (no permissions required)
    new SlashCommandBuilder()
        .setName('ascii')
        .setDescription('Convert text to classic ASCII art with dots, slashes, and underscores')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to convert to ASCII art (12 chars max for best results)')
                .setRequired(true)
                .setMaxLength(12)),

    new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion to the server staff')
        .addStringOption(option =>
            option.setName('suggestion')
                .setDescription('Your suggestion for the server')
                .setRequired(true)
                .setMaxLength(1000)),

    new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report an issue or user to the moderators')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of report')
                .setRequired(true)
                .addChoices(
                    { name: 'User Behavior', value: 'user' },
                    { name: 'Bug/Technical Issue', value: 'bug' },
                    { name: 'Content Issue', value: 'content' },
                    { name: 'Other', value: 'other' }
                ))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Detailed description of the issue')
                .setRequired(true)
                .setMaxLength(1000))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User involved (if applicable)')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Manage your birthday settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your birthday')
                .addIntegerOption(option =>
                    option.setName('day')
                        .setDescription('Day of the month (1-31)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Month (1-12)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your birthday or someone else\'s')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to view birthday for (optional)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove your birthday from the system')),

    // Ticketing System Commands
    new SlashCommandBuilder()
        .setName('createticket')
        .setDescription('Create a new support ticket')
        .addStringOption(option =>
            option.setName('subject')
                .setDescription('Brief description of your issue')
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Detailed description of your issue')
                .setRequired(false)
                .setMaxLength(1000)),

    new SlashCommandBuilder()
        .setName('closerequest')
        .setDescription('Request to close the current ticket'),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display bot help menu with public commands'),

    // Admin ticket commands
    new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to add to the ticket')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim the current ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close the current ticket')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for closing the ticket')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('adminhelp')
        .setDescription('Display complete bot help menu including admin commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Create a ticket panel for easy ticket creation')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('priority')
        .setDescription('Set priority level for the current ticket')
        .addStringOption(option =>
            option.setName('level')
                .setDescription('Priority level')
                .setRequired(true)
                .addChoices(
                    { name: 'Low', value: 'low' },
                    { name: 'Normal', value: 'normal' },
                    { name: 'High', value: 'high' },
                    { name: 'Urgent', value: 'urgent' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove from the ticket')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('rename')
        .setDescription('Rename the current ticket')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('New name for the ticket')
                .setRequired(true)
                .setMaxLength(50))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('thread')
        .setDescription('Create a private staff thread for the current ticket')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name for the staff thread')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('unclaim')
        .setDescription('Unclaim the current ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // Counting System Commands
    new SlashCommandBuilder()
        .setName('countchannel')
        .setDescription('Set or manage the counting channel for this server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the current channel as a counting channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove counting from the current channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset the count in the current counting channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show information about the current counting channel')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('userstats')
        .setDescription('View counting statistics for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view stats for (leave empty for yourself)')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('countleaderboard')
        .setDescription('View the counting leaderboard for this server')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of leaderboard to show')
                .setRequired(false)
                .addChoices(
                    { name: 'Most Correct', value: 'correct' },
                    { name: 'Highest Number', value: 'highest' },
                    { name: 'Best Streak', value: 'streak' },
                    { name: 'Best Accuracy', value: 'accuracy' }
                )
        ),

    new SlashCommandBuilder()
        .setName('counthistory')
        .setDescription('View recent counting history for the current channel')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of recent entries to show (default: 10, max: 50)')
                .setRequired(false)
                .setMinValue(5)
                .setMaxValue(50)
        )
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

// Handle button interactions
async function handleButton(interaction) {
    try {
        const customId = interaction.customId;
        
        // Authentication buttons
        if (customId === 'auth_start_setup') {
            try {
                const modal = await authSystem.createPasswordSetupModal();
                await interaction.showModal(modal);
            } catch (error) {
                console.error('Auth start setup error:', error);
                await interaction.reply({ content: '❌ Failed to start authentication setup.', flags: [4096] });
            }
        } else if (customId === 'auth_login') {
            try {
                const modal = await authSystem.createLoginModal();
                await interaction.showModal(modal);
            } catch (error) {
                console.error('Auth login error:', error);
                await interaction.reply({ content: '❌ Failed to show login modal.', flags: [4096] });
            }
        } else if (customId === 'auth_verify_setup') {
            try {
                const modal = await authSystem.createVerifySetupModal();
                await interaction.showModal(modal);
            } catch (error) {
                console.error('Auth verify setup error:', error);
                await interaction.reply({ content: '❌ Failed to show verification modal.', flags: [4096] });
            }
        }
        
        // Ticket buttons
        else if (customId === 'create_ticket_panel') {
            await handleCreateTicketPanel(interaction);
        } else if (customId.startsWith('ticket_close_confirm_')) {
            await handleTicketCloseConfirm(interaction);
        } else if (customId.startsWith('ticket_close_cancel_')) {
            await handleTicketCloseCancel(interaction);
        } else if (customId.startsWith('ticket_close_')) {
            await handleTicketCloseButton(interaction);
        } else if (customId.startsWith('ticket_claim_')) {
            await handleTicketClaimButton(interaction);
        }
        
        // Setup system buttons
        else if (customId === 'spam_toggle') {
            await handleSpamToggle(interaction);
        } else if (customId === 'spam_configure') {
            await showSpamConfigModal(interaction);
        } else if (customId === 'raid_toggle') {
            await handleRaidToggle(interaction);
        } else if (customId === 'raid_configure') {
            await showRaidConfigModal(interaction);
        } else if (customId === 'anti_nuke_toggle') {
            await handleAntiNukeToggle(interaction);
        } else if (customId === 'anti_nuke_configure') {
            await showAntiNukeConfigModal(interaction);
        } else if (customId === 'warning_system_toggle') {
            await handleWarningSystemToggle(interaction);
        } else if (customId === 'warning_configure') {
            await showWarningConfigModal(interaction);
        } else if (customId === 'automod_configure') {
            await showAutoModConfigModal(interaction);
        } else if (customId === 'panic_roles_configure') {
            await showPanicRolesConfigModal(interaction);
        } else if (customId === 'setup_back') {
            await handleSetupBack(interaction);
        }
        
        // Panic mode buttons
        else if (customId === 'panic_activate') {
            await handlePanicActivate(interaction);
        } else if (customId === 'panic_deactivate') {
            await handlePanicDeactivate(interaction);
        } else if (customId === 'panic_confirm') {
            await handlePanicConfirm(interaction);
        }
        
        // Advanced settings buttons
        else if (customId.startsWith('advanced_toggle_')) {
            const feature = customId.replace('advanced_toggle_', '');
            await handleAdvancedSettingsToggle(interaction, feature);
        } else if (customId === 'advanced_reset') {
            await handleAdvancedReset(interaction);
        } else if (customId === 'advanced_reset_confirm') {
            await handleAdvancedResetConfirm(interaction);
        } else if (customId === 'advanced_reset_cancel') {
            await handleAdvancedResetCancel(interaction);
        } else if (customId === 'config_export') {
            await handleConfigExport(interaction);
        }
        
        else {
            console.log(`Unhandled button interaction: ${customId}`);
            await interaction.reply({ content: 'This button is not yet implemented.', flags: [4096] }); // MessageFlags.Ephemeral
        }
    } catch (error) {
        console.error('Button interaction error:', error);
        const response = { content: 'There was an error processing this button interaction!', flags: [4096] }; // MessageFlags.Ephemeral
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
}

// Handle select menu interactions
async function handleSelectMenu(interaction) {
    try {
        const customId = interaction.customId;
        const selectedValue = interaction.values[0];
        
        // Main setup menu
        if (customId === 'setup_main_menu') {
            await handleMainMenuSelection(interaction, selectedValue);
        }
        // Setup system select menus
        else if (customId === 'setup_menu') {
            await setupSystem.handleSetupMenuSelection(interaction, selectedValue);
        } else if (customId === 'moderation_menu') {
            await setupSystem.handleModerationMenuSelection(interaction, selectedValue);
        } else if (customId === 'advanced_menu') {
            await setupSystem.handleAdvancedMenuSelection(interaction, selectedValue);
        } else if (customId === 'logs_menu') {
            await setupSystem.handleLogsMenuSelection(interaction, selectedValue);
        } else if (customId === 'ticket_menu') {
            await setupSystem.handleTicketMenuSelection(interaction, selectedValue);
        }
        
        else {
            console.log(`Unhandled select menu interaction: ${customId}`);
            await interaction.reply({ content: 'This menu option is not yet implemented.', flags: [4096] }); // MessageFlags.Ephemeral
        }
    } catch (error) {
        console.error('Select menu interaction error:', error);
        const response = { content: 'There was an error processing this menu selection!', flags: [4096] }; // MessageFlags.Ephemeral
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
}

// Panic button handlers
async function handlePanicConfirm(interaction) {
    try {
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
    } catch (error) {
        console.error('Panic confirm error:', error);
        await interaction.reply({ 
            content: '❌ Error activating panic mode!', 
            flags: [4096] 
        });
    }
}

async function handlePanicCancel(interaction) {
    try {
        await interaction.update({ 
            content: '✅ Panic action cancelled.',
            embeds: [], 
            components: [] 
        });
    } catch (error) {
        console.error('Panic cancel error:', error);
        await interaction.reply({ 
            content: '❌ Error cancelling panic mode!', 
            flags: [4096] 
        });
    }
}

// Placeholder handlers for setup buttons (these would need to be implemented)
// Handle main setup menu selections
async function handleMainMenuSelection(interaction, selectedValue) {
    try {
        switch (selectedValue) {
            case 'spam_protection':
                const spamMenu = await setupSystem.createSpamProtectionMenu(interaction.guild.id);
                await interaction.update(spamMenu);
                break;
                
            case 'raid_protection':
                const raidMenu = await setupSystem.createRaidProtectionMenu(interaction.guild.id);
                await interaction.update(raidMenu);
                break;
                
            case 'auto_moderation':
                const autoModMenu = await setupSystem.createAutoModerationMenu(interaction.guild.id);
                await interaction.update(autoModMenu);
                break;
                
            case 'anti_nuke':
                const antiNukeMenu = await setupSystem.createAntiNukeMenu(interaction.guild.id);
                await interaction.update(antiNukeMenu);
                break;
                
            case 'warning_system':
                const warningMenu = await setupSystem.createWarningSystemMenu(interaction.guild.id);
                await interaction.update(warningMenu);
                break;
                
            case 'view_config':
                const configMenu = await setupSystem.createConfigViewMenu(interaction.guild.id);
                await interaction.update(configMenu);
                break;
                
            case 'panic_button':
                const panicMenu = await setupSystem.createPanicButtonMenu(interaction.guild.id);
                await interaction.update(panicMenu);
                break;
                
            case 'advanced_settings':
                const advancedMenu = await setupSystem.createAdvancedSettingsMenu(interaction.guild.id);
                await interaction.update(advancedMenu);
                break;
                
            default:
                await interaction.reply({ 
                    content: `Menu option "${selectedValue}" is not yet implemented.`, 
                    flags: [4096] 
                });
        }
    } catch (error) {
        console.error('Main menu selection error:', error);
        await interaction.reply({ 
            content: 'There was an error processing your selection!', 
            flags: [4096] 
        });
    }
}

async function handleSetupBack(interaction) {
    try {
        const setupMenu = await setupSystem.createMainSetupMenu();
        await interaction.update(setupMenu);
    } catch (error) {
        console.error('Setup back error:', error);
        await interaction.reply({ content: 'Error returning to main menu!', flags: [4096] });
    }
}

async function handleSpamButton(interaction) {
    await interaction.reply({ content: 'Spam button clicked', ephemeral: true });
}

async function handleRaidButton(interaction) {
    await interaction.reply({ content: 'Raid button clicked', ephemeral: true });
}

async function handleAutomodButton(interaction) {
    await interaction.reply({ content: 'Automod button clicked', ephemeral: true });
}

async function handlePanicButton(interaction) {
    await interaction.reply({ content: 'Panic button clicked', ephemeral: true });
}

async function handleAntiNukeButton(interaction) {
    await interaction.reply({ content: 'Anti-nuke button clicked', ephemeral: true });
}

async function handleWarningSystemButton(interaction) {
    await interaction.reply({ content: 'Warning system button clicked', ephemeral: true });
}

async function handleConfigExport(interaction) {
    try {
        const settings = await database.getModerationSettings(interaction.guild.id);
        const config = await database.getServerConfig(interaction.guild.id);
        
        const exportData = {
            server: {
                id: interaction.guild.id,
                name: interaction.guild.name,
                exportDate: new Date().toISOString()
            },
            channels: {
                admin_channel_id: config?.admin_channel_id || null,
                logs_channel_id: config?.logs_channel_id || null
            },
            moderation: {
                spam_protection: settings.spam_protection || false,
                spam_message_count: settings.spam_message_count || 5,
                spam_time_window: settings.spam_time_window || 5000,
                spam_punishment: settings.spam_punishment || 'timeout',
                spam_punishment_duration: settings.spam_punishment_duration || 300,
                
                raid_protection: settings.raid_protection || false,
                raid_user_threshold: settings.raid_user_threshold || 10,
                raid_time_window: settings.raid_time_window || 60,
                raid_punishment: settings.raid_punishment || 'ban',
                
                anti_nuke: settings.anti_nuke || false,
                channel_create_limit: settings.channel_create_limit || 3,
                channel_delete_limit: settings.channel_delete_limit || 3,
                role_create_limit: settings.role_create_limit || 5,
                role_delete_limit: settings.role_delete_limit || 3,
                member_kick_limit: settings.member_kick_limit || 5,
                
                warning_system: settings.warning_system || false,
                warning_threshold: settings.warning_threshold || 3,
                warning_auto_punishment: settings.warning_auto_punishment || 'timeout',
                
                auto_mod: settings.auto_mod || false,
                caps_threshold: settings.caps_threshold || 70
            },
            security: {
                safe_roles: config?.safe_roles ? JSON.parse(config.safe_roles) : []
            }
        };
        
        const configText = JSON.stringify(exportData, null, 2);
        
        const embed = new EmbedBuilder()
            .setTitle('📄 Configuration Exported')
            .setDescription('Your server configuration has been exported successfully!')
            .setColor(0x2ECC71)
            .setTimestamp();
        
        // Send as file attachment would be ideal, but for now send as code block
        const truncatedConfig = configText.length > 1800 ? 
            configText.substring(0, 1800) + '\n... (truncated)' : 
            configText;
        
        await interaction.reply({ 
            embeds: [embed], 
            content: `\`\`\`json\n${truncatedConfig}\n\`\`\``,
            flags: [4096] 
        });
        
    } catch (error) {
        console.error('Config export error:', error);
        await interaction.reply({ 
            content: '❌ Failed to export configuration!', 
            flags: [4096] 
        });
    }
}

async function handleAdvancedResetConfirm(interaction) {
    try {
        // Reset all moderation settings to defaults
        await database.updateModerationSettings(interaction.guild.id, {
            spam_protection: false,
            spam_message_count: 5,
            spam_time_window: 5000,
            spam_punishment: 'timeout',
            spam_punishment_duration: 300,
            
            raid_protection: false,
            raid_user_threshold: 10,
            raid_time_window: 60,
            raid_punishment: 'ban',
            
            anti_nuke: false,
            channel_create_limit: 3,
            channel_delete_limit: 3,
            role_create_limit: 5,
            role_delete_limit: 3,
            member_kick_limit: 5,
            
            warning_system: false,
            warning_threshold: 3,
            warning_auto_punishment: 'timeout',
            
            auto_mod: false,
            caps_threshold: 70
        });
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Configuration Reset Complete')
            .setDescription('All settings have been reset to their default values.')
            .setColor(0x2ECC71)
            .setTimestamp();
        
        await interaction.update({ embeds: [embed], components: [] });
        
        // Show main menu after 3 seconds
        setTimeout(async () => {
            try {
                const setupMenu = await setupSystem.createMainSetupMenu();
                await interaction.editReply(setupMenu);
            } catch (error) {
                console.error('Error returning to main menu:', error);
            }
        }, 3000);
        
    } catch (error) {
        console.error('Advanced reset confirm error:', error);
        await interaction.reply({ 
            content: '❌ Failed to reset configuration!', 
            flags: [4096] 
        });
    }
}

async function handleAdvancedResetCancel(interaction) {
    try {
        const advancedMenu = await setupSystem.createAdvancedSettingsMenu(interaction.guild.id);
        await interaction.update(advancedMenu);
    } catch (error) {
        console.error('Advanced reset cancel error:', error);
        await interaction.reply({ 
            content: '❌ Error cancelling reset!', 
            flags: [4096] 
        });
    }
}

async function handleSlashCommand(interaction) {
    const { commandName } = interaction;

    try {
        // Commands that don't require authentication
        const publicCommands = ['login', 'status', 'afk', 'ascii', 'suggest', 'report', 'birthday', 'userstats', 'countleaderboard', 'counthistory'];
        
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
            
            case 'qrcode':
                await handleQRCodeCommand(interaction);
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
            
            case 'ascii':
                await handleAsciiCommand(interaction);
                break;
            
            case 'suggest':
                await handleSuggestCommand(interaction);
                break;
            
            case 'report':
                await handleReportCommand(interaction);
                break;
            
            case 'birthday':
                await handleBirthdayCommand(interaction);
                break;
            
            // Ticketing System Commands
            case 'createticket':
                await handleCreateTicketCommand(interaction);
                break;
            
            case 'closerequest':
                await handleCloseRequestCommand(interaction);
                break;
            
            case 'help':
                await handleHelpCommand(interaction);
                break;
            
            case 'add':
                await handleAddUserCommand(interaction);
                break;
            
            case 'claim':
                await handleClaimCommand(interaction);
                break;
            
            case 'close':
                await handleCloseTicketCommand(interaction);
                break;
            
            case 'adminhelp':
                await handleAdminHelpCommand(interaction);
                break;
            
            case 'panel':
                await handlePanelCommand(interaction);
                break;
            
            case 'priority':
                await handlePriorityCommand(interaction);
                break;
            
            case 'remove':
                await handleRemoveUserCommand(interaction);
                break;
            
            case 'rename':
                await handleRenameCommand(interaction);
                break;
            
            case 'thread':
                await handleThreadCommand(interaction);
                break;
            
            case 'unclaim':
                await handleUnclaimCommand(interaction);
                break;

            // Counting System Commands
            case 'countchannel':
                await handleCountChannelCommand(interaction);
                break;
            
            case 'userstats':
                await handleUserStatsCommand(interaction);
                break;
            
            case 'countleaderboard':
                await handleCountLeaderboardCommand(interaction);
                break;
            
            case 'counthistory':
                await handleCountHistoryCommand(interaction);
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

async function handleQRCodeCommand(interaction) {
    try {
        // Check if user is the registered primary admin
        const isRegistered = await authSystem.isUserRegistered(interaction.user.id);
        if (!isRegistered) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Access Denied')
                .setDescription('You are not the registered primary admin. Only the primary admin can generate QR codes.')
                .setColor(0xE74C3C);
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        // Generate the QR code
        const qrData = await authSystem.generateCurrentQRCode(interaction.user.id);
        
        // Create attachment from buffer
        const attachment = new AttachmentBuilder(qrData.buffer, { name: 'qr-code.png' });
        
        const embed = new EmbedBuilder()
            .setTitle('📱 New 2FA QR Code')
            .setDescription('**Follow these steps to update your authenticator app:**\n\n' +
                           '1. **Delete** the old "Guardian Security Bot" entry from your authenticator app\n' +
                           '2. **Scan** the QR code below with your authenticator app (Authy, Google Authenticator, etc.)\n' +
                           '3. **Test** by trying to log in with a new 6-digit code\n\n' +
                           '⚠️ **Important:** This QR code contains your current authentication secret.')
            .setColor(0x3498DB)
            .setImage('attachment://qr-code.png')
            .addFields(
                { name: '🔐 Secret Key', value: `\`${qrData.secret}\``, inline: false },
                { name: '📋 Manual Entry URL', value: `||${qrData.otpAuthUrl}||`, inline: false }
            )
            .setFooter({ text: 'Keep this information secure!' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed], 
            files: [attachment], 
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('QR Code generation error:', error);
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ QR Code Generation Failed')
            .setDescription(`Failed to generate QR code: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
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

// New public command handlers
async function handleAsciiCommand(interaction) {
    const text = interaction.options.getString('text');
    
    try {
        // Limit text length to prevent huge outputs
        if (text.length > 12) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Text Too Long')
                .setDescription('Please keep your text to 12 characters or less for best results.')
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Generate classic ASCII art
        const asciiArt = generateAsciiArt(text);
        
        // Check if the result fits within Discord's embed limits
        if (asciiArt.length >= 4000) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ASCII Art Too Large')
                .setDescription('The generated ASCII art is too large to display. Try shorter text.')
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Create embed with the classic ASCII art
        const asciiEmbed = new EmbedBuilder()
            .setTitle('ASCII Art')
            .setDescription(`\`\`\`\n${asciiArt}\n\`\`\``)
            .setColor(0x3498DB)
            .setFooter({ text: `"${text}" by ${interaction.user.tag}` })
            .setTimestamp();

        // Send the ASCII art
        await interaction.reply({ embeds: [asciiEmbed] });
        
    } catch (error) {
        console.error('ASCII command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error generating ASCII art. Please try with shorter text.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleSuggestCommand(interaction) {
    const suggestion = interaction.options.getString('suggestion');
    const user = interaction.user;
    
    try {
        // Get server config to find logs channel
        const config = await database.getServerConfig(interaction.guild.id);
        
        const embed = new EmbedBuilder()
            .setTitle('💡 New Suggestion')
            .setDescription(suggestion)
            .setColor(0xF39C12)
            .addFields(
                { name: '👤 Submitted by', value: `${user.tag} (${user.id})`, inline: true },
                { name: '📅 Date', value: new Date().toLocaleString(), inline: true },
                { name: '📍 Channel', value: `<#${interaction.channel.id}>`, inline: true }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        // Try to send to logs channel if configured
        if (config && config.logs_channel_id) {
            const logsChannel = interaction.guild.channels.cache.get(config.logs_channel_id);
            if (logsChannel) {
                await logsChannel.send({ embeds: [embed] });
            }
        }
        
        // Confirmation to user
        const confirmEmbed = new EmbedBuilder()
            .setTitle('✅ Suggestion Submitted')
            .setDescription('Your suggestion has been sent to the server staff. Thank you for your feedback!')
            .setColor(0x2ECC71)
            .setFooter({ text: 'Suggestions help improve the server!' });
        
        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        
    } catch (error) {
        console.error('Suggest command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error submitting your suggestion. Please try again later.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleReportCommand(interaction) {
    const type = interaction.options.getString('type');
    const description = interaction.options.getString('description');
    const reportedUser = interaction.options.getUser('user');
    const reporter = interaction.user;
    
    try {
        // Get server config to find logs channel
        const config = await database.getServerConfig(interaction.guild.id);
        
        const typeEmojis = {
            'user': '👤',
            'bug': '🐛',
            'content': '📝',
            'other': '❓'
        };
        
        const typeNames = {
            'user': 'User Behavior',
            'bug': 'Bug/Technical Issue',
            'content': 'Content Issue',
            'other': 'Other'
        };
        
        const embed = new EmbedBuilder()
            .setTitle(`${typeEmojis[type]} Report: ${typeNames[type]}`)
            .setDescription(description)
            .setColor(0xE74C3C)
            .addFields(
                { name: '📍 Reporter', value: `${reporter.tag} (${reporter.id})`, inline: true },
                { name: '📅 Date', value: new Date().toLocaleString(), inline: true },
                { name: '📍 Channel', value: `<#${interaction.channel.id}>`, inline: true }
            )
            .setThumbnail(reporter.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        if (reportedUser) {
            embed.addFields({
                name: '⚠️ Reported User',
                value: `${reportedUser.tag} (${reportedUser.id})`,
                inline: false
            });
        }
        
        // Try to send to logs channel if configured
        if (config && config.logs_channel_id) {
            const logsChannel = interaction.guild.channels.cache.get(config.logs_channel_id);
            if (logsChannel) {
                await logsChannel.send({ 
                    content: '🚨 **NEW REPORT** - Staff attention required',
                    embeds: [embed] 
                });
            }
        }
        
        // Confirmation to user
        const confirmEmbed = new EmbedBuilder()
            .setTitle('✅ Report Submitted')
            .setDescription('Your report has been sent to the moderation team. They will review it as soon as possible.')
            .setColor(0x2ECC71)
            .setFooter({ text: 'Thank you for helping keep the server safe!' });
        
        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        
    } catch (error) {
        console.error('Report command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error submitting your report. Please try again later.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleBirthdayCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const user = interaction.user;
    
    try {
        switch (subcommand) {
            case 'set':
                await handleBirthdaySet(interaction);
                break;
            
            case 'view':
                await handleBirthdayView(interaction);
                break;
            
            case 'remove':
                await handleBirthdayRemove(interaction);
                break;
            
            default:
                await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
        }
    } catch (error) {
        console.error('Birthday command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error processing your birthday request.')
            .setColor(0xE74C3C);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleBirthdaySet(interaction) {
    const day = interaction.options.getInteger('day');
    const month = interaction.options.getInteger('month');
    const user = interaction.user;
    
    // Validate date
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > daysInMonth[month - 1]) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Date')
            .setDescription(`Month ${month} doesn't have ${day} days!`)
            .setColor(0xE74C3C);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    try {
        // Store birthday in database
        await database.run(
            'INSERT OR REPLACE INTO birthdays (user_id, guild_id, day, month) VALUES (?, ?, ?, ?)',
            [user.id, interaction.guild.id, day, month]
        );
        
        const embed = new EmbedBuilder()
            .setTitle('🎂 Birthday Set!')
            .setDescription(`Your birthday has been set to **${monthNames[month - 1]} ${day}**`)
            .setColor(0x2ECC71)
            .setFooter({ text: 'The server will be notified on your special day!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        
    } catch (error) {
        console.error('Birthday set error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Database Error')
            .setDescription('There was an error saving your birthday. Please try again.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleBirthdayView(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    try {
        const birthday = await database.get(
            'SELECT day, month FROM birthdays WHERE user_id = ? AND guild_id = ?',
            [targetUser.id, interaction.guild.id]
        );
        
        if (!birthday) {
            const embed = new EmbedBuilder()
                .setTitle('🎂 No Birthday Set')
                .setDescription(targetUser.id === interaction.user.id 
                    ? 'You haven\'t set your birthday yet! Use `/birthday set` to add it.'
                    : `${targetUser.tag} hasn't set their birthday yet.`)
                .setColor(0xF39C12);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const embed = new EmbedBuilder()
            .setTitle('🎂 Birthday Information')
            .setDescription(`**${targetUser.tag}**'s birthday is on **${monthNames[birthday.month - 1]} ${birthday.day}**`)
            .setColor(0x9B59B6)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Birthday view error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Database Error')
            .setDescription('There was an error retrieving birthday information.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleBirthdayRemove(interaction) {
    const user = interaction.user;
    
    try {
        const result = await database.run(
            'DELETE FROM birthdays WHERE user_id = ? AND guild_id = ?',
            [user.id, interaction.guild.id]
        );
        
        if (result.changes === 0) {
            const embed = new EmbedBuilder()
                .setTitle('❌ No Birthday Found')
                .setDescription('You don\'t have a birthday set in this server.')
                .setColor(0xF39C12);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🗑️ Birthday Removed')
            .setDescription('Your birthday has been removed from this server.')
            .setColor(0x95A5A6)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        
    } catch (error) {
        console.error('Birthday remove error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Database Error')
            .setDescription('There was an error removing your birthday.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

// ASCII art generator function with classic style
function generateAsciiArt(text) {
    const font = {
        'A': [
            '   ##   ',
            '  #  #  ',
            ' #    # ',
            ' ###### ',
            ' #    # ',
            ' #    # '
        ],
        'B': [
            ' ###### ',
            ' #    # ',
            ' ###### ',
            ' ###### ',
            ' #    # ',
            ' ###### '
        ],
        'C': [
            '  ##### ',
            ' #      ',
            ' #      ',
            ' #      ',
            ' #      ',
            '  ##### '
        ],
        'D': [
            ' ###### ',
            ' #    # ',
            ' #    # ',
            ' #    # ',
            ' #    # ',
            ' ###### '
        ],
        'E': [
            ' ###### ',
            ' #      ',
            ' ###### ',
            ' ###### ',
            ' #      ',
            ' ###### '
        ],
        'F': [
            ' ###### ',
            ' #      ',
            ' ###### ',
            ' ###### ',
            ' #      ',
            ' #      '
        ],
        'G': [
            '  ##### ',
            ' #      ',
            ' #  ### ',
            ' #    # ',
            ' #    # ',
            '  ##### '
        ],
        'H': [
            ' #    # ',
            ' #    # ',
            ' ###### ',
            ' ###### ',
            ' #    # ',
            ' #    # '
        ],
        'I': [
            ' ###### ',
            '   ##   ',
            '   ##   ',
            '   ##   ',
            '   ##   ',
            ' ###### '
        ],
        'J': [
            ' ###### ',
            '     ## ',
            '     ## ',
            '     ## ',
            ' #   ## ',
            '  ##### '
        ],
        'K': [
            ' #    # ',
            ' #   #  ',
            ' ####   ',
            ' ####   ',
            ' #   #  ',
            ' #    # '
        ],
        'L': [
            ' #      ',
            ' #      ',
            ' #      ',
            ' #      ',
            ' #      ',
            ' ###### '
        ],
        'M': [
            ' #    # ',
            ' ##  ## ',
            ' # ## # ',
            ' #    # ',
            ' #    # ',
            ' #    # '
        ],
        'N': [
            ' #    # ',
            ' ##   # ',
            ' # #  # ',
            ' #  # # ',
            ' #   ## ',
            ' #    # '
        ],
        'O': [
            '  ####  ',
            ' #    # ',
            ' #    # ',
            ' #    # ',
            ' #    # ',
            '  ####  '
        ],
        'P': [
            ' ###### ',
            ' #    # ',
            ' ###### ',
            ' #      ',
            ' #      ',
            ' #      '
        ],
        'Q': [
            '  ####  ',
            ' #    # ',
            ' #    # ',
            ' #  # # ',
            ' #   ## ',
            '  ##### '
        ],
        'R': [
            ' ###### ',
            ' #    # ',
            ' ###### ',
            ' #   #  ',
            ' #    # ',
            ' #    # '
        ],
        'S': [
            '  ##### ',
            ' #      ',
            '  ####  ',
            '      # ',
            '      # ',
            ' #####  '
        ],
        'T': [
            ' ###### ',
            '   ##   ',
            '   ##   ',
            '   ##   ',
            '   ##   ',
            '   ##   '
        ],
        'U': [
            ' #    # ',
            ' #    # ',
            ' #    # ',
            ' #    # ',
            ' #    # ',
            '  ####  '
        ],
        'V': [
            ' #    # ',
            ' #    # ',
            ' #    # ',
            '  #  #  ',
            '   ##   ',
            '   ##   '
        ],
        'W': [
            ' #    # ',
            ' #    # ',
            ' #    # ',
            ' # ## # ',
            ' ##  ## ',
            ' #    # '
        ],
        'X': [
            ' #    # ',
            '  #  #  ',
            '   ##   ',
            '   ##   ',
            '  #  #  ',
            ' #    # '
        ],
        'Y': [
            ' #    # ',
            '  #  #  ',
            '   ##   ',
            '   ##   ',
            '   ##   ',
            '   ##   '
        ],
        'Z': [
            ' ###### ',
            '     #  ',
            '    #   ',
            '   #    ',
            '  #     ',
            ' ###### '
        ],
        ' ': [
            '        ',
            '        ',
            '        ',
            '        ',
            '        ',
            '        '
        ],
        '!': [
            '   ##   ',
            '   ##   ',
            '   ##   ',
            '   ##   ',
            '        ',
            '   ##   '
        ],
        '?': [
            '  ####  ',
            ' #    # ',
            '     #  ',
            '   ##   ',
            '        ',
            '   ##   '
        ],
        ':': [
            '        ',
            '   ##   ',
            '   ##   ',
            '        ',
            '   ##   ',
            '   ##   '
        ],
        ')': [
            '  #     ',
            '   #    ',
            '    #   ',
            '    #   ',
            '   #    ',
            '  #     '
        ],
        '(': [
            '     #  ',
            '    #   ',
            '   #    ',
            '   #    ',
            '    #   ',
            '     #  '
        ],
        '0': [
            '  ####  ',
            ' #    # ',
            ' #    # ',
            ' #    # ',
            ' #    # ',
            '  ####  '
        ],
        '1': [
            '   ##   ',
            '  ###   ',
            '   ##   ',
            '   ##   ',
            '   ##   ',
            ' ###### '
        ],
        '2': [
            '  ####  ',
            ' #    # ',
            '     #  ',
            '   ##   ',
            '  #     ',
            ' ###### '
        ],
        '3': [
            '  ####  ',
            ' #    # ',
            '   ###  ',
            '     #  ',
            ' #    # ',
            '  ####  '
        ],
        '4': [
            '   ###  ',
            '  # ##  ',
            ' #  ##  ',
            ' ###### ',
            '    ##  ',
            '    ##  '
        ],
        '5': [
            ' ###### ',
            ' #      ',
            ' #####  ',
            '      # ',
            ' #    # ',
            '  ####  '
        ],
        '6': [
            '  ####  ',
            ' #      ',
            ' #####  ',
            ' #    # ',
            ' #    # ',
            '  ####  '
        ],
        '7': [
            ' ###### ',
            '     #  ',
            '    #   ',
            '   #    ',
            '  #     ',
            ' #      '
        ],
        '8': [
            '  ####  ',
            ' #    # ',
            '  ####  ',
            ' #    # ',
            ' #    # ',
            '  ####  '
        ],
        '9': [
            '  ####  ',
            ' #    # ',
            ' #    # ',
            '  ##### ',
            '      # ',
            '  ####  '
        ]
    };

    // Limit text length
    if (text.length > 8) {
        text = text.substring(0, 8);
    }

    const height = Object.values(font)[0].length;
    const lines = Array(height).fill('');
    
    for (let char of text.toUpperCase()) {
        if (font[char]) {
            for (let i = 0; i < height; i++) {
                lines[i] += font[char][i];
            }
        } else {
            // Unknown character, use space
            for (let i = 0; i < height; i++) {
                lines[i] += font[' '][i];
            }
        }
    }
    
    return lines.join('\n');
}

// Ticket Button Handlers
async function handleTicketCloseButton(interaction) {
    try {
        const ticketId = interaction.customId.split('_')[2];
        const ticket = await database.getTicket(ticketId);
        
        if (!ticket) {
            return await interaction.reply({ content: 'Ticket not found!', ephemeral: true });
        }
        
        // Create confirmation embed
        const embed = new EmbedBuilder()
            .setTitle('🔒 Close Ticket Confirmation')
            .setDescription('Are you sure you want to close this ticket? This action cannot be undone.')
            .setColor(0xE74C3C);
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_confirm_${ticket.id}`)
                    .setLabel('✅ Confirm Close')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`ticket_close_cancel_${ticket.id}`)
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    } catch (error) {
        console.error('Close ticket button error:', error);
        await interaction.reply({ content: 'Error processing close request!', ephemeral: true });
    }
}

async function handleTicketClaimButton(interaction) {
    try {
        const ticketId = interaction.customId.split('_')[2];
        const ticket = await database.getTicket(ticketId);
        
        if (!ticket) {
            return await interaction.reply({ content: 'Ticket not found!', ephemeral: true });
        }
        
        if (ticket.claimed_by) {
            return await interaction.reply({ content: 'This ticket has already been claimed!', ephemeral: true });
        }
        
        // Update ticket with claimer
        await database.updateTicket(ticketId, {
            claimed_by: interaction.user.id,
            claimed_at: new Date().toISOString()
        });
        
        // Update embed
        const embed = new EmbedBuilder()
            .setTitle(`🎫 Support Ticket #${ticket.ticket_number}`)
            .setDescription(`**Subject:** ${ticket.subject}\n**Status:** Claimed by ${interaction.user}`)
            .addFields(
                { name: '👤 Created by', value: `<@${ticket.user_id}>`, inline: true },
                { name: '👋 Claimed by', value: `${interaction.user}`, inline: true },
                { name: '📅 Created at', value: `<t:${Math.floor(new Date(ticket.created_at).getTime() / 1000)}:F>`, inline: false }
            )
            .setColor(0x2ECC71)
            .setThumbnail(interaction.user.displayAvatarURL());
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${ticket.id}`)
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`ticket_claim_${ticket.id}`)
                    .setLabel('👋 Claimed')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );
        
        await interaction.update({ embeds: [embed], components: [buttons] });
        
        // Send claim notification
        await interaction.followUp({ 
            content: `🎫 Ticket has been claimed by ${interaction.user}!`,
            ephemeral: false 
        });
        
    } catch (error) {
        console.error('Claim ticket button error:', error);
        await interaction.reply({ content: 'Error claiming ticket!', ephemeral: true });
    }
}

async function handleTicketCloseConfirm(interaction) {
    try {
        const ticketId = interaction.customId.split('_')[3];
        const ticket = await database.getTicket(ticketId);
        
        if (!ticket) {
            return await interaction.reply({ content: 'Ticket not found!', ephemeral: true });
        }
        
        // Close the ticket
        await database.closeTicket(ticketId, interaction.user.id);
        
        // Send closure message
        const embed = new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(`This ticket has been closed by ${interaction.user}.\n\nThank you for using our support system!`)
            .addFields(
                { name: '👤 Closed by', value: `${interaction.user}`, inline: true },
                { name: '📅 Closed at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setColor(0x95A5A6);
        
        await interaction.channel.send({ embeds: [embed] });
        
        // Archive the channel after 10 seconds
        await interaction.update({ 
            content: '✅ Ticket has been closed. This channel will be archived in 10 seconds.',
            embeds: [], 
            components: [] 
        });
        
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.error('Error deleting ticket channel:', error);
            }
        }, 10000);
        
    } catch (error) {
        console.error('Confirm close ticket error:', error);
        await interaction.reply({ content: 'Error closing ticket!', ephemeral: true });
    }
}

async function handleTicketCloseCancel(interaction) {
    await interaction.update({ 
        content: '❌ Ticket close cancelled.',
        embeds: [], 
        components: [] 
    });
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

// Ticket modal handler (defined before handleModal to ensure availability)
async function handleCreateTicketModal(interaction) {
    try {
        const subject = interaction.fields.getTextInputValue('ticket_subject');
        const description = interaction.fields.getTextInputValue('ticket_description');
        
        console.log('Creating ticket:', { subject, description, userId: interaction.user.id });
        
        // Get ticket configuration
        const config = await database.getTicketConfig(interaction.guild.id);
        console.log('Ticket config:', config);
        
        // Create ticket channel
        const ticketResult = await database.createTicket(
            interaction.guild.id,
            null, // Channel ID will be updated after creation
            interaction.user.id,
            interaction.user.username,
            subject
        );
        
        console.log('Ticket created in database:', ticketResult);
        
        const channelName = `supportticket-${ticketResult.ticketNumber}`;
        
        // Create private channel
        const ticketChannel = await interaction.guild.channels.create({
            name: channelName,
            type: 0, // Text channel
            parent: config?.ticket_category_id || null,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                },
                {
                    id: interaction.client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
                }
            ]
        });
        
        console.log('Ticket channel created:', ticketChannel.id);
        
        // Add staff roles permissions if configured
        if (config?.staff_role_id) {
            await ticketChannel.permissionOverwrites.create(config.staff_role_id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                ManageMessages: true
            });
        }
        
        // Update ticket with channel ID
        await database.updateTicket(ticketResult.ticketId, { channel_id: ticketChannel.id });
        
        console.log('Ticket updated with channel ID');
        
        // Create ticket embed
        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 Support Ticket #${ticketResult.ticketNumber}`)
            .setDescription(`**Subject:** ${subject}\n**Description:** ${description}`)
            .addFields(
                { name: '👤 Created by', value: `${interaction.user}`, inline: true },
                { name: '📅 Created at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '🏷️ Priority', value: 'Normal', inline: true }
            )
            .setColor(0x3742FA)
            .setThumbnail(interaction.user.displayAvatarURL());
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${ticketResult.ticketId}`)
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`ticket_claim_${ticketResult.ticketId}`)
                    .setLabel('👋 Claim Ticket')
                    .setStyle(ButtonStyle.Success)
            );
        
        await ticketChannel.send({ 
            content: `${interaction.user} Your ticket has been created!${config?.staff_role_id ? ` <@&${config.staff_role_id}>` : ''}`,
            embeds: [ticketEmbed], 
            components: [buttons] 
        });
        
        console.log('Ticket message sent to channel');
        
        // Reply to the user
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Ticket Created Successfully!')
            .setDescription(`Your ticket has been created in ${ticketChannel}`)
            .setColor(0x2ECC71);
        
        await interaction.reply({ 
            embeds: [successEmbed], 
            flags: [4096] // MessageFlags.Ephemeral
        });
        
        console.log('Success response sent to user');
        
    } catch (error) {
        console.error('Create ticket modal error:', error);
        console.error('Error stack:', error.stack);
        await interaction.reply({ 
            content: `Failed to create ticket: ${error.message}. Please try again or contact an administrator.`, 
            flags: [4096] // MessageFlags.Ephemeral
        });
    }
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
            
            case 'raid_config_modal':
                await handleRaidConfigModal(interaction);
                break;
            
            case 'automod_config_modal':
                await handleAutoModConfigModal(interaction);
                break;
            
            case 'panic_roles_config_modal':
                await handlePanicRolesConfigModal(interaction);
                break;
            
            case 'create_ticket_modal':
                await handleCreateTicketModal(interaction);
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

async function handleAuthLoginSubmit(interaction) {
    try {
        const password = interaction.fields.getTextInputValue('password');
        const totpCode = interaction.fields.getTextInputValue('totp_code');
        
        const session = await authSystem.authenticateUser(interaction.user.id, password, totpCode);
        
        // If we get here, authentication was successful (no exception thrown)
        const embed = new EmbedBuilder()
            .setTitle('✅ Authentication Successful')
            .setDescription('You have been successfully authenticated and can now use protected commands.')
            .setColor(0x2ECC71)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], flags: [4096] });
        
    } catch (error) {
        console.error('Auth login submit error:', error);
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Login Error')
            .setDescription(`Login failed: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], flags: [4096] });
    }
}

async function handleAuthVerifySetupSubmit(interaction) {
    try {
        const totpCode = interaction.fields.getTextInputValue('totp_code');
        
        await authSystem.completeSetup(interaction.user.id, totpCode);
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setDescription('Your authentication has been set up successfully! You can now use `/login` to authenticate.')
            .setColor(0x2ECC71)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], flags: [4096] });
        
    } catch (error) {
        console.error('Auth verify setup submit error:', error);
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Verification Error')
            .setDescription(`Setup verification failed: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], flags: [4096] });
    }
}
async function handleRaidConfigModal(interaction) {
    try {
        const userThreshold = parseInt(interaction.fields.getTextInputValue('raid_user_threshold'));
        const timeWindow = parseInt(interaction.fields.getTextInputValue('raid_time_window'));
        const punishment = interaction.fields.getTextInputValue('raid_punishment').toLowerCase().trim();
        
        // Validate inputs
        if (isNaN(userThreshold) || userThreshold < 1 || userThreshold > 100) {
            throw new Error('User threshold must be between 1 and 100');
        }
        
        if (isNaN(timeWindow) || timeWindow < 10 || timeWindow > 600) {
            throw new Error('Time window must be between 10 and 600 seconds');
        }
        
        const validPunishments = ['ban', 'kick'];
        if (!validPunishments.includes(punishment)) {
            throw new Error('Invalid punishment type. Use: ban or kick');
        }
        
        console.log(`🛡️ Updating raid protection settings:`, {
            userThreshold,
            timeWindow,
            punishment
        });
        
        // Update settings in database
        await database.updateModerationSettings(interaction.guild.id, {
            raid_user_threshold: userThreshold,
            raid_time_window: timeWindow,
            raid_punishment: punishment
        });
        
        // Return to the raid protection menu to show updated settings
        const raidMenu = await setupSystem.createRaidProtectionMenu(interaction.guild.id);
        await interaction.update(raidMenu);
        
        console.log(`✅ Raid protection settings updated successfully for guild ${interaction.guild.id}`);
        
    } catch (error) {
        console.error('Error updating raid config:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Configuration Error')
            .setDescription(`Failed to update raid protection settings: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleAutoModConfigModal(interaction) {
    try {
        const capsThreshold = parseInt(interaction.fields.getTextInputValue('caps_threshold'));
        
        // Validate inputs
        if (isNaN(capsThreshold) || capsThreshold < 10 || capsThreshold > 100) {
            throw new Error('Caps threshold must be between 10 and 100 percent');
        }
        
        console.log(`🛡️ Updating auto-moderation settings:`, {
            capsThreshold
        });
        
        // Update settings in database
        await database.updateModerationSettings(interaction.guild.id, {
            caps_threshold: capsThreshold
        });
        
        // Return to the auto-moderation menu to show updated settings
        const autoModMenu = await setupSystem.createAutoModerationMenu(interaction.guild.id);
        await interaction.update(autoModMenu);
        
        console.log(`✅ Auto-moderation settings updated successfully for guild ${interaction.guild.id}`);
        
    } catch (error) {
        console.error('Error updating automod config:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Configuration Error')
            .setDescription(`Failed to update auto-moderation settings: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handlePanicRolesConfigModal(interaction) {
    try {
        const rolesInput = interaction.fields.getTextInputValue('safe_roles');
        const roleIds = rolesInput ? rolesInput.split(',').map(id => id.trim()).filter(id => id) : [];
        
        // Validate role IDs
        for (const roleId of roleIds) {
            if (!/^\d{17,19}$/.test(roleId)) {
                throw new Error(`Invalid role ID: ${roleId}. Role IDs must be 17-19 digit numbers.`);
            }
            
            // Check if role exists in guild
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
                throw new Error(`Role with ID ${roleId} not found in this server.`);
            }
        }
        
        console.log(`🛡️ Updating panic mode safe roles:`, {
            roleCount: roleIds.length,
            roleIds
        });
        
        // Update server config with safe roles
        const currentConfig = await database.getServerConfig(interaction.guild.id) || {};
        await database.setServerConfig(interaction.guild.id, {
            ...currentConfig,
            safe_roles: JSON.stringify(roleIds)
        });
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Safe Roles Updated')
            .setDescription(`Updated safe roles for panic mode. ${roleIds.length} role(s) configured.`)
            .setColor(0x2ECC71);
        
        if (roleIds.length > 0) {
            const roleNames = roleIds.map(id => {
                const role = interaction.guild.roles.cache.get(id);
                return role ? role.name : `Unknown (${id})`;
            });
            embed.addFields({ name: 'Safe Roles', value: roleNames.join('\n'), inline: false });
        }
        
        await interaction.update({ embeds: [embed], components: [] });
        
        console.log(`✅ Panic mode safe roles updated successfully for guild ${interaction.guild.id}`);
        
    } catch (error) {
        console.error('Error updating panic roles config:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Configuration Error')
            .setDescription(`Failed to update safe roles: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], flags: [4096] });
    }
}

// Missing button handlers - CRITICAL SECURITY FIXES
async function showRaidConfigModal(interaction) {
    const settings = await database.getModerationSettings(interaction.guild.id);
    
    const modal = new ModalBuilder()
        .setCustomId('raid_config_modal')
        .setTitle('Raid Protection Configuration');

    const userThresholdInput = new TextInputBuilder()
        .setCustomId('raid_user_threshold')
        .setLabel('User threshold (users joining)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('10')
        .setValue((settings.raid_user_threshold || 10).toString())
        .setRequired(true);

    const timeWindowInput = new TextInputBuilder()
        .setCustomId('raid_time_window')
        .setLabel('Time window (seconds)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('60')
        .setValue((settings.raid_time_window || 60).toString())
        .setRequired(true);

    const punishmentInput = new TextInputBuilder()
        .setCustomId('raid_punishment')
        .setLabel('Punishment type')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ban, kick')
        .setValue(settings.raid_punishment || 'ban')
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(userThresholdInput),
        new ActionRowBuilder().addComponents(timeWindowInput),
        new ActionRowBuilder().addComponents(punishmentInput)
    );

    await interaction.showModal(modal);
}

async function showAutoModConfigModal(interaction) {
    const settings = await database.getModerationSettings(interaction.guild.id);
    
    const modal = new ModalBuilder()
        .setCustomId('automod_config_modal')
        .setTitle('Auto-Moderation Configuration');

    const capsThresholdInput = new TextInputBuilder()
        .setCustomId('caps_threshold')
        .setLabel('Caps threshold (percentage)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('70')
        .setValue((settings.caps_threshold || 70).toString())
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(capsThresholdInput)
    );

    await interaction.showModal(modal);
}

async function showPanicRolesConfigModal(interaction) {
    const config = await database.getServerConfig(interaction.guild.id);
    const safeRoles = config?.safe_roles ? JSON.parse(config.safe_roles) : [];
    
    const modal = new ModalBuilder()
        .setCustomId('panic_roles_config_modal')
        .setTitle('Panic Mode Safe Roles');

    const rolesInput = new TextInputBuilder()
        .setCustomId('safe_roles')
        .setLabel('Safe role IDs (comma separated)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('123456789,987654321')
        .setValue(safeRoles.join(','))
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(rolesInput)
    );

    await interaction.showModal(modal);
}

async function handleConfigExport(interaction) {
    try {
        const settings = await database.getModerationSettings(interaction.guild.id);
        const config = await database.getServerConfig(interaction.guild.id);
        
        const exportData = {
            timestamp: new Date().toISOString(),
            guild_id: interaction.guild.id,
            guild_name: interaction.guild.name,
            settings: settings,
            config: config
        };
        
        const configText = JSON.stringify(exportData, null, 2);
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Configuration Export')
            .setDescription('Your server configuration has been exported below:')
            .setColor(0x3742FA)
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed], 
            files: [{
                attachment: Buffer.from(configText),
                name: `${interaction.guild.name}-config-${Date.now()}.json`
            }],
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('Config export error:', error);
        await interaction.reply({ 
            content: 'Failed to export configuration!', 
            ephemeral: true 
        });
    }
}

async function handleAdvancedResetConfirm(interaction) {
    try {
        // Reset all settings to defaults
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
            analytics_enabled: 1
        };
        
        await database.updateModerationSettings(interaction.guild.id, defaultSettings);
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Settings Reset')
            .setDescription('All settings have been reset to default values.')
            .setColor(0x2ECC71);
        
        await interaction.update({ embeds: [embed], components: [] });
        
    } catch (error) {
        console.error('Reset error:', error);
        await interaction.reply({ 
            content: 'Failed to reset settings!', 
            ephemeral: true 
        });
    }
}

async function handleAdvancedResetCancel(interaction) {
    const advancedMenu = await setupSystem.createAdvancedSettingsMenu(interaction.guild.id);
    await interaction.update(advancedMenu);
}

// ===== TICKETING SYSTEM HANDLERS =====

async function handleCreateTicketCommand(interaction) {
    try {
        const subject = interaction.options.getString('subject');
        const description = interaction.options.getString('description') || 'No additional description provided.';
        
        // Check if user already has an open ticket
        const existingTickets = await database.getGuildTickets(interaction.guild.id, 'open');
        const userTicket = existingTickets.find(ticket => ticket.user_id === interaction.user.id);
        
        if (userTicket) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Ticket Already Exists')
                .setDescription(`You already have an open ticket: <#${userTicket.channel_id}>`)
                .setColor(0xFF6B6B);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Get ticket configuration
        const config = await database.getTicketConfig(interaction.guild.id);
        
        // Create ticket channel
        const ticketResult = await database.createTicket(
            interaction.guild.id,
            null, // Channel ID will be updated after creation
            interaction.user.id,
            interaction.user.username,
            subject
        );
        
        const channelName = `supportticket-${ticketResult.ticketNumber}`;
        
        // Create private channel
        const ticketChannel = await interaction.guild.channels.create({
            name: channelName,
            type: 0, // Text channel
            parent: config?.ticket_category_id || null,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: ['ViewChannel']
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                },
                {
                    id: interaction.client.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ManageChannels', 'ManageMessages']
                }
            ]
        });
        
        // Add staff role if configured
        if (config?.staff_role_id) {
            await ticketChannel.permissionOverwrites.create(config.staff_role_id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                ManageMessages: true
            });
        }
        
        // Update ticket with channel ID
        await database.updateTicket(ticketResult.ticketId, { channel_id: ticketChannel.id });
        
        // Create ticket embed
        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 Support Ticket #${ticketResult.ticketNumber}`)
            .setDescription(`**Subject:** ${subject}\n**Description:** ${description}`)
            .addFields(
                { name: '👤 Created by', value: `${interaction.user}`, inline: true },
                { name: '📅 Created at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '🏷️ Priority', value: 'Normal', inline: true }
            )
            .setColor(0x3742FA)
            .setThumbnail(interaction.user.displayAvatarURL());
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${ticketResult.ticketId}`)
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`ticket_claim_${ticketResult.ticketId}`)
                    .setLabel('👋 Claim Ticket')
                    .setStyle(ButtonStyle.Success)
            );
        
        await ticketChannel.send({ embeds: [ticketEmbed], components: [buttons] });
        
        // Confirmation message
        const confirmEmbed = new EmbedBuilder()
            .setTitle('✅ Ticket Created')
            .setDescription(`Your support ticket has been created: ${ticketChannel}`)
            .setColor(0x2ECC71);
        
        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        
    } catch (error) {
        console.error('Create ticket error:', error);
        await interaction.reply({ 
            content: 'There was an error creating your ticket. Please try again later.',
            ephemeral: true 
        });
    }
}

async function handleCloseRequestCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        if (ticket.user_id !== interaction.user.id) {
            return await interaction.reply({ 
                content: '❌ Only the ticket creator can request to close this ticket.',
                ephemeral: true 
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🔒 Close Request')
            .setDescription(`${interaction.user} has requested to close this ticket.`)
            .setColor(0xF39C12)
            .setTimestamp();
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_confirm_${ticket.id}`)
                    .setLabel('✅ Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`ticket_close_cancel_${ticket.id}`)
                    .setLabel('❌ Keep Open')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.reply({ embeds: [embed], components: [buttons] });
        
    } catch (error) {
        console.error('Close request error:', error);
        await interaction.reply({ 
            content: 'There was an error processing your close request.',
            ephemeral: true 
        });
    }
}

async function handleHelpCommand(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🧀 CheeseBot - Help Menu')
        .setDescription('**All-in-One Discord Security & Utility Bot**')
        .addFields(
            {
                name: '🎫 Ticketing Commands',
                value: '`/createticket` - Create a new support ticket\n`/closerequest` - Request to close your ticket',
                inline: false
            },
            {
                name: '🔢 Counting Commands',
                value: '`/userstats` - View counting statistics for a user\n`/countleaderboard` - View server counting leaderboard\n`/counthistory` - View recent counting history',
                inline: false
            },
            {
                name: '🎨 Fun Commands',
                value: '`/ascii` - Convert text to ASCII art',
                inline: false
            },
            {
                name: '💡 Utility Commands',
                value: '`/suggest` - Make a suggestion\n`/report` - Report an issue\n`/afk` - Set yourself as AFK',
                inline: false
            },
            {
                name: '🎂 Social Commands',
                value: '`/birthday set` - Set your birthday\n`/birthday view` - View birthdays\n`/birthday remove` - Remove your birthday',
                inline: false
            },
            {
                name: '🛡️ Security Features',
                value: '• Spam Protection\n• Raid Protection\n• Anti-Nuke Protection\n• Auto-Moderation\n• Warning System',
                inline: false
            }
        )
        .setColor(0x3742FA)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({ text: 'Use /adminhelp for administrative commands (requires permissions)' });
    
    await interaction.reply({ embeds: [embed] });
}

async function handleAdminHelpCommand(interaction) {
    // Check authentication
    const authCheck = await authSystem.requireAuthentication(interaction);
    if (authCheck.required) {
        return await interaction.reply(authCheck.response);
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🛡️ CheeseBot - Admin Help Menu')
        .setDescription('**Complete Administrative Command Reference**')
        .addFields(
            {
                name: '🔧 Setup Commands',
                value: '`/setup` - Main bot configuration\n`/config` - Server configuration\n`/status` - Bot status\n`/diagnose` - Run diagnostics',
                inline: false
            },
            {
                name: '🎫 Ticket Management',
                value: '`/panel` - Create ticket panel\n`/add` - Add user to ticket\n`/remove` - Remove user from ticket\n`/claim` - Claim ticket\n`/unclaim` - Unclaim ticket\n`/close` - Close ticket\n`/rename` - Rename ticket\n`/thread` - Create staff thread\n`/priority` - Set ticket priority',
                inline: false
            },
            {
                name: '� Counting Management',
                value: '`/countchannel set` - Set counting channel\n`/countchannel remove` - Remove counting channel\n`/countchannel reset` - Reset count\n`/countchannel info` - Channel information',
                inline: false
            },
            {
                name: '�👥 User Management',
                value: '`/user auth` - Manage bot access\n`/user grant` - Grant access\n`/user revoke` - Revoke access\n`/user list` - List authorized users\n`/clear` - Clear messages',
                inline: false
            },
            {
                name: '🔐 Authentication',
                value: '`/login` - Login to bot\n`/logout` - Logout from bot\n`/msg` - Send authenticated message',
                inline: false
            },
            {
                name: '🛡️ Security Systems',
                value: '• **Spam Protection** - Message flood detection\n• **Raid Protection** - Mass join detection\n• **Anti-Nuke** - Destructive action prevention\n• **Auto-Moderation** - Content filtering\n• **Warning System** - Progressive discipline\n• **Panic Mode** - Emergency lockdown',
                inline: false
            }
        )
        .setColor(0xFF6B6B)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({ text: 'CheeseBot v1.0 - Complete Security Solution' });
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handlePanelCommand(interaction) {
    try {
        // Check authentication
        const authCheck = await authSystem.requireAuthentication(interaction);
        if (authCheck.required) {
            return await interaction.reply(authCheck.response);
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Ticket System')
            .setDescription('Need help? Create a support ticket and our team will assist you!')
            .addFields(
                {
                    name: '📋 How it Works',
                    value: '1. Click the button below\n2. Fill out the ticket information\n3. Wait for staff to respond\n4. Your issue will be resolved!',
                    inline: false
                },
                {
                    name: '⏱️ Response Time',
                    value: 'We typically respond within 24 hours',
                    inline: true
                },
                {
                    name: '🏷️ Ticket Types',
                    value: 'Support, Reports, Appeals, General',
                    inline: true
                }
            )
            .setColor(0x3742FA)
            .setThumbnail(interaction.guild.iconURL());
        
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket_panel')
                    .setLabel('🎫 Create Ticket')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.reply({ embeds: [embed], components: [button] });
        
    } catch (error) {
        console.error('Panel command error:', error);
        await interaction.reply({ 
            content: 'There was an error creating the ticket panel.',
            ephemeral: true 
        });
    }
}

async function handleCreateTicketPanel(interaction) {
    // This will show a modal to create a ticket
    const modal = new ModalBuilder()
        .setCustomId('create_ticket_modal')
        .setTitle('Create Support Ticket');

    const subjectInput = new TextInputBuilder()
        .setCustomId('ticket_subject')
        .setLabel('Subject')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Brief description of your issue')
        .setMaxLength(100)
        .setRequired(true);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Detailed description of your issue')
        .setMaxLength(1000)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(subjectInput),
        new ActionRowBuilder().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
}

// Add ticket-specific command handlers
async function handleAddUserCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        const user = interaction.options.getUser('user');
        
        // Add user to channel permissions
        await interaction.channel.permissionOverwrites.create(user.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });
        
        const embed = new EmbedBuilder()
            .setTitle('✅ User Added')
            .setDescription(`${user} has been added to this ticket.`)
            .setColor(0x2ECC71);
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Add user error:', error);
        await interaction.reply({ content: 'Failed to add user to ticket.', ephemeral: true });
    }
}

async function handleClaimCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        if (ticket.claimed_by) {
            return await interaction.reply({ 
                content: `❌ This ticket is already claimed by <@${ticket.claimed_by}>.`,
                ephemeral: true 
            });
        }
        
        await database.updateTicket(ticket.id, {
            claimed_by: interaction.user.id,
            claimed_by_username: interaction.user.username
        });
        
        const embed = new EmbedBuilder()
            .setTitle('👋 Ticket Claimed')
            .setDescription(`This ticket has been claimed by ${interaction.user}`)
            .setColor(0x3742FA)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Claim ticket error:', error);
        await interaction.reply({ content: 'Failed to claim ticket.', ephemeral: true });
    }
}

async function handleCloseTicketCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        await database.closeTicket(ticket.id, reason);
        
        const embed = new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(`This ticket has been closed by ${interaction.user}`)
            .addFields(
                { name: 'Reason', value: reason, inline: false },
                { name: 'Closed at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [embed] });
        
        // Delete channel after 10 seconds
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (deleteError) {
                console.error('Error deleting ticket channel:', deleteError);
            }
        }, 10000);
        
    } catch (error) {
        console.error('Close ticket error:', error);
        await interaction.reply({ content: 'Failed to close ticket.', ephemeral: true });
    }
}

async function handlePriorityCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        const priority = interaction.options.getString('level');
        
        await database.updateTicket(ticket.id, { priority });
        
        const priorityColors = {
            low: 0x95A5A6,
            normal: 0x3742FA,
            high: 0xF39C12,
            urgent: 0xE74C3C
        };
        
        const embed = new EmbedBuilder()
            .setTitle('🏷️ Priority Updated')
            .setDescription(`Ticket priority has been set to **${priority.toUpperCase()}**`)
            .setColor(priorityColors[priority] || 0x3742FA);
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Priority command error:', error);
        await interaction.reply({ content: 'Failed to set priority.', ephemeral: true });
    }
}

async function handleRemoveUserCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        const user = interaction.options.getUser('user');
        
        // Remove user from channel permissions
        await interaction.channel.permissionOverwrites.delete(user.id);
        
        const embed = new EmbedBuilder()
            .setTitle('❌ User Removed')
            .setDescription(`${user} has been removed from this ticket.`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Remove user error:', error);
        await interaction.reply({ content: 'Failed to remove user from ticket.', ephemeral: true });
    }
}

async function handleRenameCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        const newName = interaction.options.getString('name');
        
        await interaction.channel.setName(newName);
        
        const embed = new EmbedBuilder()
            .setTitle('✏️ Ticket Renamed')
            .setDescription(`Ticket has been renamed to **${newName}**`)
            .setColor(0x3742FA);
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Rename command error:', error);
        await interaction.reply({ content: 'Failed to rename ticket.', ephemeral: true });
    }
}

async function handleThreadCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        const threadName = interaction.options.getString('name') || `Staff Discussion - Ticket #${ticket.ticket_number}`;
        
        const thread = await interaction.channel.threads.create({
            name: threadName,
            autoArchiveDuration: 1440, // 24 hours
            type: 12 // Private thread
        });
        
        await database.updateTicket(ticket.id, { thread_id: thread.id });
        
        const embed = new EmbedBuilder()
            .setTitle('🧵 Staff Thread Created')
            .setDescription(`Private staff thread created: ${thread}`)
            .setColor(0x3742FA);
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Thread command error:', error);
        await interaction.reply({ content: 'Failed to create staff thread.', ephemeral: true });
    }
}

async function handleUnclaimCommand(interaction) {
    try {
        const ticket = await database.getTicket(interaction.channel.id);
        if (!ticket) {
            return await interaction.reply({ 
                content: '❌ This command can only be used in a support ticket.',
                ephemeral: true 
            });
        }
        
        if (!ticket.claimed_by) {
            return await interaction.reply({ 
                content: '❌ This ticket is not currently claimed.',
                ephemeral: true 
            });
        }
        
        if (ticket.claimed_by !== interaction.user.id) {
            return await interaction.reply({ 
                content: '❌ You can only unclaim tickets that you have claimed.',
                ephemeral: true 
            });
        }
        
        await database.updateTicket(ticket.id, {
            claimed_by: null,
            claimed_by_username: null
        });
        
        const embed = new EmbedBuilder()
            .setTitle('👋 Ticket Unclaimed')
            .setDescription(`This ticket has been unclaimed by ${interaction.user}`)
            .setColor(0xF39C12)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Unclaim ticket error:', error);
        await interaction.reply({ content: 'Failed to unclaim ticket.', ephemeral: true });
    }
}

// Authentication button handlers
async function handleAuthStartSetup(interaction) {
    const hasRegistered = await authSystem.hasAnyRegisteredUser();
    if (hasRegistered) {
        // Check if the user trying to setup is the same user who already started setup
        const existingUser = await authSystem.getUser(interaction.user.id);
        
        if (existingUser && !existingUser.is_setup_complete) {
            // Allow the same user to continue/restart their setup with correct QR code
            const modal = await authSystem.createPasswordSetupModal();
            await interaction.showModal(modal);
            return;
        }
        
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
        
        await interaction.reply({ ...setupEmbed, flags: [4096] });
        
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Setup Failed')
            .setDescription(`Error: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [embed], flags: [4096] });
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
        
        await interaction.reply({ embeds: [embed], flags: [4096] });
        
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Login Failed')
            .setDescription(`Error: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [embed], flags: [4096] });
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
        await interaction.reply({ ...successEmbed, flags: [4096] });
        
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Verification Failed')
            .setDescription(`Error: ${error.message}`)
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [embed], flags: [4096] });
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
    
    // Check if this is a counting channel and handle counting logic
    try {
        const countingChannel = await database.getCountingChannel(message.guild.id, message.channel.id);
        if (countingChannel) {
            await handleCountingMessage(message, countingChannel);
            return; // Don't process moderation for counting messages
        }
    } catch (error) {
        console.error('Error checking counting channel:', error);
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

// ===== COUNTING SYSTEM HANDLERS =====

async function handleCountingMessage(message, countingChannel) {
    try {
        const content = message.content.trim();
        
        // Extract the first word/number from the message
        const firstWord = content.split(/\s+/)[0];
        const number = parseInt(firstWord);
        
        // Check if the first word is a valid number
        if (isNaN(number) || firstWord !== number.toString()) {
            // Not starting with a number, delete the message
            await message.delete();
            
            // Send ephemeral error message
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Invalid Count')
                .setDescription('Messages must start with the next number in sequence!\nExample: `5 wow!` or just `5`')
                .setColor(0xE74C3C);
            
            const errorMsg = await message.channel.send({ embeds: [errorEmbed] });
            setTimeout(() => errorMsg.delete().catch(() => {}), 3000);
            return;
        }
        
        const expectedNumber = countingChannel.current_number + 1;
        const isCorrect = number === expectedNumber;
        const sameUser = countingChannel.last_user_id === message.author.id;
        
        // Check if same user is trying to count twice in a row
        if (sameUser && countingChannel.current_number > 0) {
            await message.delete();
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Same User')
                .setDescription('You cannot count twice in a row! Wait for another user to count.')
                .setColor(0xE74C3C);
            
            const errorMsg = await message.channel.send({ embeds: [errorEmbed] });
            setTimeout(() => errorMsg.delete().catch(() => {}), 3000);
            
            // Record incorrect attempt
            await database.addCountingHistory(
                message.guild.id,
                message.channel.id,
                message.author.id,
                message.author.username,
                number,
                expectedNumber,
                false
            );
            
            // Update user stats
            const userStats = await database.getCountingStats(message.author.id, message.guild.id) || {
                correct_count: 0,
                incorrect_count: 0,
                highest_number: 0,
                streak: 0,
                best_streak: 0
            };
            
            await database.updateCountingStats(message.author.id, message.guild.id, {
                incorrect_count: userStats.incorrect_count + 1,
                streak: 0
            });
            
            return;
        }
        
        if (isCorrect) {
            // Correct number!
            await message.react('✅');
            
            // Update counting channel
            await database.updateCountingChannel(message.guild.id, message.channel.id, {
                current_number: number,
                last_user_id: message.author.id,
                highest_number: Math.max(countingChannel.highest_number, number),
                total_correct: countingChannel.total_correct + 1
            });
            
            // Update user stats
            const userStats = await database.getCountingStats(message.author.id, message.guild.id) || {
                correct_count: 0,
                incorrect_count: 0,
                highest_number: 0,
                streak: 0,
                best_streak: 0
            };
            
            const newStreak = userStats.streak + 1;
            await database.updateCountingStats(message.author.id, message.guild.id, {
                correct_count: userStats.correct_count + 1,
                highest_number: Math.max(userStats.highest_number, number),
                last_number: number,
                streak: newStreak,
                best_streak: Math.max(userStats.best_streak, newStreak)
            });
            
            // Special milestone reactions
            if (number % 100 === 0) {
                await message.react('🎉');
                
                const milestoneEmbed = new EmbedBuilder()
                    .setTitle('🎉 Milestone Reached!')
                    .setDescription(`Congratulations! The server reached **${number}**!`)
                    .setColor(0xFFD700)
                    .setFooter({ text: `Counted by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
                
                await message.reply({ embeds: [milestoneEmbed] });
            } else if (number % 50 === 0) {
                await message.react('🏆');
            } else if (number % 25 === 0) {
                await message.react('⭐');
            }
            
        } else {
            // Wrong number! Reset the count
            await message.react('❌');
            
            const resetEmbed = new EmbedBuilder()
                .setTitle('💥 Count Reset!')
                .setDescription(`Wrong number! Expected **${expectedNumber}** but got **${number}**.\n\nThe count has been reset to **0**.\n\n💡 Remember: Start your message with the correct number!`)
                .addFields(
                    { name: '📊 Previous High', value: `${countingChannel.current_number}`, inline: true },
                    { name: '💔 Reset by', value: `${message.author}`, inline: true }
                )
                .setColor(0xE74C3C)
                .setFooter({ text: 'Better luck next time! You can say "1 let\'s restart!"' });
            
            await message.reply({ embeds: [resetEmbed] });
            
            // Reset counting channel
            await database.updateCountingChannel(message.guild.id, message.channel.id, {
                current_number: 0,
                last_user_id: null,
                total_incorrect: countingChannel.total_incorrect + 1
            });
            
            // Update user stats
            const userStats = await database.getCountingStats(message.author.id, message.guild.id) || {
                correct_count: 0,
                incorrect_count: 0,
                highest_number: 0,
                streak: 0,
                best_streak: 0
            };
            
            await database.updateCountingStats(message.author.id, message.guild.id, {
                incorrect_count: userStats.incorrect_count + 1,
                streak: 0
            });
        }
        
        // Record in history
        await database.addCountingHistory(
            message.guild.id,
            message.channel.id,
            message.author.id,
            message.author.username,
            number,
            expectedNumber,
            isCorrect
        );
        
    } catch (error) {
        console.error('Error handling counting message:', error);
    }
}

async function handleCountChannelCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
        switch (subcommand) {
            case 'set':
                await handleCountChannelSet(interaction);
                break;
            case 'remove':
                await handleCountChannelRemove(interaction);
                break;
            case 'reset':
                await handleCountChannelReset(interaction);
                break;
            case 'info':
                await handleCountChannelInfo(interaction);
                break;
        }
    } catch (error) {
        console.error('Count channel command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error processing your counting channel request.')
            .setColor(0xE74C3C);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleCountChannelSet(interaction) {
    const channel = interaction.channel;
    
    // Check if channel is already a counting channel
    const existingChannel = await database.getCountingChannel(interaction.guild.id, channel.id);
    if (existingChannel) {
        const embed = new EmbedBuilder()
            .setTitle('ℹ️ Already Set')
            .setDescription(`${channel} is already set as a counting channel!`)
            .setColor(0x3498DB);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    // Set the channel as counting channel
    await database.setCountingChannel(interaction.guild.id, channel.id);
    
    const embed = new EmbedBuilder()
        .setTitle('✅ Counting Channel Set')
        .setDescription(`${channel} is now a counting channel!`)
        .addFields(
            { name: '📋 Rules', value: '• Count in order starting from 1\n• No two consecutive numbers by the same user\n• Messages must start with the correct number\n• You can add text after the number (e.g., "5 wow!")\n• Wrong numbers reset the count', inline: false },
            { name: '🎯 Goal', value: 'Count as high as possible as a team!', inline: false }
        )
        .setColor(0x2ECC71)
        .setFooter({ text: 'Type "1" or "1 let\'s go!" to start counting!' });
    
    await interaction.reply({ embeds: [embed] });
    
    // Send initial counting message
    const startEmbed = new EmbedBuilder()
        .setTitle('🔢 Counting Game Started!')
        .setDescription('Let\'s start counting! Type **1** or **1 let\'s go!** to begin.\n\n💡 **Tip:** You can add comments after the number!')
        .setColor(0x3742FA);
    
    await channel.send({ embeds: [startEmbed] });
}

async function handleCountChannelRemove(interaction) {
    const channel = interaction.channel;
    
    const existingChannel = await database.getCountingChannel(interaction.guild.id, channel.id);
    if (!existingChannel) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Not a Counting Channel')
            .setDescription(`${channel} is not set as a counting channel.`)
            .setColor(0xE74C3C);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    await database.removeCountingChannel(interaction.guild.id, channel.id);
    
    const embed = new EmbedBuilder()
        .setTitle('✅ Counting Channel Removed')
        .setDescription(`${channel} is no longer a counting channel.`)
        .addFields(
            { name: '📊 Final Stats', value: `Highest Number: **${existingChannel.highest_number}**\nCorrect Counts: **${existingChannel.total_correct}**\nIncorrect Counts: **${existingChannel.total_incorrect}**`, inline: false }
        )
        .setColor(0x95A5A6);
    
    await interaction.reply({ embeds: [embed] });
}

async function handleCountChannelReset(interaction) {
    const channel = interaction.channel;
    
    const existingChannel = await database.getCountingChannel(interaction.guild.id, channel.id);
    if (!existingChannel) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Not a Counting Channel')
            .setDescription(`${channel} is not set as a counting channel.`)
            .setColor(0xE74C3C);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    await database.updateCountingChannel(interaction.guild.id, channel.id, {
        current_number: 0,
        last_user_id: null
    });
    
    const embed = new EmbedBuilder()
        .setTitle('🔄 Count Reset')
        .setDescription('The count has been reset to **0**. Start counting from **1** (or **1 here we go!**) again!')
        .addFields(
            { name: '📊 Previous High', value: `${existingChannel.current_number}`, inline: true },
            { name: '🎯 New Goal', value: 'Beat the previous record!', inline: true }
        )
        .setColor(0xF39C12);
    
    await interaction.reply({ embeds: [embed] });
}

async function handleCountChannelInfo(interaction) {
    const channel = interaction.channel;
    
    const countingChannel = await database.getCountingChannel(interaction.guild.id, channel.id);
    if (!countingChannel) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Not a Counting Channel')
            .setDescription(`${channel} is not set as a counting channel.`)
            .setColor(0xE74C3C);
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const accuracyRate = countingChannel.total_correct + countingChannel.total_incorrect > 0 
        ? ((countingChannel.total_correct / (countingChannel.total_correct + countingChannel.total_incorrect)) * 100).toFixed(1)
        : '0.0';
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Counting Channel Info')
        .setDescription(`Information for ${channel}`)
        .addFields(
            { name: '🔢 Current Number', value: `${countingChannel.current_number}`, inline: true },
            { name: '🏆 Highest Number', value: `${countingChannel.highest_number}`, inline: true },
            { name: '👤 Last Counter', value: countingChannel.last_user_id ? `<@${countingChannel.last_user_id}>` : 'None', inline: true },
            { name: '✅ Correct Counts', value: `${countingChannel.total_correct}`, inline: true },
            { name: '❌ Incorrect Counts', value: `${countingChannel.total_incorrect}`, inline: true },
            { name: '📈 Accuracy Rate', value: `${accuracyRate}%`, inline: true }
        )
        .setColor(0x3742FA)
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

async function handleUserStatsCommand(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    try {
        const userStats = await database.getCountingStats(targetUser.id, interaction.guild.id);
        
        if (!userStats || (userStats.correct_count === 0 && userStats.incorrect_count === 0)) {
            const embed = new EmbedBuilder()
                .setTitle('📊 No Counting Stats')
                .setDescription(`${targetUser.username} hasn't participated in counting yet.`)
                .setColor(0x95A5A6);
            
            return await interaction.reply({ embeds: [embed] });
        }
        
        const totalAttempts = userStats.correct_count + userStats.incorrect_count;
        const accuracyRate = totalAttempts > 0 ? ((userStats.correct_count / totalAttempts) * 100).toFixed(1) : '0.0';
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Counting Statistics')
            .setDescription(`Stats for **${targetUser.username}**`)
            .addFields(
                { name: '✅ Correct Numbers', value: `${userStats.correct_count}`, inline: true },
                { name: '❌ Incorrect Numbers', value: `${userStats.incorrect_count}`, inline: true },
                { name: '📈 Accuracy Rate', value: `${accuracyRate}%`, inline: true },
                { name: '🏆 Highest Number', value: `${userStats.highest_number}`, inline: true },
                { name: '🔥 Current Streak', value: `${userStats.streak}`, inline: true },
                { name: '🏅 Best Streak', value: `${userStats.best_streak}`, inline: true }
            )
            .setColor(0x3742FA)
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        if (userStats.last_number > 0) {
            embed.addFields({ name: '🔢 Last Number', value: `${userStats.last_number}`, inline: true });
        }
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('User stats command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error retrieving user statistics.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleCountLeaderboardCommand(interaction) {
    const leaderboardType = interaction.options.getString('type') || 'correct';
    
    try {
        let sortBy;
        let title;
        let description;
        
        switch (leaderboardType) {
            case 'correct':
                sortBy = 'correct_count';
                title = '🏆 Most Correct Numbers';
                description = 'Users with the most correct counts';
                break;
            case 'highest':
                sortBy = 'highest_number';
                title = '🎯 Highest Numbers Reached';
                description = 'Users who reached the highest numbers';
                break;
            case 'streak':
                sortBy = 'best_streak';
                title = '🔥 Best Streaks';
                description = 'Users with the longest counting streaks';
                break;
            case 'accuracy':
                title = '📈 Best Accuracy';
                description = 'Users with the highest accuracy rates';
                break;
        }
        
        let topUsers;
        if (leaderboardType === 'accuracy') {
            topUsers = await database.getCountingLeaderboard(interaction.guild.id);
        } else {
            topUsers = await database.getTopCountingUsers(interaction.guild.id, 10, sortBy);
        }
        
        if (topUsers.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('📊 No Counting Data')
                .setDescription('No counting statistics available yet. Start counting to see the leaderboard!')
                .setColor(0x95A5A6);
            
            return await interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(0xFFD700);
        
        let leaderboardText = '';
        for (let i = 0; i < Math.min(topUsers.length, 10); i++) {
            const user = topUsers[i];
            const position = i + 1;
            const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `**${position}.**`;
            
            let value;
            switch (leaderboardType) {
                case 'correct':
                    value = `${user.correct_count} correct`;
                    break;
                case 'highest':
                    value = `reached ${user.highest_number}`;
                    break;
                case 'streak':
                    value = `${user.best_streak} streak`;
                    break;
                case 'accuracy':
                    value = `${user.accuracy_rate || '0.0'}% accuracy`;
                    break;
            }
            
            leaderboardText += `${emoji} <@${user.user_id}> - ${value}\n`;
        }
        
        embed.setDescription(leaderboardText);
        embed.setFooter({ text: `${topUsers.length} total participants` });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Count leaderboard command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error retrieving the leaderboard.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleCountHistoryCommand(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    
    try {
        const countingChannel = await database.getCountingChannel(interaction.guild.id, interaction.channel.id);
        if (!countingChannel) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Not a Counting Channel')
                .setDescription('This command can only be used in a counting channel.')
                .setColor(0xE74C3C);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const history = await database.getCountingHistory(interaction.guild.id, interaction.channel.id, limit);
        
        if (history.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('📊 No History')
                .setDescription('No counting history available for this channel yet.')
                .setColor(0x95A5A6);
            
            return await interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Recent Counting History')
            .setDescription(`Last ${Math.min(limit, history.length)} counting attempts`)
            .setColor(0x3742FA);
        
        let historyText = '';
        for (const entry of history.slice(0, 10)) {
            const status = entry.was_correct ? '✅' : '❌';
            const timestamp = new Date(entry.timestamp).toLocaleString();
            historyText += `${status} **${entry.number_attempted}** by <@${entry.user_id}> (expected ${entry.expected_number})\n`;
        }
        
        embed.setDescription(historyText);
        embed.setFooter({ text: `Current count: ${countingChannel.current_number}` });
        
        await interaction.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Count history command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('There was an error retrieving counting history.')
            .setColor(0xE74C3C);
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

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
