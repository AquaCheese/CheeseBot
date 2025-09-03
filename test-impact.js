// Test script specifically for Impact font functionality
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

function testImpactFont() {
    console.log('🔤 Testing Impact font functionality...');
    
    const fontsDir = path.join(__dirname, 'fonts');
    const impactFontPath = path.join(fontsDir, 'impact.ttf');
    const antonFontPath = path.join(fontsDir, 'anton.ttf');
    
    console.log(`📁 Fonts directory: ${fontsDir}`);
    console.log(`📄 Impact font: ${fs.existsSync(impactFontPath) ? '✅ Found' : '❌ Missing'}`);
    console.log(`📄 Anton font: ${fs.existsSync(antonFontPath) ? '✅ Found' : '❌ Missing'}`);
    
    try {
        const canvas = createCanvas(600, 400);
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = '#4287f5';
        ctx.fillRect(0, 0, 600, 400);
        
        // Test different font configurations
        const fontSize = 48;
        const fonts = [
            'bold 48px Impact, Arial, sans-serif',
            'bold 48px "Impact", "Arial Black", Arial, sans-serif',
            'bold 48px Impact, Anton, Arial, sans-serif'
        ];
        
        let yPos = 100;
        
        fonts.forEach((font, index) => {
            console.log(`Testing font: ${font}`);
            
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const text = `IMPACT TEST ${index + 1}`;
            
            // Draw text with outline
            const outlineThickness = 3;
            for (let dx = -outlineThickness; dx <= outlineThickness; dx++) {
                for (let dy = -outlineThickness; dy <= outlineThickness; dy++) {
                    if (dx !== 0 || dy !== 0) {
                        ctx.fillStyle = 'black';
                        ctx.fillText(text, 300 + dx, yPos + dy);
                    }
                }
            }
            
            // Draw main text
            ctx.fillStyle = 'white';
            ctx.fillText(text, 300, yPos);
            
            yPos += 80;
        });
        
        // Save test image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(__dirname, 'test-impact-font.png'), buffer);
        console.log('✅ Impact font test saved as test-impact-font.png');
        
        // Test font metrics
        ctx.font = 'bold 48px Impact, Arial, sans-serif';
        const metrics = ctx.measureText('SAMPLE TEXT');
        console.log(`📏 Font metrics - Width: ${metrics.width.toFixed(2)}px`);
        
    } catch (error) {
        console.error('❌ Impact font test failed:', error);
    }
}

testImpactFont();
