# HoliBooks - Agent Guide

> **HoliBooks - Sacred Texts Platform**  
> **Version**: 2.0.0  
> **Status**: Production Ready  
> **Live URL**: https://holibooks.vercel.app

---

## Quick Reference

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Last Updated** | January 2026 |
| **GitHub Repository** | https://github.com/ai-dev-2024/HoliBooks |
| **Vercel Deployment** | https://holibooks.vercel.app |
| **License** | MIT |
| **Node.js Required** | >=16.0.0 |

---

## Project Overview

HoliBooks is a modern, production-ready web application that provides universal access to sacred texts from the world's major religions. Built with vanilla JavaScript and modern CSS, it offers a beautiful, distraction-free reading experience with multi-language support, offline capabilities, and PWA features.

### Sacred Texts Supported

| Religion | Sacred Text | Content |
|----------|-------------|---------|
| ☪️ **Islam** | Holy Quran | 114 Surahs, 90+ Languages, Audio Recitations |
| ✝️ **Christianity** | Holy Bible | 66 Books, 200+ Versions |
| 🕉️ **Hinduism** | Bhagavad Gita | 18 Chapters |
| ✡️ **Judaism** | Torah / Tanakh | 5 Books |
| 🪯 **Sikhism** | Guru Granth Sahib | 1430 Pages |
| ☸️ **Buddhism** | Tripitaka / Dhammapada | 423 Verses |

---

## Complete Feature List

### Core Features

1. **Multi-Language Support**
   - 90+ languages for Quran
   - 200+ Bible versions
   - Native script support (Arabic, Devanagari, Gurmukhi, Hebrew)
   - RTL (Right-to-Left) text support

2. **Offline Capability**
   - Service Worker for caching
   - LocalStorage for bookmarks and preferences
   - Works without internet after first load

3. **Progressive Web App (PWA)**
   - Installable on iOS, Android, Desktop
   - Standalone display mode
   - Push notification ready
   - Automatic updates

4. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: 320px, 480px, 768px, 1024px, 1440px
   - Desktop/Mobile toggle for testing
   - Touch-optimized interface

5. **API Monitoring**
   - Real-time API health status
   - Fallback strategies for failed requests
   - Retry logic with exponential backoff
   - User-friendly error messages

6. **Desktop/Mobile Toggle**
   - Preview mobile layout on desktop
   - Device frame visualization
   - Helps with responsive testing

7. **Search & Bookmarks**
   - Global search with `Ctrl+K`
   - Bookmark any verse with one click
   - Organize bookmarks by collection
   - Persistent storage

8. **Reading Progress**
   - Track position in each text
   - Resume reading from last position
   - Progress indicators

### Additional Features

- **Audio Recitations** - Listen to Quran and other texts
- **Dark/Light Themes** - Automatic detection with manual override
- **Font Size Controls** - Adjustable text size
- **Keyboard Shortcuts** - Efficient navigation
- **Deep Linking** - Share specific verses via URL
- **Glass Morphism UI** - Modern translucent design
- **3D Card Effects** - Interactive hover animations
- **Aurora Gradients** - Animated background effects

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **HTML5** | - | Semantic markup |
| **CSS3** | - | Styling with modern features |
| **JavaScript** | ES6+ | Application logic |
| **Node.js** | >=16.0.0 | Development server |

### No Frameworks Used

HoliBooks is built with **vanilla JavaScript** - no React, Vue, Angular, or other frameworks. This provides:

- Zero dependencies
- Lightning-fast performance
- No build step required
- Smaller bundle size
- Future-proof native Web APIs

### PWA Technologies

- **Service Worker** - Offline caching
- **Web App Manifest** - Installable app
- **Cache API** - Asset storage
- **LocalStorage** - User preferences and bookmarks

### External APIs

| API | Provider | Endpoint | Purpose |
|-----|----------|----------|---------|
| **Quran API** | AlQuran Cloud | `https://api.alquran.cloud/v1` | Quran text and audio |
| **Bible API** | Bible API (JSDelivr) | `https://cdn.jsdelivr.net/gh/wldeh/bible-api` | Bible text |
| **Bhagavad Gita API** | Vedic Scriptures | `https://vedicscriptures.github.io` | Gita text |
| **Torah API** | Bible API (JSDelivr) | `https://cdn.jsdelivr.net/gh/wldeh/bible-api` | Torah text |
| **Guru Granth Sahib API** | GurbaniNow | `https://api.gurbaninow.com/v2` | Gurbani text |
| **Dhammapada** | Embedded JSON | Local data | Buddhist text |

### Fonts Used

