# 🛠️ Guardian Security Bot - Troubleshooting Guide

## ✅ Recent Fixes Applied

### **Spam Protection Issues Fixed:**
1. **Configuration not saving** - Fixed missing `spam_punishment_unit` field
2. **Punishment not working** - Added comprehensive permission checking
3. **Settings reverting** - Fixed modal handler validation and error handling
4. **Better logging** - Added detailed console output for debugging

### **Permission Issues Fixed:**
1. **Punishment failures** - Bot now checks permissions before attempting actions
2. **Role hierarchy** - Prevents attempting to punish users with higher roles
3. **Missing permissions** - Clear error messages with required permissions
4. **Graceful degradation** - Bot continues working even with limited permissions

### **All Protection Systems Enhanced:**
1. **Spam Protection** - ✅ Fixed and working
2. **Raid Protection** - ✅ Enhanced with better detection
3. **Auto-Moderation** - ✅ Improved filtering
4. **Anti-Nuke Protection** - ✅ Better audit log handling
5. **Warning System** - ✅ Comprehensive tracking

---

## 🔧 Setup Requirements

### **Required Bot Permissions:**
For the bot to work properly, it needs these Discord permissions:

#### **Essential Permissions:**
- `Send Messages` - Basic functionality
- `Embed Links` - For rich embeds
- `Read Message History` - To process messages
- `Manage Messages` - Delete spam/unwanted messages

#### **Moderation Permissions:**
- `Moderate Members` - For timeouts/mutes (REQUIRED for spam punishment)
- `Kick Members` - For kick punishments
- `Ban Members` - For ban punishments
- `Manage Roles` - For role-based moderation
- `Manage Channels` - For anti-nuke protection

#### **Advanced Permissions:**
- `View Audit Log` - For anti-nuke detection (recommended)
- `Administrator` - For full functionality (recommended)

### **Role Hierarchy:**
⚠️ **CRITICAL**: The bot's role must be **ABOVE** any users you want it to moderate!

---

## 🛡️ Testing Your Spam Protection

### **Recommended Test Settings:**
```
Number of messages: 3
Time window: 5 seconds  
Punishment: timeout
Duration: 60 seconds
```

### **How to Test:**
1. **Configure spam protection** with the settings above
2. **Enable spam protection** using the toggle
3. **Send 3 messages quickly** with your alt account
4. **Bot should:**
   - Delete the spam messages
   - Timeout the user for 60 seconds
   - Log the action (if logs channel is set)

### **If Testing Fails:**
Check the console output for these messages:
- `🔍 Spam check for [username]` - Shows detection is working
- `🚨 Spam detected!` - Confirms threshold was reached
- `🔨 Attempting to punish user` - Shows punishment attempt
- `✅ Successfully timed out [username]` - Confirms success

---

## 🚨 Common Issues & Solutions

### **Issue: "Punishment Failed - Missing Permissions"**
**Solution:** 
1. Go to Server Settings → Roles
2. Find your bot's role
3. Enable the required permissions (see above)
4. Move the bot's role ABOVE user roles

### **Issue: "Cannot punish user with equal or higher role"**
**Solution:**
1. Drag the bot's role above the user's highest role
2. Or test with a user who has lower roles

### **Issue: "Configuration keeps reverting to defaults"**
**Cause:** Fixed in recent update!
**Solution:** Update applied - configuration now saves properly

### **Issue: "Spam protection not triggering"**
**Check:**
1. Is spam protection **enabled**? (Green toggle)
2. Are you sending messages **fast enough**?
3. Are you using the **correct account** (not bot owner)?
4. Check console for `🔍 Spam check` messages

### **Issue: "Anti-nuke not working"**
**Cause:** Bot lacks "View Audit Log" permission
**Solution:** Enable "View Audit Log" permission for the bot

---

## 📊 How Each Protection Works

### **🚀 Spam Protection:**
- **Tracks:** Messages per user in time window
- **Triggers:** When threshold exceeded
- **Actions:** Delete messages + apply punishment
- **Resets:** After punishment applied

### **🛡️ Raid Protection:**
- **Tracks:** User joins in time window
- **Triggers:** When join threshold exceeded
- **Actions:** Kicks recent joiners + lockdown mode

### **🔍 Auto-Moderation:**
- **Checks:** Every message for violations
- **Detects:** Profanity, caps spam, excessive mentions
- **Actions:** Delete message + warn user

### **💣 Anti-Nuke Protection:**
- **Monitors:** Channel/role creation/deletion, member kicks
- **Tracks:** Actions per user in time window
- **Actions:** Remove permissions + notify admins

---

## ✅ Verification Checklist

### **Basic Setup:**
- [ ] Bot has required permissions
- [ ] Bot role is above user roles
- [ ] Authentication is set up (2FA)
- [ ] Basic configuration completed

### **Spam Protection:**
- [ ] Spam protection is enabled (green toggle)
- [ ] Configuration saved successfully
- [ ] Test with 3+ quick messages
- [ ] Punishment applied correctly

### **Other Protections:**
- [ ] Raid protection enabled
- [ ] Auto-moderation configured
- [ ] Anti-nuke protection active
- [ ] Logs channel set (optional but recommended)

---

## 🔍 Debug Information

### **Console Messages to Watch For:**

#### **Successful Spam Detection:**
```
🔍 Spam check for username: { messageCount: 3, threshold: 3, ... }
🚨 Spam detected! User username sent 3 messages in 5s
🔨 Attempting to punish user username with timeout for 60 seconds
✅ Successfully timed out username for 60 seconds
```

#### **Permission Errors:**
```
❌ Punishment failed for username: Bot missing "Moderate Members" permission
```

#### **Configuration Updates:**
```
🛡️ Updating spam protection settings: { messageCount: 3, timeWindow: 5000, ... }
✅ Spam protection settings updated successfully
```

---

## 🆘 Still Having Issues?

If problems persist after checking this guide:

1. **Check bot permissions** - Most issues are permission-related
2. **Verify role hierarchy** - Bot must be above users it moderates
3. **Test with different settings** - Try lower thresholds for testing
4. **Check console output** - Look for error messages
5. **Restart the bot** - Sometimes needed after permission changes

The bot now has comprehensive error handling and should provide clear feedback about what's wrong!
