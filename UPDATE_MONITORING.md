# 🔄 Bot Update Monitoring System

## ✨ Overview

The CheeseBot now includes an **intelligent update monitoring system** that automatically tracks version changes, restarts, and allows manual update logging with beautiful notifications sent to your configured logs channels.

## 🚀 Features

### 🔍 **Automatic Detection**
- **Version Changes**: Detects when bot version changes between restarts
- **Restart Monitoring**: Tracks bot restarts and counts them
- **First Startup**: Special notification for first-time bot deployment

### 📝 **Manual Update Logging**
- **`/update` Command**: Log updates with detailed changelogs
- **Automatic Notifications**: Sends beautiful embeds to all server logs channels
- **Update Types**: Categorize updates (Major, Minor, Bug Fix, Security, Feature)

### 📊 **Database Tracking**
- **Version History**: Complete log of all bot versions and changes
- **Update Records**: Detailed changelog and metadata storage
- **Restart Statistics**: Track restart counts and timing

## 🎯 How It Works

### **Startup Process**
1. Bot starts and checks current version against stored version
2. If version changed → **Update notification** 📦
3. If same version → **Restart notification** 🔄
4. If first time → **Welcome notification** 🆕

### **Version Detection**
```javascript
// Compares package.json version with database stored version
Current Version: 1.0.0
Stored Version: 0.9.8
Result: 🔄 Version change detected → Send update notification
```

### **Manual Update Logging**
```
/update version:1.1.0 changelog:"Added awesome new features!" type:feature
```

## 📋 Commands

### `/update` - Log Bot Updates
**Required Permissions:** Administrator

**Options:**
- `version` (required) - New version number (e.g., "1.1.0")
- `changelog` (required) - Description of changes (max 1000 chars)
- `type` (optional) - Update type:
  - 🚀 **Major Update** - Breaking changes, major features
  - ✨ **Minor Update** - New features, improvements
  - 🐛 **Bug Fix** - Bug fixes and patches
  - 🔒 **Security Update** - Security patches
  - 🆕 **Feature Addition** - New feature additions

**Example:**
```
/update version:2.0.0 changelog:"Complete UI overhaul with new dashboard, enhanced security features, and improved performance. Breaking changes to API." type:major
```

## 🎨 Notification Types

### 🆕 **First Startup**
```
🆕 Bot First Startup
CheeseBot v1.0.0 is now online for the first time!

🔧 Version: 1.0.0
⏰ Started: Today at 2:30 PM  
📋 Status: All systems operational
```

### 🔄 **Version Change (Automatic)**
```
🔄 Bot Update Detected  
CheeseBot has been updated from v1.0.0 to v1.1.0

📊 Previous Version: 1.0.0
🆕 New Version: 1.1.0
⏰ Updated: Today at 2:30 PM
📝 Note: Use /update command to log detailed changelog information
```

### 🔄 **Bot Restart**
```
🔄 Bot Restart
CheeseBot has restarted (same version: v1.0.0)

🔢 Restart Count: 5
⏰ Restarted: Today at 2:30 PM  
📊 Version: 1.0.0
💡 Possible Reasons:
• Server maintenance
• Configuration updates  
• Memory optimization
• Manual restart
```

### 📝 **Manual Update Log**
```
🆕 Bot Update Released
CheeseBot has been updated to version 1.1.0

📊 Previous Version: 1.0.0
🆕 New Version: 1.1.0
🏷️ Update Type: Feature Addition
📝 What's New: Added comprehensive update monitoring system with automatic notifications and manual logging capabilities!
👤 Release Manager: AdminUser#1234
🆔 Update ID: #42
⏰ Released: Today at 2:30 PM
```

## 🗃️ Database Schema

### `bot_updates` Table
```sql
CREATE TABLE bot_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    previous_version TEXT,
    changelog TEXT,
    update_type TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    logged_by TEXT
);
```

### `bot_status` Table  
```sql
CREATE TABLE bot_status (
    id INTEGER PRIMARY KEY,
    last_version TEXT,
    last_restart TEXT DEFAULT (datetime('now')),
    restart_count INTEGER DEFAULT 1
);
```

## ⚙️ Configuration

### **Prerequisites**
1. Configure logs channel with `/config`
2. Ensure bot has permission to send messages in logs channel
3. Administrator permissions for `/update` command

### **Automatic Setup**
- Tables created automatically on first startup
- No additional configuration required
- Works with existing bot setup

## 🎯 Use Cases

### **Development Workflow**
1. Make code changes
2. Update version in package.json
3. Deploy/restart bot → **Automatic notification**
4. Run `/update` command with detailed changelog
5. Beautiful notifications sent to all servers

### **Production Updates**
1. Deploy new version
2. Bot detects version change automatically  
3. Use `/update` to document changes
4. Server admins see professional update notifications

### **Maintenance Tracking**
- Track restart frequency for debugging
- Monitor update history
- Professional appearance for server members

## 🔧 Advanced Features

### **Version Comparison**
- Automatically compares `package.json` version with stored version
- Handles semantic versioning (1.0.0 → 1.1.0)
- Updates package.json when using `/update` command

### **Multi-Server Support**
- Sends notifications to **all** configured servers
- Each server gets updates in their own logs channel
- Consistent branding across all servers

### **Error Handling**
- Graceful handling of missing logs channels
- Fallback for servers without configuration
- Detailed error logging for debugging

## 📈 Benefits

### **For Developers**
- ✅ Automatic version tracking
- ✅ Professional deployment notifications
- ✅ Changelog documentation
- ✅ Update history tracking

### **For Server Admins**
- ✅ Transparency about bot updates
- ✅ Professional appearance
- ✅ Restart/maintenance awareness
- ✅ Detailed change information

### **For Users**
- ✅ Know when features are added
- ✅ Understand bot maintenance
- ✅ Professional server management
- ✅ Clear communication about changes

## 🎉 Example Workflow

1. **Development**: Make changes to bot code
2. **Version Bump**: Update package.json to v1.2.0
3. **Deploy**: Restart bot
4. **Automatic**: Version change detected → Basic notification sent
5. **Manual**: Run `/update version:1.2.0 changelog:"Added new moderation features and improved performance" type:minor`
6. **Result**: Beautiful, detailed update notification sent to all servers

This system transforms your bot updates from silent deployments to professional, transparent communications that keep your server communities informed and engaged! 🚀
