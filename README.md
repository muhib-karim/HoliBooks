# 📖 HoliBooks

> Explore sacred texts from the world's major religions in one beautiful interface.

[![Live Demo](https://img.shields.io/badge/🌐_Live-holibooks.vercel.app-brightgreen?style=for-the-badge)](https://holibooks.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-ai--dev--2024/HoliBooks-blue?style=for-the-badge&logo=github)](https://github.com/ai-dev-2024/HoliBooks)

![HoliBooks Screenshot](./screenshots/hero.png)

## ✨ Features

- **6 Sacred Texts** - Quran, Bible, Bhagavad Gita, Torah, Guru Granth Sahib, Dhammapada
- **100+ Languages** - Translations in Arabic, English, Hebrew, Sanskrit, Gurmukhi, Pali & more
- **Audio Recitations** - Listen to Quran recitations by Mishary Alafasy
- **Bookmark System** - Save your favorite verses across all texts
- **Global Search** - Search across all scriptures (Ctrl+K)
- **Dark/Light Mode** - Beautiful theming with smooth transitions
- **Offline Fallback** - Sample verses available even when APIs are down
- **Mobile Responsive** - Works perfectly on all devices

## 🌐 Live Demo

**[https://holibooks.vercel.app](https://holibooks.vercel.app)**

## 🚀 Quick Start

### Run Locally
```bash
git clone https://github.com/ai-dev-2024/HoliBooks.git
cd HoliBooks
node serve.js
# Open http://localhost:3000
```

### Deploy to Vercel
```bash
npx vercel --prod
```

## 🎯 New Features

### 🔖 Bookmark System
- Save verses with one click
- Persistent storage across sessions
- Export bookmarks to JSON
- Copy and share bookmarked verses
- Floating quick-access drawer

### 🔍 Global Search
- Press `Ctrl+K` to search
- Search across all religious texts
- Recent searches history
- Popular search suggestions
- Keyboard navigation support

### 🎨 Enhanced UI
- 3D hover effects on cards
- Animated particle background
- Scroll reveal animations
- Reading progress indicator
- Font size controls
- View modes (Arabic/Translation/Both)

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+K` | Open search |
| `← / →` | Navigate surahs/chapters |
| `Space` | Play/Pause audio |
| `ESC` | Close modals |

## 📚 Supported Texts & APIs

| Religion | Sacred Text | API Source | Status |
|----------|-------------|------------|--------|
| ☪️ Islam | Holy Quran | [AlQuran Cloud](https://alquran.cloud) | ✅ Working |
| ✝️ Christianity | Holy Bible | [Bible API (JSDelivr)](https://cdn.jsdelivr.net/gh/wldeh/bible-api) | ✅ Working |
| 🕉️ Hinduism | Bhagavad Gita | [Vedic Scriptures](https://vedicscriptures.github.io) | ✅ Working |
| ✡️ Judaism | Torah | [Bible API (JSDelivr)](https://cdn.jsdelivr.net/gh/wldeh/bible-api) | ✅ Working |
| 🪯 Sikhism | Guru Granth Sahib | [GurbaniNow](https://gurbaninow.com) | ✅ Working |
| ☸️ Buddhism | Dhammapada | Embedded Data | ✅ Working |

### Audio Support
- **Quran Audio**: Mishary Alafasy recitation via [Islamic Network CDN](https://cdn.islamic.network)
- Click the play button on any verse to hear the recitation

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (No frameworks!)
- **Theming**: CSS Variables with oklch colors
- **Animations**: CSS keyframes + Intersection Observer API
- **Storage**: localStorage for bookmarks & preferences
- **APIs**: REST APIs for religious texts
- **Hosting**: [Vercel](https://vercel.com)

## 📁 Project Structure

```
HoliBooks/
├── index.html              # Landing page
├── css/
│   ├── global.css         # Global styles
│   └── animations.css     # Animation keyframes
├── js/
│   ├── utils.js           # Shared utilities
│   ├── audio-player.js    # Audio player component
│   ├── language-selector.js
│   ├── bookmarks.js       # Bookmark system
│   └── search.js          # Global search
├── religions/
│   ├── islam/             # Quran reader
│   ├── christianity/      # Bible reader
│   ├── hinduism/          # Bhagavad Gita reader
│   ├── judaism/           # Torah reader
│   ├── sikhism/           # Gurbani reader
│   └── buddhism/          # Dhammapada reader
└── screenshots/           # README images
```

## 💝 Support

If you find this project helpful, consider supporting its development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b?style=for-the-badge&logo=ko-fi)](https://ko-fi.com/ai_dev_2024)

## 🔧 Customization

### Change Default Language
1. Open any scripture page
2. Click the language button in the header
3. Select your preferred translation

### Adjust Reading Experience
- Use font size buttons to zoom in/out
- Toggle between Arabic, Translation, or Both views
- Switch between Dark and Light themes

## 📱 PWA Support

HoliBooks is designed to work as a Progressive Web App:
- Install to home screen
- Works offline with sample data
- Fast loading with cached assets

## 📄 License

MIT License - Feel free to use and modify for any purpose.

---

<p align="center">Made with ❤️ for spiritual seekers everywhere</p>
<p align="center">
  <a href="https://holibooks.vercel.app">🌐 Visit HoliBooks</a>
</p>