- **Inter** - Primary UI font
- **Amiri** - Arabic script
- **Frank Ruhl Libre** - Hebrew script
- **Noto Sans Devanagari** - Hindi/Sanskrit
- **Noto Sans Gurmukhi** - Punjabi
- **Playfair Display** - Decorative headings

---

## File Structure

```
HoliBooks/
├── index.html                    # Landing page with religion selector
├── manifest.json                 # PWA manifest
├── package.json                  # Node.js dependencies and scripts
├── serve.js                      # Local development server
├── test-apis.js                  # API endpoint testing
├── README.md                     # User documentation
├── LICENSE                       # MIT license
├── .gitignore                    # Git ignore rules
├── .vercel/                      # Vercel configuration
│   ├── project.json
│   └── README.txt
├── css/
│   ├── global.css               # Global styles, CSS variables, themes
│   └── animations.css           # Animation keyframes and effects
├── js/
│   ├── utils.js                 # Shared utilities, theme management
│   ├── api-monitor.js           # API health monitoring
│   ├── audio-player.js          # Audio player component
│   ├── language-selector.js     # Language selection component
│   ├── bookmarks.js             # Bookmark management system
│   └── search.js                # Global search functionality
├── assets/
│   └── images/
│       ├── cards/               # Religion card backgrounds (SVG)
│       │   ├── islam-card.svg
│       │   ├── christianity-card.svg
│       │   ├── hinduism-card.svg
│       │   ├── judaism-card.svg
│       │   ├── sikhism-card.svg
│       │   └── buddhism-card.svg
│       └── icons/               # UI icons (if any)
├── religions/                   # Individual religion readers
│   ├── islam/
│   │   ├── quran.html          # Quran reader page
│   │   ├── quran.css           # Quran-specific styles
│   │   └── quran.js            # Quran reader logic
│   ├── christianity/
│   │   ├── bible.html          # Bible reader page
│   │   ├── bible.css           # Bible-specific styles
│   │   └── bible.js            # Bible reader logic
│   ├── hinduism/
│   │   ├── gita.html           # Gita reader page
│   │   ├── gita.css            # Gita-specific styles
│   │   └── gita.js             # Gita reader logic
│   ├── judaism/
│   │   ├── torah.html          # Torah reader page
│   │   ├── torah.css           # Torah-specific styles
│   │   └── torah.js            # Torah reader logic
│   ├── sikhism/
│   │   ├── gurbani.html        # Gurbani reader page
│   │   ├── gurbani.css         # Gurbani-specific styles
│   │   └── gurbani.js          # Gurbani reader logic
│   └── buddhism/
│       ├── tripitaka.html      # Tripitaka reader page
│       ├── tripitaka.css       # Tripitaka-specific styles
│       └── tripitaka.js        # Tripitaka reader logic
└── screenshots/                # Screenshots for README/PWA
    ├── home.png
    └── quran.png
```

---

## Development Commands

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# OR
npm start
# Opens at http://localhost:3000

# Alternative: Run server directly
node serve.js
```

### Testing

```bash
# Test all API endpoints
npm test
# OR
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

### Deployment

```bash
# Deploy to Vercel (production)
npm run deploy
# OR
npx vercel --prod

# Preview deployment
npm run preview
# OR
npx vercel

# Build (no-op for vanilla JS)
npm run build
```

---

## API Information

### API Endpoints

#### Quran API (AlQuran Cloud)
```
Base URL: https://api.alquran.cloud/v1

Endpoints:
- GET /surah                    # List all surahs
- GET /surah/{number}           # Get specific surah
- GET /surah/{number}/{edition} # Get surah in specific language
- GET /edition                  # List available editions
- GET /edition/language/{lang}  # Get editions by language

Rate Limit: No strict limit (be respectful)
CORS: Enabled
```

#### Bible API (JSDelivr CDN)
```
Base URL: https://cdn.jsdelivr.net/gh/wldeh/bible-api

Endpoints:
- GET /bibles.json                    # List all Bible versions
- GET /bibles/{version}/books.json    # List books in version
- GET /bibles/{version}/books/{book}/chapters/{chapter}.json

Rate Limit: JSDelivr CDN (high limit)
CORS: Enabled via CDN
```

#### Bhagavad Gita API (Vedic Scriptures)
```
Base URL: https://vedicscriptures.github.io

Endpoints:
- GET /slok/{chapter}/{verse}    # Get specific verse
- GET /chapter/{number}          # Get chapter info

Rate Limit: Unknown (be respectful)
CORS: Enabled
```

#### GurbaniNow API
```
Base URL: https://api.gurbaninow.com/v2

Endpoints:
- GET /ang/{number}              # Get page by ang number
- GET /search/{query}            # Search Gurbani
- GET /hukamnama                 # Get today's hukamnama

Rate Limit: Unknown (be respectful)
CORS: Enabled
```

