# HoliBooks - Agent Guide

> A web application for exploring sacred texts from 6 major world religions.

## 🌐 Project Overview

**HoliBooks** is a vanilla HTML/CSS/JS web app that provides access to sacred texts from:
- ☪️ Islam - The Holy Quran (114 Surahs, 90+ Languages, Audio)
- ✝️ Christianity - The Holy Bible (66 Books, 200+ Versions)
- 🕉️ Hinduism - Bhagavad Gita (18 Chapters)
- ✡️ Judaism - Torah / Tanakh (5 Books)
- 🪯 Sikhism - Guru Granth Sahib (1430 Pages)
- ☸️ Buddhism - Tripitaka / Dhammapada (423 Verses)

**Live URL**: https://holibooks.vercel.app

## 📁 Project Structure

```
HoliBooks/
├── index.html              # Landing page with religion selector
├── style.css               # Legacy styles (landing page)
├── app.js                  # Legacy Quran app (root level)
├── serve.js                # Local development server (Node.js)
│
├── css/
│   ├── global.css          # Global styles, CSS variables, themes
│   └── animations.css      # Animation keyframes and effects
│
├── js/
│   ├── utils.js            # Shared utilities, theme management
│   ├── audio-player.js     # Audio player component
│   ├── language-selector.js # Language selection component
│   ├── bookmarks.js        # Bookmark management system
│   └── search.js           # Global search functionality
│
├── religions/              # Individual religion readers
│   ├── islam/
│   │   ├── quran.html      # Quran reader page
│   │   ├── quran.css       # Quran-specific styles
│   │   └── quran.js        # Quran app logic
│   ├── christianity/
│   │   ├── bible.html
│   │   ├── bible.css
│   │   └── bible.js
│   ├── hinduism/
│   │   ├── gita.html
│   │   ├── gita.css
│   │   └── gita.js
│   ├── judaism/
│   │   ├── torah.html
│   │   ├── torah.css
│   │   └── torah.js
│   ├── sikhism/
│   │   ├── gurbani.html
│   │   ├── gurbani.css
│   │   └── gurbani.js
│   └── buddhism/
│       ├── tripitaka.html
│       ├── tripitaka.css
│       └── tripitaka.js
│
├── screenshots/            # README images
└── .vercel/                # Vercel deployment config
```

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **No Frameworks**: Pure vanilla implementation
- **Styling**: CSS Variables with oklch colors, custom properties for theming
- **Animations**: CSS keyframes + Intersection Observer API
- **Storage**: localStorage for bookmarks and preferences
- **Fonts**: Google Fonts (Amiri, Frank Ruhl Libre, Inter, Noto Sans Devanagari, Noto Sans Gurmukhi)
- **APIs**: REST APIs for religious text data
- **Hosting**: Vercel

## 🚀 Development Commands

```bash
# Start local development server
node serve.js
# Opens at http://localhost:3000

# Deploy to production
npx vercel --prod
```

## 📚 APIs Used

| Religion | API Source | Endpoint |
|----------|------------|----------|
| Quran | AlQuran Cloud | `https://api.alquran.cloud/v1` |
| Bible | Bible API (JSDelivr) | `https://cdn.jsdelivr.net/gh/wldeh/bible-api` |
| Bhagavad Gita | Vedic Scriptures | `https://vedicscriptures.github.io` |
| Torah | Bible API (JSDelivr) | `https://cdn.jsdelivr.net/gh/wldeh/bible-api` |
| Guru Granth Sahib | GurbaniNow | `https://gurbaninow.com` |
| Dhammapada | Embedded JSON | Local data |

### Audio APIs
- **Quran Audio**: Mishary Alafasy recitation via `https://cdn.islamic.network`

## 🎨 Design System

### CSS Variables (in `css/global.css`)

```css
/* Colors use oklch for better perceptual uniformity */
--bg-primary: oklch(17% 0.02 270);
--bg-secondary: oklch(22% 0.03 270);
--text-primary: oklch(95% 0.01 270);
--text-secondary: oklch(70% 0.02 270);
--accent-primary: #c9a55c;  /* Gold */
--accent-secondary: #8b6914;
--border-color: oklch(30% 0.03 270);
```

