# 🚀 Discord Bot Deployment Guide

## Quick Deploy to Railway (Recommended)

### Step 1: Prepare Your Code
1. Make sure all your files are saved
2. Your bot token should be in `.env` file (never commit this!)
3. Push your code to GitHub (create a repository)

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your bot repository
5. Railway will automatically detect it's a Node.js project

### Step 3: Set Environment Variables
1. In Railway dashboard, go to your project
2. Click "Variables" tab
3. Add these environment variables:
   - `DISCORD_TOKEN` = your bot token
   - `NODE_ENV` = production

### Step 4: Deploy
1. Railway will automatically deploy your bot
2. Check the "Deployments" tab for logs
3. Your bot should now be online 24/7!

## Alternative Options

### Option 1: Render.com
1. Connect GitHub repository
2. Set environment variables
3. Deploy (free tier available)

### Option 2: DigitalOcean Droplet
1. Create $5/month droplet (Ubuntu)
2. Install Node.js and PM2
3. Clone your repository
4. Run with PM2 for process management

### Option 3: AWS EC2
1. Launch EC2 instance
2. Install dependencies
3. Use PM2 or systemd for process management

## Important Notes

### Environment Variables Needed:
- `DISCORD_TOKEN` - Your bot's token
- `NODE_ENV` - Set to "production"

### Database:
- Your SQLite database will be created automatically
- For production, consider PostgreSQL or MySQL
- Railway provides free PostgreSQL databases

### Monitoring:
- Check deployment logs regularly
- Set up health checks
- Monitor bot uptime

### Security:
- Never commit your `.env` file
- Use environment variables for sensitive data
- Keep dependencies updated

## Cost Estimates

### Free Options:
- Railway: 500 hours/month free
- Render: Free tier with limitations
- Heroku: Free tier (sleeps after 30 min inactivity)

### Paid Options:
- Railway: ~$5/month for always-on
- DigitalOcean: $5/month droplet
- AWS: Variable (can be $5-15/month)

## Recommended Setup for 24/7:
1. **Railway** ($5/month) - Easiest setup
2. **DigitalOcean** ($5/month) - More control
3. **AWS EC2** - Most scalable but complex

Choose Railway for simplicity or DigitalOcean if you want more control over the server environment.
