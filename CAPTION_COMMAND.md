# 🎭 Caption Command Documentation

## Overview
The `/caption` command creates custom memes with **intelligent auto-sizing**! The bot automatically analyzes your image dimensions and text length to choose the perfect font size. Supports up to 500 characters per text field with smart optimization.

## Usage
```
/caption image:[attachment] [top_text:<string>] [bottom_text:<string>] [font_size:<choice>]
```

## 🤖 **NEW: Intelligent Auto-Sizing**
The bot now **automatically calculates the perfect font size** by analyzing:
- **Image dimensions** and aspect ratio
- **Text length** (both top and bottom)
- **Image area** (small vs large images)
- **Aspect ratio** (wide, tall, or square images)

**Just use the default "Auto" option and let the bot optimize everything for you!**

## Parameters
- **image** (required): The image file to add text to
  - Supported formats: PNG, JPG, GIF, WebP, and other image formats
  - Maximum file size: 8MB
  - All image dimensions supported (100x100 to 1000x1000+)
- **top_text** (optional): Text to display at the top of the image
  - **Maximum: 500 characters** ✨
  - Automatically wrapped and positioned
- **bottom_text** (optional): Text to display at the bottom of the image
  - **Maximum: 500 characters** ✨  
  - Independent from top text
- **font_size** (optional): **Auto-recommended!** ✨
  - **auto**: 🤖 **Intelligent optimization** (default, recommended)
  - **tiny**: 40% size - Manual override for very long text
  - **small**: 60% size - Manual override for longer descriptions
  - **normal**: 100% size - Manual override for classic size
  - **large**: 140% size - Manual override for bold text
  - **huge**: 180% size - Manual override for maximum impact
## 🤖 How Auto-Sizing Works
The intelligent system considers multiple factors:

### 📏 **Image Analysis**
- **Small images** (under 200x200): Larger relative font for readability
- **Medium images** (200-800): Balanced font scaling
- **Large images** (800+): Proportional scaling to image size
- **Wide/tall images**: Adjusted for aspect ratio

### 📝 **Text Analysis**
- **Very short text** (<10 chars): 50% larger font for impact
- **Short text** (<20 chars): 30% larger font
- **Medium text** (20-50 chars): Normal scaling
- **Long text** (50-100 chars): 20% smaller font
- **Very long text** (100-200 chars): 35% smaller font  
- **Extremely long text** (200+ chars): 50% smaller font

### 🎯 **Smart Optimization**
- Considers both top and bottom text lengths
- Uses the longest text as the primary factor
- Ensures text never exceeds image boundaries
- Maintains minimum 10px font for readability
- Balances multiple lines with appropriate spacing

## Enhanced Features ✨
- **🤖 Automatic optimization**: Perfect font size without any guesswork
- **📏 Multi-factor analysis**: Image size + text length + aspect ratio
- **🎯 Boundary protection**: Text never goes off-screen or overlaps
- **📝 Extended character support**: Up to 500 characters per field
- **🔧 Manual override**: Still allows manual font size selection
- **📐 Smart positioning**: Dynamic text placement for multiple lines

## Examples
- `/caption image:funny_cat.jpg top_text:When you see` `bottom_text:Free food`
  *→ Auto-sizing analyzes image and chooses perfect font*

- `/caption image:long_story.png top_text:This is a very long story that goes on and on and explains exactly what happened when I tried to use the bot for the first time and it worked perfectly font_size:auto`
  *→ Auto-sizing detects long text and uses smaller font*

- `/caption image:huge_image.jpg top_text:WOW bottom_text:NICE font_size:auto`
  *→ Auto-sizing detects short text on large image and uses bigger font*

- `/caption image:wide_banner.jpg top_text:Special announcement font_size:large`
  *→ Manual override for specific design needs*

## 🎯 Auto-Sizing Examples
- **Small image + short text** → Large font (great impact)
- **Small image + long text** → Smaller font (fits nicely)  
- **Large image + short text** → Large font (fills space well)
- **Large image + long text** → Medium font (balanced)
- **Wide image + any text** → Adjusted for aspect ratio
- **Very long text** → Automatically reduced to fit perfectly

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
- Built using the Canvas library with enhanced text rendering
- ✅ **Multi-layer text rendering** for maximum visibility and contrast
- ✅ **Enhanced font system** with Fontconfig error suppression
- ✅ **Triple-fallback rendering**: Enhanced → Simple → Character-by-character
- ✅ **Adaptive font sizing** with intelligent auto-optimization
- ✅ **Universal compatibility** - works in containers and all environments
- Text positioning uses dynamic padding and advanced word wrapping
- Font fallback chain: Impact → Arial Black → Helvetica Neue → Arial → sans-serif
- Multiple rendering passes: Black outline → Stroke → White fill → Shadow enhancement
- High-quality Canvas rendering with anti-aliasing and quality optimization

## Font Setup & Troubleshooting
✅ **All Rendering Issues RESOLVED**: Enhanced multi-layer text system
- **Enhanced Rendering**: Multiple passes with thick black outlines
- **Container Support**: Fontconfig error suppression for Railway/Docker
- **Triple Fallback**: Enhanced → Simple → Character-by-character rendering
- **Font Detection**: Improved system font testing and registration
- **Error Recovery**: Graceful fallback if any rendering method fails

### Installation & Environment:
- **Railway/Docker**: ✅ Enhanced for container environments
- **Fontconfig Errors**: ✅ Automatically suppressed and handled
- **System Fonts**: ✅ Improved detection and fallback system
- **Windows**: Impact font auto-detected ✅
- **Linux**: Anton font auto-downloaded as Impact alternative ✅
- **Manual Install**: Place `impact.ttf` in the `fonts/` directory
- **Ultimate Fallback**: System Arial with enhanced rendering ✅

Use `/fontsetup` command for detailed font installation instructions.

Made with 🧀 by AquaCheese
