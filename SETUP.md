# Guardian Security Bot - Setup Guide

## 🚀 Quick Start

### Step 1: Create Discord Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Give it a name (e.g., "Guardian Security Bot")
4. Go to "Bot" section and click "Add Bot"
5. Copy the token

### Step 2: Configure Bot
1. Copy `.env.example` to `.env`
2. Replace `your_bot_token_here` with your actual bot token
3. Save the file

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Invite Bot to Server
1. Go to OAuth2 > URL Generator in Discord Developer Portal
2. Select "bot" and "applications.commands" scopes
3. Select these permissions:
   - Administrator (recommended)
   - OR manually select:
     - Send Messages
     - Use Slash Commands
     - Manage Messages
     - Kick Members
     - Ban Members
     - Moderate Members
     - Manage Channels
     - Manage Roles
4. Copy the generated URL and open it
5. Select your server and authorize

### Step 5: Start the Bot
```bash
npm start
```

### Step 6: Configure Server Protection
1. In your Discord server, run: `/config #admin-channel #logs-channel`
2. Go to the admin channel and run: `/setup`
3. Configure your desired protection features using the interactive menu

## 🛡️ Protection Features

### Spam Protection
- Detects rapid message sending
- Configurable message count and time thresholds
- Multiple punishment options (timeout, kick, ban)
- Automatic cleanup

### Raid Protection
- Monitors suspicious mass user joins
- Configurable user count and time thresholds
- Automatic punishment of raiders
- Real-time detection

### Auto Moderation
- Profanity filter
- Link blocking
- Discord invite blocking
- Excessive caps detection
- Instant message removal

### Anti-Nuke Protection
- Prevents mass channel creation/deletion
- Limits role modifications
- Protects against mass bans
- Audit log monitoring

### Panic Button
- Emergency server lockdown
- Mass user removal (except safe roles)
- Channel lockdown
- One-click activation/deactivation

## 📋 Commands Reference

### Setup Commands
- `/config <admin-channel> <logs-channel>` - Initial setup
- `/setup` - Open configuration panel (admin channel only)
- `/status` - View current bot status and settings

### Moderation Commands
- `/warn <user> [reason]` - Warn a user
- `/warnings <user>` - Check user warnings
- `/panic` - Access panic button (emergency use only)

## 🔧 Advanced Configuration

All settings can be configured through the `/setup` command interface:

- **Spam Protection**: Message count, time window, punishment type and duration
- **Raid Protection**: User join threshold, time window, punishment type
- **Auto Moderation**: Toggle individual filters, set caps threshold
- **Panic Button**: Configure safe roles that won't be kicked

## 📊 Monitoring

The bot provides comprehensive logging:
- All actions logged to designated logs channel
- Database storage for audit trails
- Real-time monitoring dashboards via `/status`
- Export configuration for backup

## ⚠️ Important Notes

1. **Test in a controlled environment first**
2. **Configure safe roles before using panic button**
3. **Regularly review logs for false positives**
4. **Keep the bot token secure and never share it**
5. **Ensure bot has necessary permissions in all channels**

## 🆘 Troubleshooting

### Bot not responding to commands
- Check bot permissions
- Verify bot is online and has admin channel set
- Ensure token is correct in .env file

### Spam protection not working
- Check if spam protection is enabled in `/setup`
- Verify thresholds are reasonable
- Test with alternative accounts

### Panic button not working
- Ensure bot has Administrator permission
- Check that safe roles are properly configured
- Verify admin channel is set

### Missing permissions errors
- Grant Administrator permission for full functionality
- Or manually grant all required permissions listed above

## 📞 Support

For issues or questions:
1. Check this setup guide
2. Review the main README.md
3. Check Discord.js documentation
4. Verify bot permissions and configuration

Remember: This bot is designed for server protection. Always test features in a controlled environment before deploying to production servers.
