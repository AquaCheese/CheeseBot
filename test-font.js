// Test script to verify font functionality
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

async function testFontSetup() {
    console.log('🔤 Testing font setup...');
    
    const fontsDir = path.join(__dirname, 'fonts');
    const impactFontPath = path.join(fontsDir, 'impact.ttf');
    
    console.log(`📁 Fonts directory: ${fontsDir}`);
    console.log(`📄 Impact font path: ${impactFontPath}`);
    console.log(`✅ Fonts directory exists: ${fs.existsSync(fontsDir)}`);
    console.log(`✅ Impact font exists: ${fs.existsSync(impactFontPath)}`);
    
    // Test canvas creation
    try {
        const canvas = createCanvas(400, 300);
        const ctx = canvas.getContext('2d');
        
        // Test basic text rendering
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = 'white';
        ctx.strokeText('TEST MEME', 200, 100);
        ctx.fillText('TEST MEME', 200, 100);
        
        ctx.strokeText('BOTTOM TEXT', 200, 200);
        ctx.fillText('BOTTOM TEXT', 200, 200);
        
        console.log('✅ Canvas text rendering test successful!');
        
        // Save test image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(__dirname, 'test-meme.png'), buffer);
        console.log('✅ Test meme saved as test-meme.png');
        
    } catch (error) {
        console.error('❌ Canvas test failed:', error);
    }
}

testFontSetup().catch(console.error);
