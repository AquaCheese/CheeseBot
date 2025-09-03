# 🔤 Fonts Directory

This folder contains font files used by CheeseBot for generating memes with authentic styling.

## 📥 Installing Impact Font

To get the authentic meme font experience, place an `impact.ttf` file in this directory.

### Download Sources:
- **Google Fonts**: [fonts.google.com](https://fonts.google.com)
- **DaFont**: [dafont.com](https://dafont.com)
- **Font Squirrel**: [fontsquirrel.com](https://fontsquirrel.com)

### Installation Steps:
1. Download `impact.ttf` from a trusted source
2. Place the file in this `fonts/` directory
3. Restart the bot
4. Use `/fontsetup` command to verify installation

## 🎨 Font Fallbacks

If Impact font is not available, the bot will use:
1. **Anton** - Downloaded automatically as a close alternative
2. **Arial** - System fallback font

## ⚖️ Legal Notice

**Important**: Make sure you have the right to use any fonts you place in this directory. Some fonts may have licensing restrictions for commercial use.

- Impact font is typically pre-installed on Windows systems
- Anton font is freely available from Google Fonts
- Always check font licenses before use

## 📁 Supported Formats

- `.ttf` (TrueType Font) - Recommended
- `.otf` (OpenType Font)
- `.woff` (Web Open Font Format)
- `.woff2` (Web Open Font Format 2.0)

## 🔧 Technical Details

The bot uses the Canvas library's `registerFont()` function to load custom fonts. Fonts are automatically detected and registered when the bot starts.

Made with 🧀 by AquaCheese
