const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class CheeseClickerGame {
    constructor(database) {
        this.database = database;
        
        // Define cheese-themed upgrades (just like cookie clicker but with cheese!)
        this.upgrades = {
            'cheese_wheel': {
                name: '🧀 Cheese Wheel',
                basePrice: 15,
                cps: 0.1,
                description: 'A basic cheese wheel that slowly produces melted cheese'
            },
            'cheese_grater': {
                name: '🔪 Cheese Grater',
                basePrice: 100,
                cps: 1,
                description: 'Grates cheese automatically, increasing cheese production'
            },
            'cheese_factory': {
                name: '🏭 Cheese Factory',
                basePrice: 1100,
                cps: 8,
                description: 'An entire factory dedicated to cheese production'
            },
            'melted_cheese_fountain': {
                name: '⛲ Melted Cheese Fountain',
                basePrice: 12000,
                cps: 47,
                description: 'A beautiful fountain that flows with melted cheese'
            },
            'cheese_mine': {
                name: '⛏️ Cheese Mine',
                basePrice: 130000,
                cps: 260,
                description: 'Deep underground cheese deposits, naturally aged'
            },
            'cheese_wizard': {
                name: '🧙 Cheese Wizard',
                basePrice: 1400000,
                cps: 1400,
                description: 'A magical wizard that conjures cheese from thin air'
            },
            'cheese_portal': {
                name: '🌀 Cheese Portal',
                basePrice: 20000000,
                cps: 7800,
                description: 'A portal to the cheese dimension - infinite cheese!'
            },
            'cheese_god': {
                name: '👑 Cheese God',
                basePrice: 330000000,
                cps: 44000,
                description: 'The ultimate being of cheese - worshipped by all dairy'
            }
        };
    }

    // Calculate upgrade price based on quantity owned (gets more expensive)
    getUpgradePrice(upgradeId, currentQuantity) {
        const basePrice = this.upgrades[upgradeId].basePrice;
        return Math.floor(basePrice * Math.pow(1.15, currentQuantity));
    }

    // Calculate total CPS from all upgrades
    calculateTotalCPS(upgrades) {
        let totalCPS = 0;
        for (const upgrade of upgrades) {
            const upgradeData = this.upgrades[upgrade.upgrade_id];
            if (upgradeData) {
                totalCPS += upgradeData.cps * upgrade.quantity;
            }
        }
        return totalCPS;
    }

    // Apply passive cheese generation based on time passed
    async applyPassiveGeneration(userId, guildId) {
        const player = await this.database.getCheeseClickerPlayer(userId, guildId);
        if (!player) return null;

        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = currentTime - (player.last_updated || currentTime);
        
        // Don't apply more than 24 hours of passive generation
        const maxTime = 24 * 60 * 60; // 24 hours in seconds
        const actualTime = Math.min(timeDiff, maxTime);
        
        const passiveCheese = player.cheese_per_second * actualTime;
        const newCheeseCount = player.cheese_count + passiveCheese;

        await this.database.updateCheeseClickerPlayer(userId, guildId, {
            cheese_count: newCheeseCount,
            last_updated: currentTime
        });

        return {
            ...player,
            cheese_count: newCheeseCount,
            passive_gained: passiveCheese,
            time_away: actualTime
        };
    }

    // Handle clicking cheese
    async clickCheese(userId, guildId, clickCount = 1) {
        let player = await this.database.getCheeseClickerPlayer(userId, guildId);
        
        if (!player) {
            await this.database.createCheeseClickerPlayer(userId, guildId);
            player = await this.database.getCheeseClickerPlayer(userId, guildId);
        }

        // Apply passive generation first
        await this.applyPassiveGeneration(userId, guildId);
        player = await this.database.getCheeseClickerPlayer(userId, guildId);

        const cheeseGained = player.cheese_per_click * clickCount;
        const newCheeseCount = player.cheese_count + cheeseGained;
        const newTotalClicked = player.total_cheese_clicked + cheeseGained;

        await this.database.updateCheeseClickerPlayer(userId, guildId, {
            cheese_count: newCheeseCount,
            total_cheese_clicked: newTotalClicked
        });

        return {
            cheese_gained: cheeseGained,
            new_total: newCheeseCount
        };
    }

    // Buy an upgrade
    async buyUpgrade(userId, guildId, upgradeId, quantity = 1) {
        const player = await this.database.getCheeseClickerPlayer(userId, guildId);
        if (!player) return { success: false, error: 'Player not found' };

        // Apply passive generation first
        await this.applyPassiveGeneration(userId, guildId);
        const updatedPlayer = await this.database.getCheeseClickerPlayer(userId, guildId);

        const upgrades = await this.database.getCheeseClickerUpgrades(userId, guildId);
        const currentUpgrade = upgrades.find(u => u.upgrade_id === upgradeId);
        const currentQuantity = currentUpgrade ? currentUpgrade.quantity : 0;

        let totalCost = 0;
        for (let i = 0; i < quantity; i++) {
            totalCost += this.getUpgradePrice(upgradeId, currentQuantity + i);
        }

        if (updatedPlayer.cheese_count < totalCost) {
            return { 
                success: false, 
                error: 'Not enough cheese!', 
                required: totalCost, 
                current: updatedPlayer.cheese_count 
            };
        }

        // Purchase the upgrade
        const newQuantity = currentQuantity + quantity;
        await this.database.updateCheeseClickerUpgrade(userId, guildId, upgradeId, newQuantity);

        // Update player's cheese count and recalculate CPS
        const newCheeseCount = updatedPlayer.cheese_count - totalCost;
        const allUpgrades = await this.database.getCheeseClickerUpgrades(userId, guildId);
        const newCPS = this.calculateTotalCPS(allUpgrades);

        await this.database.updateCheeseClickerPlayer(userId, guildId, {
            cheese_count: newCheeseCount,
            cheese_per_second: newCPS
        });

        return {
            success: true,
            upgrade: this.upgrades[upgradeId],
            quantity_bought: quantity,
            cost: totalCost,
            new_total: newQuantity,
            new_cheese_count: newCheeseCount,
            new_cps: newCPS
        };
    }

    // Format large numbers (like in cookie clicker)
    formatNumber(num) {
        if (num < 1000) return Math.floor(num).toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num < 1000000000000000) return (num / 1000000000000).toFixed(1) + 'T';
        return (num / 1000000000000000).toFixed(1) + 'Q';
    }

    // Format time duration
    formatTime(seconds) {
        if (seconds < 60) return `${Math.floor(seconds)} seconds`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
        return `${Math.floor(seconds / 86400)} days`;
    }

    // Create the main game embed
    async createGameEmbed(userId, guildId, member) {
        let player = await this.database.getCheeseClickerPlayer(userId, guildId);
        
        if (!player) {
            await this.database.createCheeseClickerPlayer(userId, guildId);
            player = await this.database.getCheeseClickerPlayer(userId, guildId);
        }

        // Apply passive generation
        const updatedPlayer = await this.applyPassiveGeneration(userId, guildId);
        if (updatedPlayer) player = updatedPlayer;

        const upgrades = await this.database.getCheeseClickerUpgrades(userId, guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('🧀 Cheese Clicker Game')
            .setDescription(`Welcome to the cheesiest game ever, ${member.displayName}!`)
            .setColor(0xFFD700) // Gold color like cheese
            .addFields(
                {
                    name: '🧀 Total Cheese',
                    value: this.formatNumber(player.cheese_count),
                    inline: true
                },
                {
                    name: '🔥 Cheese per Second',
                    value: this.formatNumber(player.cheese_per_second),
                    inline: true
                },
                {
                    name: '👆 Cheese per Click',
                    value: this.formatNumber(player.cheese_per_click),
                    inline: true
                },
                {
                    name: '📊 Total Cheese Clicked',
                    value: this.formatNumber(player.total_cheese_clicked),
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Click the buttons below to play!' });

        // Add passive generation info if player was away
        if (player.passive_gained && player.passive_gained > 0) {
            embed.addFields({
                name: '💰 Welcome Back!',
                value: `You were away for ${this.formatTime(player.time_away)} and gained ${this.formatNumber(player.passive_gained)} cheese!`,
                inline: false
            });
        }

        // Show some upgrades
        if (upgrades.length > 0) {
            const upgradeText = upgrades
                .filter(u => u.quantity > 0)
                .map(u => {
                    const upgradeData = this.upgrades[u.upgrade_id];
                    return `${upgradeData.name}: ${u.quantity}`;
                })
                .slice(0, 5) // Show max 5 upgrades
                .join('\n');
            
            if (upgradeText) {
                embed.addFields({
                    name: '🏪 Your Upgrades',
                    value: upgradeText,
                    inline: false
                });
            }
        }

        return embed;
    }

    // Create upgrade shop embed
    async createShopEmbed(userId, guildId) {
        const player = await this.database.getCheeseClickerPlayer(userId, guildId);
        const upgrades = await this.database.getCheeseClickerUpgrades(userId, guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('🏪 Cheese Shop')
            .setDescription('Buy upgrades to increase your cheese production!')
            .setColor(0x87CEEB) // Sky blue
            .addFields({
                name: '💰 Your Cheese',
                value: this.formatNumber(player.cheese_count),
                inline: true
            });

        // Show first 8 upgrades
        const upgradeIds = Object.keys(this.upgrades).slice(0, 8);
        for (const upgradeId of upgradeIds) {
            const upgradeData = this.upgrades[upgradeId];
            const currentUpgrade = upgrades.find(u => u.upgrade_id === upgradeId);
            const currentQuantity = currentUpgrade ? currentUpgrade.quantity : 0;
            const price = this.getUpgradePrice(upgradeId, currentQuantity);
            
            const canAfford = player.cheese_count >= price ? '✅' : '❌';
            
            embed.addFields({
                name: `${upgradeData.name} ${canAfford}`,
                value: `Cost: ${this.formatNumber(price)} cheese\nOwned: ${currentQuantity}\nCPS: +${upgradeData.cps}/sec\n${upgradeData.description}`,
                inline: true
            });
        }

        return embed;
    }

    // Create main game buttons
    createGameButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cheese_click')
                    .setLabel('🧀 Click Cheese!')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('cheese_shop')
                    .setLabel('🏪 Shop')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('cheese_stats')
                    .setLabel('📊 Stats')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('cheese_leaderboard')
                    .setLabel('🏆 Leaderboard')
                    .setStyle(ButtonStyle.Success)
            );
    }

    // Create shop buttons (for buying upgrades)
    createShopButtons(upgradeIds = ['cheese_wheel', 'cheese_grater', 'cheese_factory', 'melted_cheese_fountain']) {
        const buttons = upgradeIds.map(upgradeId => {
            const upgradeData = this.upgrades[upgradeId];
            return new ButtonBuilder()
                .setCustomId(`buy_${upgradeId}`)
                .setLabel(`Buy ${upgradeData.name}`)
                .setStyle(ButtonStyle.Primary);
        });

        // Add a back button
        buttons.push(
            new ButtonBuilder()
                .setCustomId('cheese_back')
                .setLabel('🔙 Back')
                .setStyle(ButtonStyle.Secondary)
        );

        return new ActionRowBuilder().addComponents(buttons.slice(0, 5)); // Max 5 buttons per row
    }

    // Create stats embed
    async createStatsEmbed(userId, guildId, member) {
        const player = await this.database.getCheeseClickerPlayer(userId, guildId);
        const upgrades = await this.database.getCheeseClickerUpgrades(userId, guildId);
        
        if (!player) {
            return new EmbedBuilder()
                .setTitle('📊 Your Cheese Stats')
                .setDescription('You haven\'t started playing yet! Use the main game to start.')
                .setColor(0xFF6B6B);
        }

        const totalUpgrades = upgrades.reduce((sum, u) => sum + u.quantity, 0);
        const playTime = Math.floor(Date.now() / 1000) - Math.floor(new Date(player.created_at).getTime() / 1000);
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${member.displayName}'s Cheese Stats`)
            .setDescription('Your complete cheese clicker statistics!')
            .setColor(0x4ECDC4)
            .addFields(
                {
                    name: '🧀 Current Cheese',
                    value: this.formatNumber(player.cheese_count),
                    inline: true
                },
                {
                    name: '📈 Total Cheese Clicked',
                    value: this.formatNumber(player.total_cheese_clicked),
                    inline: true
                },
                {
                    name: '⚡ Cheese per Second',
                    value: this.formatNumber(player.cheese_per_second),
                    inline: true
                },
                {
                    name: '👆 Cheese per Click',
                    value: this.formatNumber(player.cheese_per_click),
                    inline: true
                },
                {
                    name: '🏪 Total Upgrades',
                    value: totalUpgrades.toString(),
                    inline: true
                },
                {
                    name: '⏰ Playing Since',
                    value: this.formatTime(playTime),
                    inline: true
                }
            )
            .setTimestamp();

        // Show owned upgrades
        const ownedUpgrades = upgrades
            .filter(u => u.quantity > 0)
            .map(u => {
                const upgradeData = this.upgrades[u.upgrade_id];
                return `${upgradeData.name}: ${u.quantity}`;
            })
            .join('\n');

        if (ownedUpgrades) {
            embed.addFields({
                name: '🏆 Your Upgrades',
                value: ownedUpgrades,
                inline: false
            });
        }

        return embed;
    }

    // Create leaderboard embed
    async createLeaderboardEmbed(guildId, guild) {
        const leaderboard = await this.database.getCheeseClickerLeaderboard(guildId, 10);
        
        if (leaderboard.length === 0) {
            return new EmbedBuilder()
                .setTitle('🏆 Cheese Leaderboard')
                .setDescription('No players yet! Be the first to start clicking cheese!')
                .setColor(0xF39C12);
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 ${guild.name} Cheese Leaderboard`)
            .setDescription('Top cheese clickers in this server!')
            .setColor(0xE67E22);

        for (let i = 0; i < leaderboard.length; i++) {
            const player = leaderboard[i];
            const member = await guild.members.fetch(player.user_id).catch(() => null);
            const username = member ? member.displayName : 'Unknown User';
            
            const trophy = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            
            embed.addFields({
                name: `${trophy} ${username}`,
                value: `🧀 ${this.formatNumber(player.cheese_count)} cheese\n⚡ ${this.formatNumber(player.cheese_per_second)} CPS\n📊 ${this.formatNumber(player.total_cheese_clicked)} total`,
                inline: true
            });
        }

        return embed;
    }
}

module.exports = CheeseClickerGame;