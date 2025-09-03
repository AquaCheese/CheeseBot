// Test script to verify font functionality with different image sizes
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

function testImageSize(width, height, name) {
    console.log(`\n🔤 Testing ${name} (${width}x${height})...`);
    
    try {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Fill background with blue
        ctx.fillStyle = '#4287f5';
        ctx.fillRect(0, 0, width, height);
        
        // Calculate font size like in the bot
        const baseFontSize = Math.min(width / 12, height / 12);
        const fontSize = Math.max(baseFontSize, 32); // Minimum 32px
        
        console.log(`  Font size: ${fontSize}px`);
        
        ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.textRenderingOptimization = 'optimizeQuality';
        ctx.imageSmoothingEnabled = true;
        
        // Function to draw text with outline
        function drawMemeText(text, x, y) {
            const outlineThickness = Math.max(Math.floor(fontSize / 16), 2);
            
            // Draw text outline
            for (let dx = -outlineThickness; dx <= outlineThickness; dx++) {
                for (let dy = -outlineThickness; dy <= outlineThickness; dy++) {
                    if (dx !== 0 || dy !== 0) {
                        ctx.fillStyle = 'black';
                        ctx.fillText(text, x + dx, y + dy);
                    }
                }
            }
            
            // Draw main text
            ctx.fillStyle = 'white';
            ctx.fillText(text, x, y);
        }
        
        // Position text like in the bot
        const topY = Math.max(fontSize * 1.2, 50);
        const bottomY = height - Math.max(fontSize * 1.2, 50);
        
        drawMemeText('TOP TEXT', width / 2, topY);
        drawMemeText('BOTTOM TEXT', width / 2, bottomY);
        
        // Save test image
        const buffer = canvas.toBuffer('image/png');
        const filename = `test-${name.toLowerCase().replace(' ', '-')}.png`;
        fs.writeFileSync(path.join(__dirname, filename), buffer);
        console.log(`  ✅ Saved as ${filename}`);
        
    } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
    }
}

async function runTests() {
    console.log('🧪 Testing different image sizes for meme generation...');
    
    // Test different image sizes
    testImageSize(800, 600, 'Large Image');
    testImageSize(400, 300, 'Medium Image');
    testImageSize(200, 150, 'Small Image');
    testImageSize(150, 150, 'Square Small');
    testImageSize(500, 200, 'Wide Image');
    testImageSize(200, 500, 'Tall Image');
    
    console.log('\n✅ All tests completed! Check the generated PNG files.');
}

runTests().catch(console.error);
