// Quick test for YouTube functionality
const Database = require('./database.js');

async function testYouTube() {
    const db = new Database();
    
    console.log('🧪 Testing YouTube functionality...');
    
    // Test creating config
    const testGuildId = 'test123';
    const testChannelId = 'test_channel';
    
    try {
        console.log('1. Creating server config...');
        await db.createServerConfig(testGuildId, { youtube_channel_id: testChannelId });
        
        console.log('2. Retrieving config...');
        const config = await db.getServerConfig(testGuildId);
        console.log('Config:', config);
        
        if (config && config.youtube_channel_id === testChannelId) {
            console.log('✅ YouTube setup working correctly!');
        } else {
            console.log('❌ YouTube setup failed - channel ID not found');
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    // Clean up
    await db.deleteServerConfig(testGuildId);
    console.log('🧹 Test cleanup complete');
}

testYouTube();
