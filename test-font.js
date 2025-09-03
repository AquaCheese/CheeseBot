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
        
        // Fill background
        ctx.fillStyle = '#4287f5';
        ctx.fillRect(0, 0, 400, 300);
        
        // Test improved text rendering
        const fontSize = 48;
        ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Set text rendering quality
        ctx.textRenderingOptimization = 'optimizeQuality';
        ctx.imageSmoothingEnabled = true;
        
        // Function to draw text with outline
        function drawMemeText(text, x, y) {
            // Draw text outline with multiple passes
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
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
        
        drawMemeText('TEST MEME', 200, 100);
        drawMemeText('BOTTOM TEXT', 200, 200);
        
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
