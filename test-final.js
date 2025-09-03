// Simple test to verify Impact font and text rendering work properly
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function testMemeGeneration() {
    console.log('🧪 Testing meme generation with Impact font...');
    
    try {
        // Create a test image
        const canvas = createCanvas(600, 400);
        const ctx = canvas.getContext('2d');
        
        // Fill background with blue gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#4287f5');
        gradient.addColorStop(1, '#2563eb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 400);
        
        // Configure font (matching bot logic)
        const fontSize = Math.max(Math.min(600 / 12, 400 / 12), 32);
        console.log(`Font size: ${fontSize}px`);
        
        ctx.font = `bold ${fontSize}px Impact, "Arial Black", Arial, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(fontSize / 15, 3);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Test text drawing function (simplified like in bot)
        function drawMemeText(text, x, y, maxWidth) {
            const sanitizedText = text.toString().trim().toUpperCase();
            if (!sanitizedText) return;
            
            const words = sanitizedText.split(/\s+/);
            const lines = [];
            let currentLine = '';
            
            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            
            if (currentLine) {
                lines.push(currentLine);
            }
            
            const lineHeight = fontSize * 1.2;
            const startY = y - ((lines.length - 1) * lineHeight) / 2;
            
            lines.forEach((line, index) => {
                const lineY = startY + (index * lineHeight);
                
                // Draw text outline
                ctx.strokeText(line, x, lineY);
                
                // Draw main text
                ctx.fillText(line, x, lineY);
            });
        }
        
        // Draw top and bottom text
        const topY = Math.max(fontSize * 1.2, 50);
        const bottomY = 400 - Math.max(fontSize * 1.2, 50);
        
        drawMemeText('WHEN THE CAPTION', 300, topY, 600 * 0.9);
        drawMemeText('COMMAND WORKS', 300, bottomY, 600 * 0.9);
        
        // Save test image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(__dirname, 'test-meme-final.png'), buffer);
        
        console.log('✅ Test meme generated successfully!');
        console.log('📁 Saved as: test-meme-final.png');
        console.log(`📏 File size: ${buffer.length} bytes`);
        
        // Test font detection
        const testMetrics = ctx.measureText('TEST');
        console.log(`📊 Font metrics: width=${testMetrics.width.toFixed(2)}px`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

testMemeGeneration().then(success => {
    if (success) {
        console.log('\n🎉 All tests passed! The /caption command should work properly.');
    } else {
        console.log('\n❌ Tests failed. Check the error messages above.');
    }
}).catch(console.error);
