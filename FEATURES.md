# Guardian Security Bot - Feature Documentation

## 🛡️ Complete Feature Overview

### 1. Spam Protection System
**Purpose**: Prevent users from flooding channels with rapid messages

**How it works**:
- Tracks message count per user in real-time
- Monitors time between messages
- Automatically punishes violators

**Configuration Options**:
- **Message Count Threshold**: How many messages trigger detection (default: 5)
- **Time Window**: Time frame for counting messages (default: 5 seconds)
- **Punishment Type**: timeout, mute, kick, ban, warn
- **Punishment Duration**: How long punishment lasts
- **Time Unit**: seconds, minutes, hours, days, weeks

**Example Settings**:
- Aggressive: 3 messages in 3 seconds = 10 minute timeout
- Moderate: 5 messages in 5 seconds = 5 minute timeout  
- Lenient: 8 messages in 10 seconds = warning

### 2. Raid Protection System
**Purpose**: Prevent coordinated mass user joins (raids)

**How it works**:
- Monitors user join patterns
- Detects suspicious mass joins
- Automatically punishes raiders

**Configuration Options**:
- **User Threshold**: Number of joins that trigger protection (default: 10)
- **Time Window**: Time frame for counting joins (default: 60 seconds)
- **Punishment**: kick, ban

**Example Settings**:
- High Security: 5 joins in 30 seconds = automatic bans
- Medium Security: 10 joins in 60 seconds = automatic kicks
- Low Security: 20 joins in 120 seconds = warnings

### 3. Auto Moderation System
**Purpose**: Automatically filter and remove inappropriate content

**Components**:

#### Profanity Filter
- Removes messages containing inappropriate language
- Comprehensive word list
- Case-insensitive detection
- Automatic message deletion + user warning

#### Link Filter  
- Blocks external URLs
- Prevents malicious link sharing
- Regex-based detection
- Optional whitelist support

#### Invite Filter
- Blocks Discord server invites
- Prevents server advertising
- Detects all invite formats
- Automatic removal

#### Caps Filter
- Limits excessive capitalization
- Configurable percentage threshold (default: 70%)
- Minimum message length requirement
- Helps reduce "shouting"

### 4. Anti-Nuke Protection
**Purpose**: Prevent server destruction attacks

**Protection Areas**:
- **Channel Management**: Limits channel creation/deletion
- **Role Management**: Prevents mass role creation
- **Mass Bans**: Stops coordinated ban attacks
- **Permission Changes**: Monitors dangerous permission edits

**Configuration Options**:
- Channel creation limit per timeframe
- Channel deletion limit per timeframe
- Role creation limit per timeframe
- Mass ban detection threshold

### 5. Warning System
**Purpose**: Track user violations and escalate punishments

**Features**:
- Persistent warning storage
- Automatic escalation rules
- Warning history tracking
- Moderator accountability

**Commands**:
- `/warn <user> [reason]` - Add warning
- `/warnings <user>` - View warning history
- Automatic warnings from other systems

### 6. Panic Button System
**Purpose**: Emergency server lockdown for immediate threat response

**What it does**:
1. **Locks all channels** - Prevents further damage
2. **Kicks non-safe users** - Removes potential threats
3. **Enables maximum security** - All protections to highest settings
4. **Logs everything** - Full audit trail

**Configuration**:
- **Safe Roles**: Roles that won't be kicked (admins, mods, trusted users)
- **Channel Exceptions**: Channels that stay unlocked
- **Reversible**: Can be deactivated to restore normal operation

**Use Cases**:
- Coordinated raid attack
- Compromised moderator account
- Mass spam/NSFW attack
- Any immediate threat to server

### 7. Comprehensive Logging System
**Purpose**: Full audit trail of all moderation actions

**What gets logged**:
- All automatic punishments
- Manual moderation actions
- System configuration changes
- Security events and alerts
- User warnings and escalations

**Log Destinations**:
- Designated logs channel (real-time)
- SQLite database (permanent storage)
- Console output (development)

**Log Information**:
- Timestamp
- Action type
- Target user
- Moderator (human or bot)
- Reason/context
- Additional metadata

### 8. Interactive Setup System
**Purpose**: Easy configuration through Discord interface

**Main Menu Options**:
1. **Spam Protection** - Configure anti-spam settings
2. **Raid Protection** - Setup anti-raid systems  
3. **Auto Moderation** - Configure content filters
4. **Anti-Nuke Protection** - Prevent server destruction
5. **Warning System** - Setup warning thresholds
6. **View Current Config** - See all current settings
7. **Panic Button Setup** - Configure emergency lockdown
8. **Advanced Settings** - Fine-tune configurations

**Interface Features**:
- Select menus for options
- Buttons for toggles
- Modals for detailed input
- Real-time preview of changes
- Confirmation dialogs for dangerous actions

### 9. Database System
**Purpose**: Persistent storage for all bot data

**Tables**:
- `server_configs` - Server-specific settings
- `moderation_settings` - Protection configuration
- `warnings` - User warning history
- `mod_logs` - Moderation action logs
- `spam_tracking` - Real-time spam detection data

**Benefits**:
- Survives bot restarts
- Historical data preservation
- Performance optimization
- Data integrity

### 10. Real-time Monitoring
**Purpose**: Live threat detection and response

**Monitoring Systems**:
- Message content analysis
- User behavior patterns
- Join/leave patterns
- Permission changes
- Channel modifications

**Response Types**:
- Immediate action (delete, timeout, kick, ban)
- Warning notifications
- Log generation
- Admin alerts

## 🎯 Use Case Scenarios

### Scenario 1: Spam Attack
1. User starts sending rapid messages
2. Spam protection detects pattern
3. Messages automatically deleted
4. User receives timeout
5. Action logged to admin channel
6. Moderators notified if escalation needed

### Scenario 2: Coordinated Raid
1. Multiple accounts join rapidly
2. Raid protection triggers
3. New joiners automatically banned
4. Server locked down temporarily  
5. Admins notified immediately
6. Full incident logged for review

### Scenario 3: Content Violation
1. User posts inappropriate content
2. Auto-moderation detects violation
3. Message immediately deleted
4. User receives warning
5. Temporary warning message sent
6. Violation logged for escalation

### Scenario 4: Emergency Situation
1. Admin detects serious threat
2. Panic button activated
3. All channels immediately locked
4. Non-safe users kicked
5. Maximum security enabled
6. Situation contained and logged

## 🔧 Advanced Configuration Examples

### High-Security Server
```
Spam Protection: 3 messages / 3 seconds = 30 min timeout
Raid Protection: 3 joins / 30 seconds = immediate ban
Auto-Mod: All filters enabled, 50% caps threshold
Anti-Nuke: Strict limits on all modifications
```

### Community Server
```
Spam Protection: 5 messages / 5 seconds = 5 min timeout
Raid Protection: 10 joins / 60 seconds = kick
Auto-Mod: Profanity + invites, 70% caps threshold
Anti-Nuke: Moderate limits, focus on mass actions
```

### Casual Server
```
Spam Protection: 8 messages / 10 seconds = warning
Raid Protection: 15 joins / 90 seconds = monitoring
Auto-Mod: Basic profanity filter only
Anti-Nuke: Basic protection, higher thresholds
```

This comprehensive security bot provides enterprise-level protection while remaining easy to configure and manage through Discord's interface.