### Theme Support
- Dark mode (default)
- Light mode
- Theme toggle in UI
- Smooth transitions between themes

### Religion Colors
Each religion has its own accent color used in cards and UI:
- Islam: `#c9a55c` (Gold)
- Christianity: `#4a90e2` (Blue)
- Hinduism: `#ff6b35` (Orange)
- Judaism: `#7b68ee` (Purple)
- Sikhism: `#ff8c00` (Orange/Gold)
- Buddhism: `#d4af37` (Gold)

## ✨ Key Features

### 🔖 Bookmark System
- Class: `BookmarkManager` in `js/bookmarks.js`
- Save verses with one click
- Persistent storage in localStorage
- Export to JSON
- Floating FAB for quick access

### 🔍 Global Search
- Class: `GlobalSearch` in `js/search.js`
- Keyboard shortcut: `Ctrl+K`
- Search across all texts
- Recent search history

### 🎵 Audio Player
- Class: `AudioPlayer` in `js/audio.js`
- Playlist support
- Verse-by-verse playback
- Speed control (0.5x - 2x)
- Keyboard shortcuts (Space, Arrow keys)

### 🎨 Animations
- File: `css/animations.css`
- Scroll reveal animations
- Hover effects (3D tilt on cards)
- Staggered animations
- Toast notifications

## 📝 Coding Conventions

### HTML
- Semantic HTML5 elements
- BEM-like class naming (e.g., `.religion-card`, `.verse-content`)
- Data attributes for JavaScript hooks: `data-religion="islam"`

### CSS
- CSS Variables for theming
- Mobile-first responsive design
- Grid/Flexbox for layouts
- Smooth transitions and animations

### JavaScript
- ES6+ features (async/await, arrow functions, destructuring)
- Class-based architecture for components
- Event delegation where appropriate
- API error handling with fallback UI

## 🔄 Common Patterns

### Adding a New Religion
1. Create folder: `religions/<religion>/`
2. Add files: `<religion>.html`, `<religion>.css`, `<religion>.js`
3. Add card to `index.html` landing page
4. Update README.md

### Adding a Bookmark
```javascript
const bookmark = {
    religion: 'islam',
    religionName: 'Islam',
    text: 'Verse text here',
    reference: 'Quran 2:255',
    translation: 'Translation text'
};
bookmarkManager.addBookmark(bookmark);
```

### Theme Toggle Implementation
```javascript
// From js/utils.js
HoliBooks.theme.toggle();
HoliBooks.theme.current; // 'dark' or 'light'
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open global search |
| `← / →` | Navigate surahs/chapters |
| `Space` | Play/Pause audio (when player open) |
| `ESC` | Close modals/drawers |

## 🐛 Known Issues & Considerations

1. **CORS**: All APIs must support CORS or use jsDelivr CDN
2. **Audio**: Quran audio requires user interaction before playing
3. **Large Files**: `quran_arabic.json` (2.1MB) and PDF (2.4MB) are committed
4. **API Rate Limits**: Be mindful of API usage during development

## 🧪 Testing

```bash
# Run API tests
node test-apis.js

# Manual testing checklist:
# - Theme toggle works on all pages
# - All 6 religions load correctly
# - Audio plays for Quran
# - Language switching works
# - Mobile responsive layout
# - Navigation between surahs/chapters
# - Bookmark add/remove works
# - Search opens with Ctrl+K
```

## 📦 Deployment

The project is configured for **Vercel** deployment:
- Static site hosting
- No build step required
- Environment variables in `.vercel/project.json`

## 💡 Development Tips

1. **Local Development**: Always use `node serve.js` - not `file://` URLs due to CORS
2. **Styling**: Use CSS variables from `global.css` for consistency
3. **Icons**: Use emoji or inline SVG (no icon library)
4. **Fonts**: Amiri for Arabic, Noto Sans for Indic scripts
5. **Responsive**: Test at 320px, 768px, 1024px, 1440px breakpoints

## 🔗 Useful Resources

- [Live Demo](https://holibooks.vercel.app)
- [GitHub Repo](https://github.com/ai-dev-2024/HoliBooks)
- [AlQuran Cloud API](https://alquran.cloud)
- [Vedic Scriptures API](https://vedicscriptures.github.io)
- [GurbaniNow API](https://gurbaninow.com)
