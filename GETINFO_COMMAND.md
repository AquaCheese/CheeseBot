# GetInfo Command - Comprehensive Evidence Collection

## ⚠️ IMPORTANT LEGAL NOTICE

The `/getinfo` command is designed for **legitimate legal and evidence collection purposes only**. This command requires maximum security authorization and should only be used by verified server administrators with proper legal grounds.

## Command Overview

**Command:** `/getinfo`
**Required Permission:** Administrator + Primary Admin Registration + 2FA
**Purpose:** Collect comprehensive user information for legal/evidence purposes

## Security Requirements

### 1. Maximum Authentication Level
- Must be the registered primary administrator
- Requires active 2FA authentication via authenticator app
- Real-time verification with 6-digit TOTP code

### 2. Legal Basis Requirement
Must specify one of the following legal bases:
- **Law Enforcement Request** - Official law enforcement investigation
- **Terms of Service Violation** - Platform ToS violation investigation
- **Harassment Investigation** - Harassment or abuse investigation
- **Illegal Content Report** - CSAM, threats, or other illegal content
- **Court Order/Subpoena** - Legal court order or subpoena

### 3. Documentation Requirements
- Case reference number (optional but recommended)
- Detailed justification for data collection (minimum 20 characters)
- All actions are logged for audit purposes

## Command Parameters

```
/getinfo target_user:<@user> legal_basis:<basis> case_reference:<optional>
```

- `target_user` - The Discord user to collect information about
- `legal_basis` - Legal justification for data collection (required)
- `case_reference` - Case or incident reference number (optional)

## Security Verification Process

### Step 1: Initial Authorization
- Verifies user is registered primary administrator
- Checks for active authentication session
- Displays security warning and data collection notice

### Step 2: 2FA Verification
- Presents modal requiring authenticator code
- Requires detailed justification for collection
- Validates TOTP code against registered authenticator

### Step 3: Data Collection
- Collects all available user information
- Generates comprehensive evidence report
- Creates downloadable text file with findings

## Data Collection Scope

### ✅ Available Data (What Gets Collected)

**Account Information:**
- User ID, username, display name
- Account creation date and age
- Avatar URL and profile information
- Bot/system account status

**Server Membership Data:**
- Join date and server nickname
- All roles and permissions
- Administrative/moderator status
- Highest role and permission level

**Moderation History:**
- All warnings issued to the user
- Moderation actions taken
- Incident reports involving the user
- Risk assessment data

**Activity Analysis:**
- Message count in accessible channels
- Recent message samples (content previews only)
- Channel activity breakdown
- Counting system statistics

**Cached Data:**
- Previously stored user information
- Behavioral analysis data
- Risk level assessments

### ❌ Limitations (What Cannot Be Collected)

**Discord API Restrictions:**
- User's real location or IP address
- Email addresses or phone numbers
- Direct messages (DMs) or private conversations
- Messages from other servers
- Deleted messages (cannot be retrieved)
- User's personal Discord settings

**Privacy Law Compliance:**
- Only collects data available through Discord API
- Cannot access encrypted or private information
- Does not collect data from third-party services
- Respects Discord's data access limitations

## Evidence File Format

### File Details
- **Format:** Plain text (.txt file)
- **Filename:** `evidence-report-[username]-[timestamp].txt`
- **Contents:** Comprehensive structured report

### Report Sections
1. **Case Information** - Collection metadata and legal basis
2. **Target User Information** - Complete account details
3. **Server Membership** - Roles, permissions, join date
4. **Moderation History** - All warnings and incidents
5. **Activity Analysis** - Message patterns and statistics
6. **Legal Notices** - Data protection and usage guidelines

### Sample Report Structure
```
COMPREHENSIVE USER INFORMATION REPORT
=====================================

CASE INFORMATION:
- Case Reference: LE-2024-001
- Legal Basis: Law Enforcement Request
- Collection Date: 2024-01-01T12:00:00.000Z
- Collected By: admin#0001 (123456789)
- Server: Example Server (987654321)

TARGET USER INFORMATION:
========================
- User ID: 555666777
- Username: targetuser
- Account Created: 2020-01-01T00:00:00.000Z
- Account Age: 1461 days

[Additional sections continue...]
```

