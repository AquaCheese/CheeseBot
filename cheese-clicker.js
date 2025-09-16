const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class CheeseClicker {
    constructor(database) {
        this.database = database;
        this.initializeTables();
    }

    async initializeTables() {
        // Create cheese clicker user data table
        this.database.db.prepare(`
            CREATE TABLE IF NOT EXISTS cheese_clicker_users (
                user_id TEXT PRIMARY KEY,
                cheese_count REAL DEFAULT 0,
                cheese_per_second REAL DEFAULT 0,
                total_cheese_earned REAL DEFAULT 0,
                total_clicks INTEGER DEFAULT 0,
                last_updated INTEGER DEFAULT (strftime('%s', 'now')),
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
        `).run();

        // Create cheese clicker upgrades table
        this.database.db.prepare(`
            CREATE TABLE IF NOT EXISTS cheese_clicker_upgrades (
                user_id TEXT,
                upgrade_type TEXT,
                quantity INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, upgrade_type),
                FOREIGN KEY (user_id) REFERENCES cheese_clicker_users(user_id)
            )
        `).run();

        console.log('✅ Cheese clicker tables initialized');
    }

    // Upgrade definitions with cheese theme
    getUpgradeDefinitions() {
        return [
            {
                id: 'cursor',
                name: '🧀 Cheese Cursor',
                description: 'Clicks automatically',
                baseCost: 15,
                baseProduction: 0.1,
                costMultiplier: 1.15
            },
            {
                id: 'grandma',
                name: '👵 Cheese Grandma',
                description: 'Bakes cheese cookies',
                baseCost: 100,
                baseProduction: 1,
                costMultiplier: 1.15
            },
            {
                id: 'farm',
                name: '🐄 Cheese Farm',
                description: 'Milks cows for cheese',
                baseCost: 1100,
                baseProduction: 8,
                costMultiplier: 1.15
            },
            {
                id: 'mine',
                name: '⛏️ Cheddar Mine',
                description: 'Mines aged cheddar',
                baseCost: 12000,
                baseProduction: 47,
                costMultiplier: 1.15
            },
            {
                id: 'factory',
                name: '🏭 Cheese Factory',
                description: 'Mass produces cheese',
                baseCost: 130000,
                baseProduction: 260,
                costMultiplier: 1.15
            },
            {
                id: 'bank',
                name: '🏦 Cheese Bank',
                description: 'Invests in cheese futures',
                baseCost: 1400000,
                baseProduction: 1400,
                costMultiplier: 1.15
            },
            {
                id: 'temple',
                name: '🏛️ Cheese Temple',
                description: 'Summons cheese from gods',
                baseCost: 20000000,
                baseProduction: 7800,
                costMultiplier: 1.15
            },
            {
                id: 'wizard',
                name: '🧙‍♂️ Cheese Wizard Tower',
                description: 'Transmutes elements to cheese',
                baseCost: 330000000,
                baseProduction: 44000,
                costMultiplier: 1.15
            },
            {
                id: 'shipment',
                name: '🚢 Cheese Shipment',
                description: 'Imports cheese from space',
                baseCost: 5100000000,
                baseProduction: 260000,
                costMultiplier: 1.15
            },
            {
                id: 'machine',
                name: '🤖 Cheese Machine',
                description: 'Alchemical cheese creation',
                baseCost: 75000000000,
                baseProduction: 1600000,
                costMultiplier: 1.15
            },
            {
                id: 'portal',
                name: '🌀 Cheese Portal',
                description: 'Interdimensional cheese',
                baseCost: 1000000000000,
                baseProduction: 10000000,
                costMultiplier: 1.15
            },
            {
                id: 'condenser',
                name: '⚗️ Cheese Condenser',
                description: 'Condenses time into cheese',
                baseCost: 14000000000000,
                baseProduction: 65000000,
                costMultiplier: 1.15
            },
            {
                id: 'prism',
                name: '💎 Cheese Prism',
                description: 'Converts light to cheese',
                baseCost: 170000000000000,
                baseProduction: 430000000,
                costMultiplier: 1.15
            },
            {
                id: 'chancemaker',
                name: '🎲 Cheese Chancemaker',
                description: 'Bends probability for cheese',
                baseCost: 2100000000000000,
                baseProduction: 2900000000,
                costMultiplier: 1.15
            },
            {
                id: 'javascript',
                name: '💻 Cheese JavaScript Console',
                description: 'console.log("cheese")',
                baseCost: 26000000000000000,
                baseProduction: 21000000000,
                costMultiplier: 1.15
            }
        ];
    }

    // Get user's cheese clicker data
    async getUserData(userId) {
        const userData = this.database.db.prepare(`
            SELECT * FROM cheese_clicker_users WHERE user_id = ?
        `).get(userId);

        if (!userData) {
            // Create new user
            this.database.db.prepare(`
                INSERT INTO cheese_clicker_users (user_id) VALUES (?)
            `).run(userId);

            return {
                user_id: userId,
                cheese_count: 0,
                cheese_per_second: 0,
                total_cheese_earned: 0,
                total_clicks: 0,
                last_updated: Math.floor(Date.now() / 1000),
                created_at: Math.floor(Date.now() / 1000)
            };
        }

        return userData;
    }

    // Get user's upgrades
    async getUserUpgrades(userId) {
        const upgrades = this.database.db.prepare(`
            SELECT upgrade_type, quantity FROM cheese_clicker_upgrades WHERE user_id = ?
        `).all(userId);

        const upgradeMap = {};
        for (const upgrade of upgrades) {
            upgradeMap[upgrade.upgrade_type] = upgrade.quantity;
        }

        return upgradeMap;
    }

    // Update user's cheese based on passive income
    async updatePassiveCheese(userId) {
        const userData = await this.getUserData(userId);
        const now = Math.floor(Date.now() / 1000);
        const timeDiff = now - userData.last_updated;

        if (timeDiff > 0 && userData.cheese_per_second > 0) {
            // Cap offline earnings to 24 hours
            const maxOfflineTime = 24 * 60 * 60; // 24 hours
            const effectiveTime = Math.min(timeDiff, maxOfflineTime);
            const passiveCheese = userData.cheese_per_second * effectiveTime;

            this.database.db.prepare(`
                UPDATE cheese_clicker_users 
                SET cheese_count = cheese_count + ?, 
                    total_cheese_earned = total_cheese_earned + ?,
                    last_updated = ?
                WHERE user_id = ?
            `).run(passiveCheese, passiveCheese, now, userId);

            return passiveCheese;
        }

        return 0;
    }

    // Click cheese (manual earning)
    async clickCheese(userId, clickPower = 1) {
        await this.updatePassiveCheese(userId);

        this.database.db.prepare(`
            UPDATE cheese_clicker_users 
            SET cheese_count = cheese_count + ?,
                total_cheese_earned = total_cheese_earned + ?,
                total_clicks = total_clicks + 1,
                last_updated = ?
            WHERE user_id = ?
        `).run(clickPower, clickPower, Math.floor(Date.now() / 1000), userId);

        return clickPower;
    }

    // Calculate current upgrade cost
    calculateUpgradeCost(upgradeType, currentQuantity) {
        const upgradeDef = this.getUpgradeDefinitions().find(u => u.id === upgradeType);
        if (!upgradeDef) return null;

        return Math.floor(upgradeDef.baseCost * Math.pow(upgradeDef.costMultiplier, currentQuantity));
    }

    // Buy upgrade
    async buyUpgrade(userId, upgradeType) {
        await this.updatePassiveCheese(userId);
        
        const userData = await this.getUserData(userId);
        const upgrades = await this.getUserUpgrades(userId);
        const currentQuantity = upgrades[upgradeType] || 0;
        
        const cost = this.calculateUpgradeCost(upgradeType, currentQuantity);
        const upgradeDef = this.getUpgradeDefinitions().find(u => u.id === upgradeType);
        
        if (!upgradeDef || userData.cheese_count < cost) {
            return { success: false, reason: 'insufficient_cheese' };
        }

        // Deduct cost and add upgrade
        this.database.db.prepare(`
            UPDATE cheese_clicker_users 
            SET cheese_count = cheese_count - ?,
                last_updated = ?
            WHERE user_id = ?
        `).run(cost, Math.floor(Date.now() / 1000), userId);

        // Add or update upgrade
        this.database.db.prepare(`
            INSERT OR REPLACE INTO cheese_clicker_upgrades (user_id, upgrade_type, quantity)
            VALUES (?, ?, ?)
        `).run(userId, upgradeType, currentQuantity + 1);

        // Recalculate cheese per second
        await this.recalculateCheesePerSecond(userId);

        return { 
            success: true, 
            cost: cost,
            newQuantity: currentQuantity + 1,
            upgradeName: upgradeDef.name
        };
    }

    // Recalculate total cheese per second
    async recalculateCheesePerSecond(userId) {
        const upgrades = await this.getUserUpgrades(userId);
        const upgradeDefinitions = this.getUpgradeDefinitions();
        
        let totalCheesePerSecond = 0;

        for (const upgradeDef of upgradeDefinitions) {
            const quantity = upgrades[upgradeDef.id] || 0;
            totalCheesePerSecond += upgradeDef.baseProduction * quantity;
        }

        this.database.db.prepare(`
            UPDATE cheese_clicker_users 
            SET cheese_per_second = ?,
                last_updated = ?
            WHERE user_id = ?
        `).run(totalCheesePerSecond, Math.floor(Date.now() / 1000), userId);

        return totalCheesePerSecond;
    }

    // Format large numbers
    formatNumber(num) {
        const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
        const absNum = Math.abs(num);
        
        if (absNum < 1000) {
            return Math.floor(num).toLocaleString();
        }
        
        const exp = Math.floor(Math.log10(absNum) / 3);
        const suffix = suffixes[Math.min(exp, suffixes.length - 1)];
        const scaled = num / Math.pow(1000, exp);
        
        return scaled.toFixed(2).replace(/\.00$/, '') + suffix;
    }

    // Create main game embed
    async createGameEmbed(userId) {
        const passiveCheese = await this.updatePassiveCheese(userId);
        const userData = await this.getUserData(userId);
        const upgrades = await this.getUserUpgrades(userId);
        const upgradeDefinitions = this.getUpgradeDefinitions();

        const embed = new EmbedBuilder()
            .setTitle('🧀 **CHEESE CLICKER** 🧀')
            .setColor(0xFFD700)
            .setDescription(`Welcome to the ultimate cheese empire!`)
            .addFields(
                {
                    name: '🧀 **Your Cheese**',
                    value: `**${this.formatNumber(userData.cheese_count)}** cheese${passiveCheese > 0 ? `\n(+${this.formatNumber(passiveCheese)} while away!)` : ''}`,
                    inline: true
                },
                {
                    name: '⚡ **Cheese per Second**',
                    value: `**${this.formatNumber(userData.cheese_per_second)}/sec**`,
                    inline: true
                },
                {
                    name: '📊 **Stats**',
                    value: `🎯 **Clicks:** ${userData.total_clicks.toLocaleString()}\n💰 **Total Earned:** ${this.formatNumber(userData.total_cheese_earned)}`,
                    inline: true
                }
            );

        // Add upgrade overview
        let upgradeText = '';
        let totalUpgrades = 0;
        
        for (const upgradeDef of upgradeDefinitions.slice(0, 8)) { // Show first 8 upgrades
            const quantity = upgrades[upgradeDef.id] || 0;
            totalUpgrades += quantity;
            if (quantity > 0) {
                upgradeText += `${upgradeDef.name}: **${quantity}**\n`;
            }
        }

        if (upgradeText === '') {
            upgradeText = 'No upgrades yet! Start clicking!';
        }

        embed.addFields({
            name: '🏭 **Your Cheese Empire**',
            value: upgradeText.slice(0, 1024),
            inline: false
        });

        embed.setFooter({ 
            text: `🧀 CheeseBot • Total Upgrades: ${totalUpgrades} • Click the button to get cheese!` 
        });

        return embed;
    }

    // Create upgrade shop embed
    async createShopEmbed(userId, page = 0) {
        await this.updatePassiveCheese(userId);
        const userData = await this.getUserData(userId);
        const upgrades = await this.getUserUpgrades(userId);
        const upgradeDefinitions = this.getUpgradeDefinitions();

        const itemsPerPage = 5;
        const totalPages = Math.ceil(upgradeDefinitions.length / itemsPerPage);
        const startIndex = page * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, upgradeDefinitions.length);

        const embed = new EmbedBuilder()
            .setTitle('🛒 **CHEESE SHOP** 🛒')
            .setColor(0xFFA500)
            .setDescription(`**Your Cheese:** ${this.formatNumber(userData.cheese_count)}\n\nPage ${page + 1}/${totalPages}`);

        for (let i = startIndex; i < endIndex; i++) {
            const upgradeDef = upgradeDefinitions[i];
            const currentQuantity = upgrades[upgradeDef.id] || 0;
            const cost = this.calculateUpgradeCost(upgradeDef.id, currentQuantity);
            const canAfford = userData.cheese_count >= cost;

            embed.addFields({
                name: `${upgradeDef.name} ${canAfford ? '✅' : '❌'}`,
                value: `${upgradeDef.description}\n` +
                       `**Owned:** ${currentQuantity}\n` +
                       `**Produces:** ${this.formatNumber(upgradeDef.baseProduction)}/sec\n` +
                       `**Cost:** ${this.formatNumber(cost)} cheese`,
                inline: true
            });
        }

        embed.setFooter({ 
            text: '🧀 CheeseBot Shop • Use buttons to buy upgrades!' 
        });

        return embed;
    }

    // Create action buttons for the game
    createGameButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cheese_click')
                    .setLabel('🧀 Click Cheese!')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('cheese_shop')
                    .setLabel('🛒 Shop')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('cheese_stats')
                    .setLabel('📊 Stats')
                    .setStyle(ButtonStyle.Secondary)
            );
    }

    // Create shop buttons
    createShopButtons(page = 0) {
        const upgradeDefinitions = this.getUpgradeDefinitions();
        const totalPages = Math.ceil(upgradeDefinitions.length / 5);
        
        const rows = [];
        
        // Upgrade buttons (first 5 for current page)
        const startIndex = page * 5;
        const upgradeButtons = [];
        
        for (let i = 0; i < 5 && (startIndex + i) < upgradeDefinitions.length; i++) {
            const upgrade = upgradeDefinitions[startIndex + i];
            upgradeButtons.push(
                new ButtonBuilder()
                    .setCustomId(`buy_${upgrade.id}`)
                    .setLabel(`Buy ${upgrade.name.split(' ')[1]}`) // Just the emoji and first word
                    .setStyle(ButtonStyle.Success)
            );
        }
        
        if (upgradeButtons.length > 0) {
            rows.push(new ActionRowBuilder().addComponents(upgradeButtons));
        }
        
        // Navigation buttons
        const navButtons = [];
        
        if (page > 0) {
            navButtons.push(
                new ButtonBuilder()
                    .setCustomId(`shop_page_${page - 1}`)
                    .setLabel('⬅️ Previous')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        navButtons.push(
            new ButtonBuilder()
                .setCustomId('cheese_game')
                .setLabel('🧀 Back to Game')
                .setStyle(ButtonStyle.Primary)
        );
        
        if (page < totalPages - 1) {
            navButtons.push(
                new ButtonBuilder()
                    .setCustomId(`shop_page_${page + 1}`)
                    .setLabel('Next ➡️')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        rows.push(new ActionRowBuilder().addComponents(navButtons));
        
        return rows;
    }

    // Create stats embed
    async createStatsEmbed(userId) {
        await this.updatePassiveCheese(userId);
        const userData = await this.getUserData(userId);
        const upgrades = await this.getUserUpgrades(userId);
        const upgradeDefinitions = this.getUpgradeDefinitions();

        let totalUpgrades = 0;
        let totalInvestment = 0;

        for (const upgradeDef of upgradeDefinitions) {
            const quantity = upgrades[upgradeDef.id] || 0;
            totalUpgrades += quantity;
            
            // Calculate total spent on this upgrade type
            for (let i = 0; i < quantity; i++) {
                totalInvestment += this.calculateUpgradeCost(upgradeDef.id, i);
            }
        }

        const timePlayed = Math.floor(Date.now() / 1000) - userData.created_at;
        const hoursPlayed = Math.floor(timePlayed / 3600);
        const daysPlayed = Math.floor(hoursPlayed / 24);

        const embed = new EmbedBuilder()
            .setTitle('📊 **CHEESE STATISTICS** 📊')
            .setColor(0x00FF00)
            .addFields(
                {
                    name: '🧀 **Cheese Statistics**',
                    value: `**Current Cheese:** ${this.formatNumber(userData.cheese_count)}\n` +
                           `**Total Earned:** ${this.formatNumber(userData.total_cheese_earned)}\n` +
                           `**Cheese per Second:** ${this.formatNumber(userData.cheese_per_second)}`,
                    inline: true
                },
                {
                    name: '🎯 **Activity Statistics**',
                    value: `**Total Clicks:** ${userData.total_clicks.toLocaleString()}\n` +
                           `**Time Played:** ${daysPlayed}d ${hoursPlayed % 24}h\n` +
                           `**Avg per Click:** ${this.formatNumber(userData.total_clicks > 0 ? userData.total_cheese_earned / userData.total_clicks : 0)}`,
                    inline: true
                },
                {
                    name: '🏭 **Empire Statistics**',
                    value: `**Total Upgrades:** ${totalUpgrades}\n` +
                           `**Total Investment:** ${this.formatNumber(totalInvestment)}\n` +
                           `**Efficiency:** ${this.formatNumber(totalInvestment > 0 ? userData.cheese_per_second / totalInvestment * 100 : 0)}%`,
                    inline: true
                }
            );

        // Add detailed upgrade breakdown
        let upgradeBreakdown = '';
        for (const upgradeDef of upgradeDefinitions) {
            const quantity = upgrades[upgradeDef.id] || 0;
            if (quantity > 0) {
                const production = upgradeDef.baseProduction * quantity;
                upgradeBreakdown += `${upgradeDef.name}: ${quantity} (${this.formatNumber(production)}/sec)\n`;
            }
        }

        if (upgradeBreakdown) {
            embed.addFields({
                name: '🏭 **Detailed Breakdown**',
                value: upgradeBreakdown.slice(0, 1024),
                inline: false
            });
        }

        embed.setFooter({ 
            text: '🧀 CheeseBot Statistics • Keep clicking for more cheese!' 
        });

        return embed;
    }
}

module.exports = CheeseClicker;