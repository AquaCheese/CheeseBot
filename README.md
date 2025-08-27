# Guardian Security Bot

A comprehensive all-in-one Discord security and moderation bot with advanced protection features, similar to GoodKnight and Verifier.

## 🛡️ Features

### 🔐 Authentication System
- **Single-User Control** - Only ONE person can control the bot
- **Password Protection** - Strong password requirements
- **2FA Authentication** - TOTP codes from authenticator apps (Authy, Google Authenticator, etc.)
- **Session Management** - 24-hour authenticated sessions
- **Account Lockout** - Protection against brute force attacks
- **Backup Codes** - Emergency recovery options

### Core Security Features
- **🚨 Spam Protection** - Configurable anti-spam with custom thresholds and punishments
- **🛡️ Raid Protection** - Automatic detection and prevention of mass user joins
- **🤖 Auto Moderation** - Content filtering (profanity, links, invites, excessive caps)
- **💥 Anti-Nuke Protection** - Prevents server destruction attacks
- **⚠️ Warning System** - Track and manage user warnings
- **🆘 Panic Button** - Emergency server lockdown with one click

### Advanced Features
- **📊 Comprehensive Setup Panel** - Easy-to-use configuration interface
- **📋 Detailed Logging** - All moderation actions logged with timestamps
- **🔧 Fine-grained Controls** - Customize every aspect of protection
- **💾 Persistent Storage** - SQLite database for reliable data storage
- **🎯 Role-based Protection** - Configure safe roles for panic mode

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Bot Configuration
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token
4. Copy `.env.example` to `.env` and add your token

### 3. Bot Permissions
Your bot needs these permissions:
- Administrator (recommended for full functionality)
- Or manually grant:
  - Manage Channels
  - Manage Roles
  - Manage Messages
  - Kick Members
  - Ban Members
  - Moderate Members
  - View Audit Log
  - Send Messages
  - Use Slash Commands

### 4. Initial Authentication Setup
1. **Install authenticator app** (Authy, Google Authenticator, etc.)
2. **Run any admin command** (`/setup`, `/config`, etc.)
3. **Follow the setup wizard** to create password and 2FA
4. **Save your backup codes** securely!

### 5. Server Setup
1. Invite the bot to your server
2. Complete authentication setup (first-time only)
3. Run `/config` to set admin and logs channels
4. Run `/setup` in the admin channel to configure protection features

## 📋 Commands

### Authentication Commands
- `/login` - Authenticate with the bot (password + 2FA)
- `/logout` - End your authentication session

### Admin Commands (Require Authentication)
- `/setup` - Open the main configuration panel
- `/config <admin-channel> <logs-channel>` - Set up channels
- `/panic` - Emergency panic button
- `/status` - Check bot status and configuration

### Moderation Commands (Require Authentication)
- `/warn <user> [reason]` - Warn a user
- `/warnings <user>` - Check user warnings

## 🔧 Configuration Options

### Spam Protection
- **Message Count**: Number of messages that trigger detection (default: 5)
- **Time Window**: Time frame for message counting (default: 5 seconds)
- **Punishment**: Action taken (timeout, mute, kick, ban)
- **Duration**: How long the punishment lasts
- **Unit**: Time unit (seconds, minutes, hours, days, weeks)

### Raid Protection
- **User Threshold**: Number of joins that trigger protection (default: 10)
- **Time Window**: Time frame for join counting (default: 60 seconds)
- **Punishment**: Action taken against raiders (kick, ban)

### Auto Moderation
- **Profanity Filter**: Remove inappropriate language
- **Link Filter**: Block external links
- **Invite Filter**: Block Discord invites
- **Caps Filter**: Limit excessive capitalization
- **Caps Threshold**: Percentage of caps that triggers filter (default: 70%)

### Anti-Nuke Protection
- **Channel Limits**: Max channels created/deleted per timeframe
- **Role Limits**: Max roles created per timeframe
- **Mass Ban Limits**: Max bans per timeframe

### Panic Button
- **Safe Roles**: Roles that won't be kicked during panic mode
- **Actions**: Locks all channels and kicks non-safe users
- **Reversible**: Can be deactivated to restore normal operation

## 🔍 How It Works

### Spam Detection
The bot monitors message patterns in real-time:
1. Tracks messages per user per guild
2. Counts messages within configured time window
3. Triggers punishment when threshold exceeded
4. Automatically resets tracking after punishment

### Raid Protection
Advanced join monitoring:
1. Tracks user joins with timestamps
2. Calculates join rate over time window
3. Automatically punishes suspected raiders
4. Logs all actions for review

### Auto Moderation
Intelligent content filtering:
1. Scans all messages for violations
2. Applies configurable filters
3. Removes violating content
4. Sends temporary warnings to users

### Panic Mode
Emergency lockdown system:
1. Immediately locks all text/voice channels
2. Kicks all users except configured safe roles
3. Logs all actions taken
4. Can be reversed when threat is neutralized

## 💾 Database Schema

The bot uses SQLite with the following tables:
- `server_configs` - Server-specific settings
- `moderation_settings` - Protection configuration
- `warnings` - User warning history
- `mod_logs` - Moderation action logs
- `spam_tracking` - Real-time spam detection data

## 🛠️ Development

### Project Structure
```
├── index.js          # Main bot file
├── database.js       # Database operations
├── setup.js          # Setup system UI
├── moderation.js     # Moderation logic
├── authentication.js # Authentication system
├── package.json      # Dependencies
├── .env.example      # Environment template
├── README.md         # Documentation
├── SETUP.md          # Setup guide
├── AUTHENTICATION.md # Authentication guide
└── FEATURES.md       # Detailed features
```

### Running in Development
```bash
npm run dev
```

### Adding New Features
1. Add database schema in `database.js`
2. Implement logic in `moderation.js`
3. Add UI components in `setup.js`
4. Wire up commands in `index.js`

## 🔒 Security Considerations

- Bot requires minimal permissions for operation
- All sensitive data stored locally in SQLite
- No external API dependencies for core functionality
- Rate limiting built into Discord.js
- Comprehensive error handling and logging

## 📝 Logging

All moderation actions are logged with:
- Timestamp
- Action type
- Target user
- Moderator (user or bot)
- Reason
- Additional context

Logs are sent to the configured logs channel and stored in the database for audit trails.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This bot is designed for server protection. Use responsibly and ensure compliance with Discord's Terms of Service and your local laws.
