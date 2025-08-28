# 🔗 Bot Invite Link Generator

## Required Permissions for CheeseBot

Your bot needs these permissions to function properly:

### Administrator Permissions (Recommended):
- **Administrator** - Gives all permissions (easiest option)

### OR Specific Permissions (More Secure):
- **Manage Guild** - For server configuration
- **Manage Channels** - For anti-nuke protection
- **Manage Roles** - For role management and hierarchy
- **Manage Messages** - For message moderation
- **Kick Members** - For punishment system
- **Ban Members** - For punishment system
- **Moderate Members** - For timeout/mute functionality
- **View Audit Log** - For anti-nuke monitoring
- **Send Messages** - Basic functionality
- **Use Slash Commands** - For command responses
- **Embed Links** - For rich embeds
- **Read Message History** - For context

## Generate Invite Link:

1. Go to: https://discord.com/developers/applications
2. Select your bot application
3. Go to "OAuth2" → "URL Generator"
4. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
5. Select permissions:
   - ✅ `Administrator` (recommended)
   - OR select the specific permissions listed above
6. Copy the generated URL and use it to invite your bot

## Alternative: Quick Invite Link Template
Replace `YOUR_BOT_CLIENT_ID` with your actual bot's client ID:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

The `permissions=8` gives Administrator permission (recommended for full functionality).

## Troubleshooting:
- If `/setup` doesn't respond, the bot likely lacks "Use Slash Commands" permission
- If commands work but moderation doesn't, check "Moderate Members" and role hierarchy
- Bot's role must be higher than roles it needs to manage
