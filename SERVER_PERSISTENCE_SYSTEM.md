# 🔄 Server Persistence & Restoration System

## 🎯 Overview

CheeseBot now includes a comprehensive **Server Persistence System** that automatically stores all configurations, authentication data, and user permissions, making bot redeployment to previously configured servers seamless and effortless.

## ✨ Key Features

### 🔍 **Automatic Server Detection**
- Detects when bot is added to a previously configured server
- Shows detailed setup history with original administrator info
- Provides clear restoration vs. reset options

### 🔐 **Secure Password-Based Restoration**
- Uses original setup passwords for security verification
- Maintains same authentication system as original setup
- Prevents unauthorized configuration changes

### 💾 **Complete Data Backup**
- **Server Configurations** (admin/logs channels, safe roles)
- **Authentication Settings** (passwords, 2FA secrets, backup codes)
- **User Permissions** (authorized users and their access levels)
- **Moderation Settings** (spam protection, raid protection, etc.)
- **Setup History** (who configured, when, restoration count)

### 🚀 **Railway Server Persistence**
- All data stored in SQLite database on Railway server
- Survives bot restarts, redeployments, and server changes
- Cross-platform compatibility (Windows, Linux, macOS)

## 🔧 How It Works

### **First Time Setup (New Server)**
```bash
1. /config admin-channel:#admin logs-channel:#logs
   ↓ Creates initial server configuration
   ↓ Saves setup history with temporary password
   
2. /setup 
   ↓ Shows standard setup menu
   ↓ Configure authentication, moderation, etc.
   ↓ Real password set during authentication setup
```

### **Returning to Previously Configured Server**
```bash
1. /setup
   ↓ Bot detects previous configuration
   ↓ Shows: "I have already been configured for this server"
   ↓ Displays original setup user and date
   
2. Choose Option:
   📋 "Enter Password & Resume" → Restore everything
   🔄 "Reset & Start Fresh" → Delete all data
   📝 "View Setup Details" → See configuration info
```

### **Password Verification & Restoration**
```bash
1. Click "Enter Password & Resume"
   ↓ Modal appears requesting original password
   
2. Enter correct password
   ↓ Verifies against stored bcrypt hash
   ↓ Restores all configurations automatically
   ↓ Updates restoration count and timestamp
   
3. Ready to use!
   ↓ All previous settings restored
   ↓ Same admin/logs channels
   ↓ Same user permissions
   ↓ Same moderation settings
```

## 📊 Database Structure

### **server_setup_history** Table
```sql
- id: Unique setup ID
- guild_id: Discord server ID  
- guild_name: Server name
- setup_by_user_id: Original admin ID
- setup_by_username: Original admin tag
- admin_password_hash: Bcrypt password hash
- admin_channel_id: Admin channel ID
- logs_channel_id: Logs channel ID
- configuration_data: JSON backup of server config
- auth_users_backup: JSON backup of auth users
- authorized_users_backup: JSON backup of permissions
- moderation_settings_backup: JSON backup of settings
- first_setup_at: Original setup timestamp
- last_restored_at: Most recent restoration
- setup_version: Bot version used for setup
- is_active: Active status flag
- restore_count: Number of times restored
- notes: Additional setup information
```

## 🎮 User Experience

### **For Server Admins**
- **Effortless Redeployment**: No need to reconfigure everything
- **Secure Access**: Original password required for restoration
- **Complete History**: See who set up the bot and when
- **Flexible Options**: Restore or reset as needed

### **For Bot Developers**
- **Persistent Data**: All configurations survive redeployments
- **Easy Testing**: Deploy to test servers without losing data
- **Version Tracking**: See which bot version was used for setup
- **Audit Trail**: Complete history of setup and restoration events

## 🔒 Security Features

### **Password Protection**
- Bcrypt hashed passwords (industry standard)
- Original setup password required for restoration
- No password recovery (prevents unauthorized access)

### **Access Control**
- Only Discord administrators can use `/setup`
- Restoration requires original password knowledge
- Setup history includes audit trail

### **Data Integrity**
- Atomic database transactions
- Backup verification before restoration
- Error handling with rollback capability

## 📋 Available Commands

### **Setup & Configuration**
- `/config` - Initial server setup (admin/logs channels)
- `/setup` - Main configuration menu (detects previous setups)
- `/backup export` - Export current configuration
- `/backup import` - Import configuration from file

### **Restoration Process**
1. `/setup` → Detects previous configuration
2. Click "Enter Password & Resume" 
3. Enter original password in modal
4. Automatic restoration of all settings
5. Confirmation message with details

### **Reset Process**
1. `/setup` → Click "Reset & Start Fresh"
2. Confirm deletion warning
3. All data permanently deleted
4. Start over with `/config`

## 🎯 Benefits

### **🚀 For Production Deployment**
- **Zero Downtime**: Restore configurations instantly
- **No Data Loss**: Everything preserved between deployments
- **Quick Recovery**: Get back online in seconds, not hours

### **🧪 For Development & Testing**
- **Persistent Test Data**: Test configurations survive restarts
- **Multiple Environments**: Same configs across dev/staging/prod
- **Easy Rollback**: Restore previous working configurations

### **👥 For Team Management**
- **Shared Access**: Team members can restore using original password
- **Audit Trail**: See who configured what and when
- **Version Control**: Track which bot version was used

## 🔄 Workflow Examples

### **Scenario 1: Railway Redeployment**
```bash
1. Railway server restarts/redeploys
2. Bot comes back online with same database
3. Admin runs /setup in Discord
4. Bot shows: "Previously configured by @admin on Jan 15"
5. Enter password → Everything restored instantly
6. Bot fully operational with all previous settings
```

### **Scenario 2: Moving to New Hosting**
```bash
1. Export database from old hosting
2. Deploy bot on new hosting with same database
3. Admin runs /setup
4. Restoration flow detects previous configuration
5. Password verification → Full restoration
6. Seamless transition to new hosting
```

### **Scenario 3: Fresh Start**
```bash
1. Admin decides to reconfigure completely
2. Run /setup → Click "Reset & Start Fresh"
3. Confirm deletion of all data
4. All history marked inactive
5. Start over with /config command
6. Clean slate for new configuration
```

## 🛠️ Technical Implementation

### **Detection Logic**
```javascript
1. /setup command checks server_setup_history table
2. If history found → Show restoration interface
3. If no history → Standard setup process
4. Password verification using bcrypt.compare()
5. Restoration via database.restoreServerConfiguration()
```

### **Data Storage**
```javascript
- All data stored in Railway PostgreSQL/SQLite
- JSON serialization for complex configurations
- Bcrypt password hashing for security
- Atomic transactions for data integrity
```

### **Error Handling**
```javascript
- Graceful fallback to manual setup if restoration fails
- Detailed error messages for troubleshooting
- Audit logging for all restoration attempts
- Database transaction rollback on errors
```

## 🎉 Result

**CheeseBot now provides enterprise-level persistence and restoration capabilities, making server redeployment as simple as entering a password!**

### **Before**: 
❌ Lose all configurations on redeployment  
❌ Manually reconfigure everything  
❌ Set up authentication from scratch  
❌ Recreate user permissions  

### **After**: 
✅ Automatic configuration detection  
✅ Secure password-based restoration  
✅ Complete data preservation  
✅ Instant deployment recovery  
✅ Full audit trail and history  

**Perfect for production environments, development workflows, and team collaboration!** 🚀
