# 🎭 Caption Command Documentation

## Overview
The `/caption` command allows users to create custom memes by adding text to images in the classic meme font style.

## Usage
```
/caption image:[attachment] top_text:[optional] bottom_text:[optional]
```

## Parameters
- **image** (required): The image file to add text to
  - Supports: PNG, JPG, GIF, WebP, and other image formats
  - Maximum file size: 8MB
- **top_text** (optional): Text to display at the top of the image
- **bottom_text** (optional): Text to display at the bottom of the image
- **Note**: At least one text parameter (top_text or bottom_text) must be provided

## Features
- **Classic Impact Font**: Uses the authentic Impact font for true meme styling
- **Dynamic Sizing**: Font size automatically adjusts based on image dimensions
- **Text Wrapping**: Long text automatically wraps to multiple lines
- **Uppercase Styling**: Text is automatically converted to uppercase for classic meme style
- **High Quality Output**: Generated memes are saved as PNG for best quality
- **Font Fallbacks**: Automatically falls back to Arial if Impact is not available

## Examples
- `/caption image:funny_cat.jpg top_text:When you see` `bottom_text:Free food`
- `/caption image:surprised_face.png top_text:When the bot actually works`
- `/caption image:thinking.jpg bottom_text:Big brain time`

## Limitations
- File size must be under 8MB (Discord's standard limit)
- Only image files are supported
- Processing time may vary based on image size
- Text length should be reasonable for readability

## Error Messages
- ❌ **"Please provide an image to caption"**: No image attachment provided
- ❌ **"Please provide a valid image file"**: File is not an image format
- ❌ **"Image file is too large"**: File exceeds 8MB limit
- ❌ **"Please provide at least top text or bottom text"**: No text provided
- ❌ **"An error occurred while creating the meme"**: General processing error

## Technical Details
- Built using the Canvas library for image processing
- ✅ **Enhanced Impact font system** with comprehensive fallbacks
- ✅ **Adaptive font sizing** for all image dimensions (100px to 1000px+)
- ✅ **Robust text rendering** with stroke outlines and shadow effects
- ✅ **Universal compatibility** - works with all image sizes and formats
- Text positioning uses dynamic padding and word wrapping algorithms
- Font fallback chain: Impact → Arial Black → Helvetica Neue → Arial → sans-serif
- Character-level rendering fallback for maximum compatibility
- High-quality Canvas rendering with anti-aliasing

## Font Setup & Troubleshooting
✅ **Squares Issue RESOLVED**: Enhanced font detection and fallback system
- **Primary**: Impact font (authentic meme style)
- **Fallbacks**: Multiple system fonts ensure text always renders
- **Auto-sizing**: Font size adapts to image dimensions
- **Error Recovery**: Character-by-character fallback if needed
- **Testing**: Verified across all image sizes from 100x100 to 1000x1000+

### Installation:
- **Windows**: Impact is usually pre-installed ✅
- **Manual Install**: Place `impact.ttf` in the `fonts/` directory
- **Auto Download**: Bot attempts to download Anton font as alternative
- **System Fonts**: Arial Black, Helvetica, Arial provide excellent fallbacks

Use `/fontsetup` command for detailed font installation instructions.

Made with 🧀 by AquaCheese
