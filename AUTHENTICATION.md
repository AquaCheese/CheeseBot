# 🔐 Guardian Security Bot - Authentication Setup Guide

## Overview

Guardian Security Bot now includes a comprehensive authentication system to ensure **only ONE person** can control the bot's administrative features. This system includes:

- **Password Protection** - Strong password requirements
- **2FA Authentication** - TOTP codes from authenticator apps (Authy, Google Authenticator, etc.)
- **Session Management** - 24-hour authenticated sessions
- **Account Lockout** - Protection against brute force attacks
- **Backup Codes** - Recovery options if you lose your authenticator

## 🚀 Initial Setup Process

### Step 1: Install Authenticator App
Download one of these authenticator apps on your phone:
- **Authy** (recommended - multi-device sync)
- **Google Authenticator**
- **Microsoft Authenticator**
- **1Password**
- **LastPass Authenticator**

### Step 2: First-Time Setup
1. **Start the bot** with your Discord token
2. **Invite the bot** to your server with Administrator permissions
3. **Run any admin command** (like `/setup` or `/config`)
4. The bot will show an **Initial Setup** message

### Step 3: Password Creation
1. Click **"🔐 Start Authentication Setup"**
2. Enter a **strong password** (minimum 8 characters with uppercase, lowercase, numbers, and special characters)
3. Confirm your password

### Step 4: 2FA Setup
1. The bot will display a **QR code**
2. Open your authenticator app
3. **Scan the QR code** OR enter the secret manually
4. Enter the **6-digit code** from your app
5. **Save your backup codes** securely!

### Step 5: Complete Setup
Once verified, you're now the **exclusive administrator** of the bot!

## 🔑 Daily Usage

### Logging In
- Run any admin command (`/setup`, `/config`, `/panic`, etc.)
- If not authenticated, click **"🔐 Login"**
- Enter your **password** and **current 2FA code**
- Your session lasts **24 hours**

### Logging Out
- Use `/logout` command to end your session early
- Sessions automatically expire after 24 hours

## 🛡️ Security Features

### Password Requirements
- Minimum 8 characters
- Must include:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&* etc.)

### 2FA Protection
- **Time-based One-Time Passwords (TOTP)**
- **30-second rotation** of codes
- **2-minute window** for code acceptance
- **Backup codes** for emergency access

### Account Protection
- **3 failed attempts** triggers 15-minute lockout
- **Session tokens** expire automatically
- **JWT-based** secure session management
- **Bcrypt password hashing** (12 rounds)

### Exclusive Access
- **Only ONE person** can register and use the bot
- **No shared access** - each bot instance has one owner
- **Account registration** is locked after first setup

## 📱 Authenticator App Setup

### Authy (Recommended)
1. Download Authy app
2. Create account with your phone number
3. Scan QR code or enter secret manually
4. Name it "Guardian Bot"
5. Enable backup and sync for multi-device access

### Google Authenticator
1. Download Google Authenticator
2. Tap "+" to add account
3. Select "Scan QR code"
4. Scan the bot's QR code
5. Name it "Guardian Bot"

### Manual Entry (if QR doesn't work)
1. Choose "Enter setup key manually" in your app
2. Account name: `Guardian Bot`
3. Key: `[the secret key shown by bot]`
4. Time-based: Yes

## 🔧 Commands Reference

### Authentication Commands
- `/login` - Authenticate with the bot
- `/logout` - End your current session

### Protected Commands (Require Authentication)
- `/setup` - Configure bot features
- `/config` - Set channels and basic settings
- `/panic` - Emergency server lockdown
- `/warn` - Warn users
- `/warnings` - Check user warnings

### Public Commands (No Authentication Required)
- `/status` - Check bot status

## 🆘 Troubleshooting

### "Invalid 2FA code" Error
- **Check time sync** on your phone
- **Wait for next code** (codes change every 30 seconds)
- **Try again** within the 2-minute window
- Use a **backup code** if available

### "Account locked" Error
- **Wait 15 minutes** after 3 failed attempts
- Ensure you're using the **correct password**
- Check **caps lock** and **typing accuracy**

### Lost Authenticator Access
1. Use one of your **backup codes** instead of 2FA code
2. Each backup code can only be used **once**
3. **Set up your authenticator again** after login

### Forgot Password
- **No password recovery** - security by design
- You'll need to **reset the bot database** and start over
- **Always save your backup codes** securely

### Multiple People Want Access
- This bot is designed for **single-user control**
- Only **one person per bot instance** can have access
- Consider **separate bot instances** for different administrators

## 🔒 Security Best Practices

### Password Security
- Use a **unique password** not used elsewhere
- Consider using a **password manager**
- **Don't share** your password with anyone
- **Change regularly** if needed

### 2FA Security
- **Keep your phone secure** with screen lock
- **Don't screenshot** QR codes or secrets
- **Store backup codes** in a secure location (password manager, safe, etc.)
- **Don't share** backup codes with anyone

### Session Security
- **Log out** when using shared computers
- **Don't leave sessions** active unnecessarily
- **Monitor login times** for suspicious activity

### Backup Code Management
- **Print and store** in a secure physical location
- **Save in encrypted** password manager
- **Don't store** in plain text files
- **Keep separate** from your main password

## ⚠️ Important Notes

1. **This is irreversible** - once someone sets up authentication, they become the sole owner
2. **Backup codes are crucial** - without them and your authenticator, you'll be locked out
3. **Time synchronization matters** - ensure your phone's time is accurate
4. **One chance only** - if you lose all access methods, you'll need to restart with a fresh bot
5. **Session security** - 24-hour sessions balance security with usability

## 🔧 Technical Details

### Encryption Standards
- **bcrypt** with 12 rounds for password hashing
- **TOTP** following RFC 6238 standard
- **JWT tokens** for session management
- **32-byte secrets** for TOTP generation

### Database Security
- **Local SQLite** database only
- **No external API calls** for authentication
- **Encrypted password storage**
- **Session token validation**

### Session Management
- **24-hour duration** by default
- **Automatic expiration** cleanup
- **JWT-based** token system
- **Secure random** session IDs

This authentication system ensures your Guardian Security Bot remains under your exclusive control while providing enterprise-grade security features.
