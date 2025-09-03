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
- Uses authentic Impact font for classic meme styling
- Supports all image formats supported by the Canvas library
- Text rendering uses multiple shadow passes for bold black outline effect
- Automatic text positioning and sizing algorithms
- Font fallback system: Impact → Anton → Arial Black → Arial
- Minimum font size of 32px ensures readability on all image sizes

## Font Setup
For the best meme experience, the bot uses Impact font:
- **Windows**: Impact is usually pre-installed
- **Manual Install**: Place `impact.ttf` in the `fonts/` directory
- **Auto Download**: Bot attempts to download Anton font as alternative
- **Fallbacks**: System fonts provide good alternatives

Use `/fontsetup` command for detailed font installation instructions.

Made with 🧀 by AquaCheese