### Fallback Strategies

1. **Primary API Failure**
   - Display user-friendly error message
   - Offer retry button
   - Cache last successful response

2. **CORS Issues**
   - Use JSDelivr CDN for Bible/Torah (avoids CORS)
   - Local development requires `serve.js` (not `file://`)

3. **Rate Limiting**
   - Implement exponential backoff
   - Cache responses in LocalStorage
   - Show loading states

4. **Offline Mode**
   - Service Worker caches core assets
   - Bookmarks available offline
   - Graceful degradation

### Rate Limits

| API | Rate Limit | Notes |
|-----|------------|-------|
| AlQuran Cloud | ~100 req/min | Be respectful |
| JSDelivr CDN | Very high | CDN cached |
| Vedic Scriptures | Unknown | Cache responses |
| GurbaniNow | Unknown | Cache responses |

### CORS Handling

- All APIs support CORS (Cross-Origin Resource Sharing)
- Local development: Must use `serve.js`, not `file://` URLs
- Production: No CORS issues on Vercel
- Preflight requests: Minimized by not sending Content-Type on GET requests

---

## Code Conventions

### JavaScript Style

```javascript
// ES6+ features
const fetchData = async () => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

// Class-based components
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

// Global utilities via window object
window.HoliBooks = {
    fetchJSON,
    storage,
    theme
};

// JSDoc comments
/**
 * Fetches JSON data from API
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} JSON response
 */
async function fetchJSON(url, options = {}) {
    // implementation
}
```

### CSS Methodology

```css
/* CSS Variables with oklch colors */
:root {
    --background: oklch(0.145 0 0);
    --accent: oklch(0.75 0.15 85);
    --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* BEM-like naming */
.religion-card { }
.religion-card__header { }
.religion-card--active { }

/* Data attributes for JS hooks */
[data-religion="islam"] { }
[data-theme="light"] { }

/* Mobile-first responsive */
.component {
    /* Mobile styles */
}

@media (min-width: 768px) {
    .component {
        /* Tablet styles */
    }
}

@media (min-width: 1024px) {
    .component {
        /* Desktop styles */
    }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `audio-player.js`, `global.css` |
| JavaScript Classes | PascalCase | `BookmarkManager`, `GlobalSearch` |
| JavaScript Methods | camelCase | `loadFromStorage()`, `addBookmark()` |
| CSS Classes | kebab-case | `.religion-card`, `.verse-content` |
| Constants | UPPER_SNAKE_CASE | `API_BASE`, `MAX_RETRIES` |
| Variables | camelCase | `currentSurah`, `isLoading` |

### Comment Standards

```javascript
// Single-line comment for simple explanation

/**
 * Multi-line JSDoc comment for functions
 * @param {string} param1 - Description
 * @returns {Promise<Object>} Description
 */

// Section headers in CSS
/* ===== Section Name ===== */

// FIXME: For known issues
// TODO: For planned features
// NOTE: For important information
// HACK: For temporary workarounds
```

---

## Recent Changes (v2.0.0)

### Major Additions

1. **Complete UI Redesign**
   - Glass morphism design system
   - Aurora gradient backgrounds
   - 3D card hover effects
   - Custom SVG icons for all religions

2. **Enhanced PWA Features**
   - Improved service worker
   - Better offline support
   - App shortcuts for quick access
   - Share target API integration

3. **API Monitoring Dashboard**
   - Real-time API health status
   - Visual indicators for API status
   - Automatic retry logic

4. **Desktop/Mobile Toggle**
   - Preview mobile layout on desktop
   - Device frame visualization
   - Helps with responsive testing

5. **Improved Search**
   - Global search with `Ctrl+K`
   - Search across all texts
   - Keyboard navigation

6. **Enhanced Bookmarks**
   - Better organization
   - Persistent storage
   - Export/import capability

7. **Performance Optimizations**
   - Lazy loading for images
   - Code splitting by religion
   - Optimized animations (60fps)

8. **Accessibility Improvements**
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support

---

## Deployment Process

### Vercel Auto-Deploy

HoliBooks is configured for automatic deployment via Vercel:

1. **GitHub Integration**
   - Repository: `ai-dev-2024/HoliBooks`
   - Branch: `master`
   - Auto-deploy on push: Enabled

2. **What Triggers Deployment**
   - Push to `master` branch
   - Pull request merge
   - Manual deploy via Vercel CLI

3. **Deployment Steps**
   ```
   1. Git push to master
   2. Vercel detects changes
   3. Build process (static files)
   4. Deploy to edge network
   5. Update live URL
   ```

4. **How to Verify Deployment**
   - Check Vercel dashboard
   - Visit https://holibooks.vercel.app
   - Check browser console for errors
   - Test all API endpoints
   - Verify PWA installation

5. **Deployment Configuration**
   - Framework: Other (static)
   - Build Command: None (vanilla JS)
   - Output Directory: `./`
   - Install Command: `npm install`

### Manual Deployment

```bash
# Deploy to production
npx vercel --prod

