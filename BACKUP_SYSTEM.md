# Complete Backup System Documentation

## Overview
Guardian Bot now features a comprehensive backup system that can export, import, and manage ALL server data including user progress, counting leaderboards, ticket history, and complete configuration settings.

## Available Commands

### `/backup export`
Creates a complete backup of all server data including:
- **Server Configuration**: Admin channels, logs channels, panic mode settings
- **Moderation Settings**: Auto-moderation rules, warning thresholds, punishment configurations
- **Authorized Users**: All users with bot permissions and their access levels
- **User Warnings**: Complete moderation history and warning records
- **AFK Users**: AFK status and custom messages for all users
- **Birthday Calendar**: All registered birthdays and notification settings
- **Ticket System**: All ticket records, status, and conversation history
- **Counting Channels**: Channel configurations and counting rules
- **Counting Statistics**: User counting stats and leaderboards
- **Counting History**: Complete counting progression and user achievements
- **User Info Cache**: Cached user information for reporting and moderation

**Export Features:**
- Generates a detailed JSON backup file with all data
- Shows comprehensive statistics about what's being backed up
- Includes export timestamp and bot version information
- Provides data counts for each category
- File is downloadable and can be stored securely

### `/backup import file:<backup.json>`
Restores server data from a backup file with:
- **File Validation**: Ensures backup file is valid Guardian Bot format
- **Preview System**: Shows exactly what will be imported before proceeding
- **Confirmation Process**: Requires explicit confirmation with detailed warnings
- **Progress Tracking**: Real-time import progress and status updates
- **Error Handling**: Comprehensive error reporting and rollback on failure
- **Success Summary**: Detailed report of what was successfully restored

**Import Features:**
- Overwrites ALL existing data (with clear warnings)
- Restores all 12 data categories from backup
- Invalidates all user sessions (requires re-authentication)
- Provides detailed import statistics and any errors
- Logs the import action for audit purposes

### `/backup status`
Displays comprehensive backup status including:
- **Current Data Summary**: Total items, data health assessment
- **Configuration Status**: Server config and moderation settings status
- **User Data Statistics**: Counts for all user-related data
- **Activity Data**: Counting, tickets, birthdays overview
- **Auto-Backup Status**: Whether automatic restoration is enabled
- **Backup Recommendations**: Suggestions based on current data coverage
- **Available Actions**: Quick reference for backup commands

### `/backup schedule frequency:<daily|weekly|monthly> enabled:<true|false>`
Configure automatic backup scheduling (Currently in development):
- **Frequency Options**: Daily, weekly, or monthly automated backups
- **Enable/Disable**: Turn automatic scheduling on or off
- **Preview System**: Shows what would be configured
- **Future Features**: Will include automatic file generation and notifications

## Data Categories Backed Up

1. **Server Configuration** (1 item)
   - Admin channel settings
   - Logs channel configuration
   - Basic server preferences

2. **Moderation Settings** (1 item)
   - Auto-moderation rules
   - Warning system configuration
   - Punishment thresholds

3. **Authorized Users** (Variable count)
   - User IDs with bot permissions
   - Access levels and roles
   - Authentication records

4. **User Warnings** (Variable count)
   - Complete warning history
   - Moderator actions
   - Warning timestamps and reasons

5. **AFK Users** (Variable count)
   - AFK status for each user
   - Custom AFK messages
   - AFK timestamps

6. **Birthday Calendar** (Variable count)
   - User birthday registrations
   - Notification preferences
   - Birthday history

7. **Ticket System** (Variable count)
   - All ticket records
   - Ticket status and assignments
   - Conversation history

8. **Counting Channels** (Variable count)
   - Channel configurations
   - Counting rules and settings
   - Next number tracking

9. **Counting Statistics** (Variable count)
   - User counting progress
   - Leaderboard data
   - Achievement records

10. **Counting History** (Variable count)
    - Complete counting progression
    - User participation history
    - Milestone achievements

11. **User Info Cache** (Variable count)
    - Cached user information
    - Account age and join dates
    - Moderation-relevant data

## Security Features

### Data Protection
- **Sensitive Data Warning**: Clear warnings about backup contents
- **Secure Storage Recommendations**: Guidance on keeping backups secure
- **Access Control**: Only administrators can create/import backups
- **Session Invalidation**: All user sessions reset after import

### Validation & Safety
- **File Format Validation**: Ensures only valid backup files are processed
- **Structure Verification**: Validates backup file contains required data
- **Preview Before Import**: Shows exactly what will be changed
- **Confirmation Required**: Explicit user confirmation for destructive operations
- **Error Rollback**: Database transactions ensure data integrity

### Audit & Logging
- **Action Logging**: All backup operations are logged
- **Detailed Statistics**: Comprehensive reporting of backup contents
- **Import Summary**: Complete record of what was restored
- **Error Tracking**: Detailed error reporting and troubleshooting

## Automatic Restoration

### Guild Join Event
When the bot is re-invited to a server:
- Automatically detects if previous configuration exists
- Restores basic server settings (admin/logs channels)
- Preserves moderation configurations
- Maintains authorized user lists
- Logs the restoration action

### Data Persistence
- Configuration is automatically saved when changes are made
- User data is continuously backed up during normal operation
- No manual intervention required for basic restoration
- Complete data export available on-demand

## Use Cases

### Server Migration
1. Export complete backup from old server
2. Invite bot to new server
3. Import backup to restore all data
4. Users re-authenticate with existing accounts

### Disaster Recovery
1. Bot automatically restores basic settings when re-invited
2. Use backup files to restore complete historical data
3. All user progress and achievements preserved
4. Minimal configuration required

### Data Archival
1. Regular exports for long-term data preservation
2. Historical records of server activity
3. User progress tracking over time
4. Compliance and audit trail maintenance

### Testing & Development
1. Export production data for testing
2. Import test configurations safely
3. Rollback to previous configurations
4. Safe experimentation with bot settings

## File Format

Backup files are JSON format with structure:
```json
{
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "guildId": "123456789",
  "guildName": "Example Server",
  "botVersion": "3.0.0",
  "serverConfig": { ... },
  "moderationSettings": { ... },
  "authorizedUsers": [ ... ],
  "userWarnings": [ ... ],
  "afkUsers": [ ... ],
  "birthdays": [ ... ],
  "tickets": [ ... ],
  "countingChannels": [ ... ],
  "countingStats": [ ... ],
  "countingHistory": [ ... ],
  "userInfoCache": [ ... ]
}
```

## Best Practices

### Regular Backups
- Export backups before major configuration changes
- Store backups securely outside of Discord
- Keep multiple backup versions for different time periods
- Test import process periodically

### Security
- Only share backup files with trusted administrators
- Store backups in secure, encrypted locations
- Regularly audit who has access to backup files
- Delete old backups when no longer needed

### Maintenance
- Review backup status regularly with `/backup status`
- Monitor data growth and backup file sizes
- Clean up old user data periodically
- Update backup procedures when bot is updated

## Troubleshooting

### Import Issues
- Ensure backup file is valid JSON format
- Check file was exported from compatible bot version
- Verify sufficient permissions for import operation
- Review error messages for specific issues

### Missing Data
- Check if data was present in original export
- Verify import completed successfully
- Review import summary for any errors
- Check specific data categories with `/backup status`

### Performance
- Large imports may take several minutes
- Monitor bot memory usage during imports
- Consider breaking large datasets into smaller imports
- Schedule imports during low-activity periods

This comprehensive backup system ensures that all server data, user progress, and configurations are preserved and can be restored as needed, providing complete peace of mind for server administrators.
