# HoliBooks - Agent Guide

> A vanilla HTML/CSS/JS web application for exploring sacred texts from 6 major world religions.

**Live URL**: https://holibooks.vercel.app

## Project Overview

HoliBooks provides access to sacred texts from:
- ☪️ Islam - The Holy Quran (114 Surahs, 90+ Languages, Audio)
- ✝️ Christianity - The Holy Bible (66 Books, 200+ Versions)
- 🕉️ Hinduism - Bhagavad Gita (18 Chapters)
- ✡️ Judaism - Torah / Tanakh (5 Books)
- 🪯 Sikhism - Guru Granth Sahib (1430 Pages)
- ☸️ Buddhism - Tripitaka / Dhammapada (423 Verses)

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+) - No frameworks
- **Styling**: CSS Variables with oklch colors, custom properties for theming
- **Animations**: CSS keyframes + Intersection Observer API
- **Storage**: localStorage for bookmarks and preferences
- **Fonts**: Google Fonts (Amiri, Frank Ruhl Libre, Inter, Noto Sans Devanagari, Noto Sans Gurmukhi)
- **Hosting**: Vercel (static site)

## Development Commands

```bash
# Start local development server
node serve.js
# Opens at http://localhost:3000

# Test API endpoints
node test-apis.js

# Deploy to production
npx vercel --prod
```

## Project Structure

```
HoliBooks/
├── index.html              # Landing page with religion selector
├── serve.js                # Local development server (Node.js)
├── test-apis.js            # API endpoint testing
├── css/
│   ├── global.css          # Global styles, CSS variables, themes
│   └── animations.css      # Animation keyframes and effects
├── js/
│   ├── utils.js            # Shared utilities, theme management
│   ├── audio-player.js     # Audio player component
│   ├── language-selector.js # Language selection component
│   ├── bookmarks.js        # Bookmark management system
│   └── search.js           # Global search functionality
├── religions/              # Individual religion readers
│   ├── islam/ (quran.html, quran.css, quran.js)
│   ├── christianity/ (bible.html, bible.css, bible.js)
│   ├── hinduism/ (gita.html, gita.css, gita.js)
│   ├── judaism/ (torah.html, torah.css, torah.js)
│   ├── sikhism/ (gurbani.html, gurbani.css, gurbani.js)
│   └── buddhism/ (tripitaka.html, tripitaka.css, tripitaka.js)
└── screenshots/            # README images
```

## Code Style Guidelines

### JavaScript

- **ES6+ features**: Use async/await, arrow functions, destructuring, template literals
- **Class-based architecture**: Components use ES6 classes (e.g., `BookmarkManager`, `GlobalSearch`)
- **Global namespace**: Expose utilities via `window.HoliBooks` object
- **JSDoc comments**: Use for all functions and classes
- **Error handling**: Wrap API calls in try/catch with fallback UI
- **Event delegation**: Use for dynamic elements

```javascript
// Good: Class-based component
class BookmarkManager {
    constructor() {
        this.bookmarks = [];
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.bindEvents();
    }
}

// Good: Global utilities
window.HoliBooks = {
    fetchJSON,
    storage,
    theme
};
```

### CSS

- **CSS Variables**: Use oklch colors for theming (defined in `css/global.css`)
- **BEM-like naming**: `.religion-card`, `.verse-content`, `.bookmark-item`
- **Data attributes**: Use for JavaScript hooks: `data-religion="islam"`
- **Mobile-first**: Responsive breakpoints at 1024px, 768px, 480px
- **Transitions**: Use CSS variables for timing

```css
/* Good: CSS Variables with oklch */
--background: oklch(0.145 0 0);
--accent: oklch(0.75 0.15 85);
--transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Good: BEM naming */
.bookmark-drawer-header {
    display: flex;
    align-items: center;
}
```

### HTML

- **Semantic elements**: Use `<header>`, `<main>`, `<section>`, `<article>`
- **Accessibility**: Include `aria-label` attributes
- **Inline SVG**: Use for icons (no icon library)

### Naming Conventions

- **Files**: kebab-case (e.g., `audio-player.js`, `global.css`)
- **Classes**: PascalCase for JS classes, camelCase for methods
- **CSS classes**: kebab-case with BEM-like structure
- **Constants**: UPPER_SNAKE_CASE for true constants

## Key Patterns

### Theme Management
```javascript
// From js/utils.js
HoliBooks.theme.toggle();
HoliBooks.theme.current; // 'dark' or 'light'
```

### API Fetching
```javascript
// Use fetchJSON utility with timeout and error handling
try {
    const data = await HoliBooks.fetchJSON(`${API_BASE}/surah`);
} catch (error) {
    // Fallback to local data
}
```

### LocalStorage
```javascript
// Use storage utility (handles JSON parse/stringify)
HoliBooks.storage.get('key', defaultValue);
HoliBooks.storage.set('key', value);
```

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

## APIs Used

| Religion | API Source | Endpoint |
|----------|------------|----------|
| Quran | AlQuran Cloud | `https://api.alquran.cloud/v1` |
| Bible | Bible API (JSDelivr) | `https://cdn.jsdelivr.net/gh/wldeh/bible-api` |
| Bhagavad Gita | Vedic Scriptures | `https://vedicscriptures.github.io` |
| Torah | Bible API (JSDelivr) | `https://cdn.jsdelivr.net/gh/wldeh/bible-api` |
| Guru Granth Sahib | GurbaniNow | `https://gurbaninow.com` |
| Dhammapada | Embedded JSON | Local data |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open global search |
| `← / →` | Navigate surahs/chapters |
| `Space` | Play/Pause audio (when player open) |
| `ESC` | Close modals/drawers |

## Testing

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

## Important Notes

1. **CORS**: All APIs must support CORS or use jsDelivr CDN
2. **Audio**: Quran audio requires user interaction before playing
3. **Local Development**: Always use `node serve.js` - not `file://` URLs due to CORS
4. **Icons**: Use emoji or inline SVG (no icon library)
5. **Fonts**: Amiri for Arabic, Noto Sans for Indic scripts
6. **Responsive**: Test at 320px, 768px, 1024px, 1440px breakpoints

## Adding a New Religion

1. Create folder: `religions/<religion>/`
2. Add files: `<religion>.html`, `<religion>.css`, `<religion>.js`
3. Add card to `index.html` landing page
4. Update README.md
5. Add religion color to `css/global.css`
