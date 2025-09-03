# 🎭 Caption Command Documentation

## Overview
The `/caption` command allows users to create custom memes by adding text to images in the classic meme font style. **NEW**: Now supports up to 500 characters per text field and 5 different font sizes!

## Usage
```
/caption image:[attachment] top_text:[optional] bottom_text:[optional] font_size:[optional]
```

## Parameters
- **image** (required): The image file to add text to
  - Supports: PNG, JPG, GIF, WebP, and other image formats
  - Maximum file size: 8MB
  - All image dimensions supported (100x100 to 1000x1000+)
- **top_text** (optional): Text to display at the top of the image
  - **Maximum: 500 characters** ✨
  - Automatically wrapped and positioned
- **bottom_text** (optional): Text to display at the bottom of the image
  - **Maximum: 500 characters** ✨  
  - Independent from top text
- **font_size** (optional): Choose your preferred font size ✨
  - **tiny**: 40% size - For very long text passages
  - **small**: 60% size - For longer descriptions
  - **normal**: 100% size - Classic meme text (default)
  - **large**: 140% size - Bold, attention-grabbing
  - **huge**: 180% size - Maximum impact
- **Note**: At least one text parameter (top_text or bottom_text) must be provided

## Enhanced Features ✨
- **Extended Character Support**: Up to 500 characters per text field
- **Smart Font Sizing**: 5 size options from tiny (40%) to huge (180%)
- **Advanced Word Wrapping**: Automatically breaks long words and optimizes layout
- **Dynamic Text Positioning**: Adapts to accommodate multiple lines of text
- **Optimized Line Spacing**: Better readability for different font sizes and text lengths

## Examples
- `/caption image:funny_cat.jpg top_text:When you see font_size:normal` `bottom_text:Free food`
- `/caption image:surprised_face.png top_text:When the bot actually works with all these new features font_size:small`
- `/caption image:thinking.jpg bottom_text:Big brain time font_size:huge`
- `/caption image:long_story.png top_text:This is a very long story about how I discovered that the caption command now supports up to 500 characters which means I can write entire paragraphs of text and it will automatically wrap to multiple lines font_size:tiny`

## Font Size Comparison
- **Tiny**: Perfect for paragraphs and very detailed explanations
- **Small**: Great for longer captions that need more space
- **Normal**: The classic meme text size everyone knows and loves
- **Large**: Makes your text pop and grab attention
- **Huge**: For maximum impact with short, powerful phrases

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
