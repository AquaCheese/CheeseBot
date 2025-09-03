# 🎯 CheeseBot Goal System

## Overview
The Goal System allows servers to set and track various goals with automated progress tracking and celebrations. Perfect for community building and engagement!

## Available Goal Types

### 🚀 **Server Boosts** (Auto-Tracked)
- Automatically tracks server boost count
- Updates in real-time when users boost/unboost
- Perfect for boost campaigns

### 👥 **Member Count** (Auto-Tracked)
- Automatically tracks member joins/leaves
- Updates when users join or leave the server
- Great for growth milestones

### 💬 **Message Count** (Manual Updates)
- Track total messages sent in the server
- Requires manual updates via `/goal update`
- Good for activity goals

### 🎉 **Event Participation** (Manual Updates)
- Track event attendance or participation
- Update manually after events
- Perfect for community events

### ⭐ **Reaction Count** (Manual Updates)
- Track total reactions given
- Requires manual updates
- Great for engagement goals

### 🏆 **Custom Goal** (Manual Updates)
- Create any custom goal type
- Fully customizable title and description
- Perfect for unique server goals

## Commands

### `/goal set` - Create a New Goal
Set up a new goal for your server with progress tracking.

**Options:**
- `type` - Type of goal (boosts, members, messages, events, reactions, custom)
- `target` - Target amount to reach (1-100,000)
- `title` - Custom title for your goal (optional)
- `description` - Description of what happens when goal is reached (optional)
- `emoji` - Custom emoji for the goal (optional)

**Examples:**
```
/goal set type:boosts target:50 title:"Nitro Boost Party" description:"50 boosts = special events channel!"
/goal set type:members target:1000 description:"1000 members = server makeover!"
/goal set type:custom target:100 title:"Art Contest Submissions" emoji:🎨
```

### `/goal view` - View Current Goals
Display all active goals with progress bars and completion status.

**Features:**
- Shows up to 5 goals per command
- Live progress bars with percentages
- Completion status and timestamps
- Goal IDs for management

### `/goal update` - Update Progress (Manual Goals)
Manually update progress for goals that don't auto-track.

**Options:**
- `goal_id` - The ID of the goal to update
- `progress` - New progress amount

**Example:**
```
/goal update goal_id:1 progress:75
```

### `/goal delete` - Remove a Goal
Delete a goal from the active goals list.

**Options:**
- `goal_id` - The ID of the goal to delete

### `/goal celebrate` - Manual Celebration
Trigger a celebration message for a completed goal.

**Options:**
- `goal_id` - The ID of the goal to celebrate

## Auto-Tracking Features

### 🤖 **Boost Tracking**
- Real-time monitoring of server boost changes
- Automatic progress updates
- Instant celebration when goals are completed
- Announcements in system channel or general channels

### 👥 **Member Tracking**
- Tracks member joins and leaves
- Updates goals automatically
- Handles member count changes from all sources

### 🎉 **Auto Celebrations**
When auto-tracked goals are completed:
- Automatic celebration message
- Posted to system channel or general channel
- Includes progress bars and achievement details
- Celebration reactions (🎉, 🚀, 🥳)
- Logged for history tracking

## Progress Bars

Goals display beautiful Unicode progress bars:
```
Empty:     ░░░░░░░░░░░░░░░░░░░░  0%
Quarter:   █████░░░░░░░░░░░░░░░  25%
Half:      ██████████░░░░░░░░░░  50%
Complete:  ████████████████████ 100%
```

## Database Structure

### `server_goals` Table
- Stores all goal information
- Tracks progress and completion status
- Links to guild and creator

### `goal_progress_history` Table
- Logs all progress changes
- Tracks manual vs automatic updates
- Maintains audit trail

### `goal_celebrations` Table
- Records celebration events
- Links to Discord messages
- Tracks completion announcements

## Permissions

### Who Can Use Goal Commands:
- **`/goal set`** - Users with "Manage Guild" permission
- **`/goal view`** - All users
- **`/goal update`** - Users with "Manage Guild" permission
- **`/goal delete`** - Users with "Manage Guild" permission
- **`/goal celebrate`** - Users with "Manage Guild" permission

### Required Bot Permissions:
- Send Messages (for celebrations)
- Add Reactions (for celebration reactions)
- View Audit Log (for tracking changes)
- Read Message History

## Goal Management Tips

### 📝 **Best Practices:**
1. **Set Realistic Targets** - Goals should be achievable but challenging
2. **Use Descriptive Titles** - Make goals clear and motivating
3. **Regular Updates** - Update manual goals frequently
4. **Celebrate Achievements** - Use the celebration feature for completed goals
5. **Multiple Goals** - Set different types of goals for variety

### 🎯 **Goal Ideas:**
- **Growth Goals:** "Reach 500 members by end of month"
- **Engagement Goals:** "Get 1000 total reactions this week"
- **Boost Goals:** "Unlock Level 2 server boosts (7 boosts needed)"
- **Event Goals:** "50 people attend our game night"
- **Custom Goals:** "Complete 25 art commissions"

### 📊 **Tracking Tips:**
- Check `/goal view` regularly to monitor progress
- Use goal IDs (#1, #2, etc.) for quick reference
- Update manual goals after events or milestones
- Delete outdated or irrelevant goals

## Troubleshooting

### Common Issues:

**Goal not auto-updating?**
- Auto-tracking only works for boosts and members
- Other goal types require manual updates with `/goal update`

**Can't see celebrations?**
- Bot needs "Send Messages" permission in announcement channels
- Celebrations go to system channel or general channels

**Goal not showing in view?**
- Deleted goals are marked inactive, not removed
- Use correct goal ID numbers
- Check if goal was deleted by another admin

**Progress bar looks wrong?**
- Progress is capped at 100% visually
- Over-achievement is tracked but displayed as 100%

## Examples & Scenarios

### Scenario 1: Boost Campaign
```
/goal set type:boosts target:20 title:"Summer Boost Drive" description:"20 boosts = special emoji pack!"
```
- Auto-tracks as users boost
- Celebrates automatically when reached
- Perfect for server perks

### Scenario 2: Member Milestone
```
/goal set type:members target:1000 description:"1000 members = server party!"
```
- Tracks joins/leaves automatically
- Updates in real-time
- Great for growth celebrations

### Scenario 3: Event Participation
```
/goal set type:events target:50 title:"Movie Night Attendance" emoji:🍿
# After event:
/goal update goal_id:3 progress:42
```
- Manual tracking for events
- Update after each event
- Perfect for community building

---

**🎉 The Goal System helps build community engagement through shared objectives and automatic celebrations!**

*Made with 🧀 by AquaCheese • Goal Tracking System*