# Preview deployment
npx vercel

# Check deployment status
npx vercel list
```

---

## Common Tasks

### Adding New Features

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Implement feature**
   - Add HTML to relevant page
   - Add CSS to appropriate stylesheet
   - Add JavaScript to relevant file
   - Update `utils.js` if adding shared utilities

3. **Test feature**
   - Test on multiple browsers
   - Test on mobile and desktop
   - Test with different themes
   - Test offline functionality

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Add: new feature description"
   git push origin feature/new-feature
   ```

5. **Create pull request**
   - Open PR on GitHub
   - Describe changes
   - Request review

### Fixing Bugs

1. **Identify bug**
   - Reproduce issue
   - Check browser console
   - Check network tab

2. **Create fix branch**
   ```bash
   git checkout -b fix/bug-description
   ```

3. **Implement fix**
   - Make minimal changes
   - Add comments explaining fix
   - Test thoroughly

4. **Commit with descriptive message**
   ```bash
   git commit -m "Fix: description of bug fix"
   ```

### Updating Content

1. **Update text content**
   - Edit HTML files directly
   - Maintain semantic structure
   - Update meta descriptions

2. **Update styles**
   - Edit CSS files
   - Use CSS variables for consistency
   - Test both themes

3. **Update JavaScript**
   - Edit JS files
   - Maintain backward compatibility
   - Update JSDoc comments

### Testing Changes

```bash
# Start local server
npm run dev

# Run API tests
npm test

# Manual testing checklist
# - [ ] All pages load correctly
# - [ ] Theme toggle works
# - [ ] Mobile responsive
# - [ ] All APIs respond
# - [ ] Bookmarks work
# - [ ] Search works
# - [ ] Audio plays
# - [ ] PWA installs
```

---

## Troubleshooting

### API Issues

**Problem**: APIs not loading  
**Solutions**:
1. Check internet connection
2. Run `npm test` to verify APIs
3. Check browser console for CORS errors
4. Ensure using `serve.js` (not `file://`)
5. Check API status in API monitor

**Problem**: CORS errors  
**Solutions**:
1. Use local server: `node serve.js`
2. Check if API supports CORS
3. Use JSDelivr CDN for Bible/Torah

### Cache Problems

**Problem**: Old content showing  
**Solutions**:
1. Hard refresh: `Ctrl+Shift+R`
2. Clear browser cache
3. Unregister service worker
4. Check `manifest.json` version

**Problem**: PWA not updating  
**Solutions**:
1. Close and reopen app
2. Clear site data in browser
3. Uninstall and reinstall PWA

### Deployment Failures

**Problem**: Vercel build fails  
**Solutions**:
1. Check `vercel.json` configuration
2. Verify `package.json` scripts
3. Check for syntax errors
4. Review Vercel build logs

**Problem**: 404 errors on refresh  
**Solutions**:
1. Check `vercel.json` routes
2. Ensure SPA routing configured
3. Verify file paths are correct

### Performance Issues

**Problem**: Slow loading  
**Solutions**:
1. Enable gzip compression
2. Optimize images
3. Lazy load non-critical resources
4. Check for memory leaks

**Problem**: Animation jank  
**Solutions**:
1. Use `transform` and `opacity` only
2. Add `will-change` to animated elements
3. Reduce particle count
4. Disable animations on low-power mode

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open global search |
| `← / →` | Navigate surahs/chapters |
| `Space` | Play/Pause audio (when player open) |
| `ESC` | Close modals/drawers |
| `Ctrl+Shift+D` | Toggle debug mode (if implemented) |

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | Full Support |
| Firefox | 88+ | Full Support |
| Safari | 14+ | Full Support |
| Edge | 90+ | Full Support |
| Opera | 76+ | Full Support |
| Samsung Internet | 15+ | Full Support |

**Note**: Internet Explorer is not supported.

---

## Contributing

We welcome contributions! Please see the main [README.md](./README.md) for detailed contribution guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Areas for Contribution

- Translations
- UI/UX improvements
- Bug fixes
- New features
- Documentation
- Performance optimizations

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## Contact & Support

- **GitHub Issues**: https://github.com/ai-dev-2024/HoliBooks/issues
- **Live Site**: https://holibooks.vercel.app
- **Email**: See repository for contact info

---

*Last updated: January 2026 | Version 2.0.0*