## Legal Compliance Features

### Data Protection
- **Minimal Collection:** Only collects necessary data for stated purpose
- **Retention Notice:** Includes data retention and deletion guidelines
- **Sharing Restrictions:** Clear guidelines on authorized sharing
- **Audit Trail:** Complete logging of all collection activities

### Legal Documentation
- **Collection Basis:** Documents legal justification for collection
- **Timestamp Records:** Precise timing of all collection activities
- **Administrator Identity:** Records who performed the collection
- **Case Tracking:** Links collection to specific case/incident

### Compliance Statements
Each evidence file includes:
- Data protection compliance notice
- Retention and deletion policy
- Authorized sharing restrictions
- Legal basis documentation

## Use Cases

### 1. Law Enforcement Requests
```
/getinfo target_user:@suspect legal_basis:law_enforcement case_reference:PD-2024-456
Justification: "Police investigation into threats made against public officials"
```

### 2. Terms of Service Violations
```
/getinfo target_user:@violator legal_basis:tos_violation case_reference:TOS-789
Justification: "Investigation of repeated harassment and doxxing violations"
```

### 3. Illegal Content Reports
```
/getinfo target_user:@reporter legal_basis:illegal_content case_reference:CSAM-123
Justification: "Collection of user data for CSAM incident report to authorities"
```

## Security Audit Trail

### Automatic Logging
Every use of `/getinfo` creates audit records including:
- **Who:** Administrator who performed collection
- **What:** Target user and data collected
- **When:** Precise timestamp of collection
- **Why:** Legal basis and detailed justification
- **Where:** Server and channels involved

### Audit Record Format
```
[2024-01-01 12:00:00] EVIDENCE_COLLECTION
Administrator: admin#0001 (123456789)
Target: targetuser#1234 (555666777)
Legal Basis: law_enforcement
Case Reference: PD-2024-456
Justification: Police investigation into threats...
```

## Best Practices

### Before Collection
1. **Verify Legal Authority** - Ensure you have proper legal grounds
2. **Document Basis** - Have case numbers and official requests ready
3. **Secure Storage** - Prepare secure location for evidence files
4. **Authorization Check** - Confirm you're the authorized primary admin

### During Collection
1. **Accurate Information** - Provide precise case references
2. **Detailed Justification** - Write clear, specific reasoning
3. **Fresh 2FA Code** - Use current authenticator code
4. **Secure Environment** - Perform collection in private, secure location

### After Collection
1. **Secure Storage** - Store evidence files in encrypted, secure location
2. **Access Control** - Limit access to authorized personnel only
3. **Retention Policy** - Delete files when no longer legally required
4. **Chain of Custody** - Maintain proper documentation of file handling

## Troubleshooting

### Authentication Issues
- **Invalid 2FA Code:** Use fresh code from authenticator app
- **Not Primary Admin:** Only registered primary admin can use command
- **Session Expired:** Re-authenticate with `/auth login`

### Collection Errors
- **User Not Found:** Ensure user is still in the server
- **Permission Denied:** Verify bot has necessary permissions
- **Timeout Error:** Try again, some collections take time

### Data Limitations
- **Missing Messages:** Bot can only access messages it has permission to see
- **No DM Access:** Private messages cannot be collected
- **Deleted Content:** Deleted messages cannot be retrieved

## Legal Disclaimer

This tool is provided for legitimate legal and administrative purposes only. Users are responsible for:

- Ensuring proper legal authority for data collection
- Complying with applicable data protection laws (GDPR, CCPA, etc.)
- Securing collected evidence appropriately
- Deleting data when no longer needed
- Following proper legal procedures for evidence handling

**Misuse of this command for unauthorized surveillance, harassment, or privacy violations is strictly prohibited and may violate local, state, and federal laws.**

## Contact Information

For questions about legal compliance or proper usage of evidence collection tools:
- Review your organization's legal and IT security policies
- Consult with legal counsel for complex cases
- Contact law enforcement for guidance on evidence requirements
- Follow Discord's Terms of Service and Community Guidelines
