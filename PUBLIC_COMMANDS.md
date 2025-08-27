# 🎉 New Public Commands Documentation

The Guardian Security Bot now includes several public commands that any server member can use without requiring special permissions or authentication.

## 🎨 `/ascii` - ASCII Art Generator

Convert any text into ASCII art using block characters.

**Usage:**
```
/ascii text:Hello
```

**Features:**
- Supports letters A-Z, numbers 0-9, and basic symbols
- Maximum 20 characters to prevent spam
- Clean, readable block-style ASCII font
- Response includes the original text and generated art

**Example Output:**
```
🎨 ASCII Art
```
 █  █ █▀▀▀ █    █    ▄▀▄ 
 █▀▀█ █▀▀  █    █   █   █
 ▀  ▀ ▀▄▄▄ ▀▄▄▄ ▀▄▄▄ ▀▄▀ 
```

## 💡 `/suggest` - Server Suggestions

Allow users to submit suggestions to improve the server.

**Usage:**
```
/suggest suggestion:Add a music channel for sharing songs
```

**Features:**
- Automatically sends suggestions to the configured logs channel
- Includes user information, timestamp, and channel context
- Private confirmation to the user
- Helps staff collect community feedback
- Maximum 1000 characters per suggestion

**Staff Benefits:**
- All suggestions appear in the logs channel with proper formatting
- Easy to track who suggested what and when
- Encourages community participation

## 🚨 `/report` - Issue Reporting System

Comprehensive reporting system for users to alert moderators about issues.

**Usage:**
```
/report type:User Behavior description:Someone is spamming in general chat user:@SpammerUser
```

**Report Types:**
- **User Behavior** - Report problematic users or behavior
- **Bug/Technical Issue** - Report bot or server technical problems
- **Content Issue** - Report inappropriate content or messages
- **Other** - Any other issues that don't fit the above categories

**Features:**
- Private submission (only user and staff see the report)
- Automatic forwarding to moderation team via logs channel
- Optional user mention for behavior reports
- Detailed logging with timestamps and context
- Maximum 1000 characters for detailed descriptions
- Staff gets immediate notification with 🚨 alert

## 🎂 `/birthday` - Birthday Management

Complete birthday system for server celebrations.

### Set Your Birthday
```
/birthday set day:15 month:7
```

### View Birthdays
```
/birthday view
/birthday view user:@FriendName
```

### Remove Your Birthday
```
/birthday remove
```

**Features:**
- Stores birthdays per-server (different birthday per Discord server)
- Date validation (prevents invalid dates like February 30th)
- Privacy-friendly (only day/month, no year required)
- View your own birthday or others who have set theirs
- Easy removal system
- Clean, colorful embed responses
- Month names displayed in full (January, February, etc.)

**Database Storage:**
- Secure SQLite storage
- User ID and Guild ID for proper isolation
- Automatic timestamps for tracking

## 🔧 Technical Implementation

### Database Schema
```sql
CREATE TABLE birthdays (
    user_id TEXT,
    guild_id TEXT,
    day INTEGER,
    month INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, guild_id)
);
```

### Security Features
- Input validation for all commands
- SQL injection protection through parameterized queries
- Rate limiting through Discord's built-in slash command cooldowns
- Length limits to prevent abuse
- Proper error handling and user feedback

### Integration
- All commands work without authentication
- Automatic integration with existing logs system
- Consistent embed styling with the rest of the bot
- Proper permission handling
- Error messages provide helpful guidance

## 🎯 Benefits for Server Communities

### User Engagement
- **ASCII Art**: Fun way to create decorative text
- **Suggestions**: Democracy and community input
- **Reports**: Safe way to alert staff about issues
- **Birthdays**: Community celebrations and social features

### Staff Benefits
- **Centralized Feedback**: All suggestions in one place
- **Professional Reporting**: Structured issue reports with context
- **Community Building**: Birthday celebrations increase server engagement
- **Creative Expression**: ASCII art for announcements and fun

### Server Culture
- Encourages positive participation
- Provides clear channels for feedback
- Creates opportunities for celebration
- Maintains professional reporting standards

## 🚀 Future Enhancements

Potential future additions to the public commands system:

1. **Birthday Notifications**: Automatic birthday announcements
2. **Suggestion Voting**: React-based voting on suggestions
3. **ASCII Art Library**: Saved art pieces for reuse
4. **Report Categories**: More specific report types
5. **User Profiles**: Extended birthday information with zodiac signs
6. **Suggestion Status**: Track suggestion implementation status

## 📞 Support

If you encounter any issues with these commands:

1. Check the bot has proper permissions in your server
2. Ensure the logs channel is configured for suggestions/reports
3. Verify the bot is online and responsive
4. Contact server administrators for assistance

These public commands enhance the Guardian Security Bot by making it more than just a security tool - it becomes a comprehensive community platform that encourages positive engagement while maintaining professional moderation standards.
