# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.1] - 2026-01-31

### Fixed
- Fixed browser caching issues with cache-busting query parameters
- Added version query parameters (?v=2.0.1) to all CSS and JS imports
- Ensured latest content loads for all users by bypassing cached files
- Updated all HTML files with cache-busting for production deployment

---

## [Unreleased]

### Planned
- User accounts and cloud sync for bookmarks
- Note-taking feature for verses
- Reading plans and daily devotionals
- Social sharing with custom cards
- More audio recitations for other texts
- Mobile app (React Native/Flutter)
- Offline text downloads
- Advanced search with filters
- Community translations
- Accessibility improvements (screen reader optimization)

---

## [2.0.0] - 2026-01-31

### Added

#### Multi-Language Support
- Complete multi-language support for all 6 religions
  - **Quran**: 90+ languages including Arabic, English, Urdu, French, Spanish, Indonesian, and more
  - **Bible**: 200+ versions and translations across 100+ languages
  - **Bhagavad Gita**: Sanskrit, Hindi, English, and other Indian languages
  - **Torah**: English, Spanish, French, and German translations
  - **Guru Granth Sahib (Gurbani)**: Gurmukhi, English, and Transliteration support
  - **Tripitaka**: Pali and English translations

#### Comprehensive Offline Fallback Data
- All 18 Gita chapters with 90+ verses
- Complete Japji Sahib with 80 verses
- Full Dhammapada with 423 verses
- Cached assets for fast loading

#### Progressive Web App (PWA)
- Service Worker for offline functionality
- Web App Manifest for installability
- Offline support on all devices
- Installable on desktop and mobile

#### UI/UX Features
- Desktop/Mobile view toggle for testing
- API health monitoring system with real-time status dashboard
- Mobile responsive navigation with hamburger menus
- Slide-out panels for mobile navigation
- Touch-friendly controls
- Search functionality with Ctrl+K keyboard shortcut
- Bookmarks system with localStorage persistence
- Reading history tracking
- Theme toggle (Dark/Light modes)

#### Design System
- Professional design system with glass morphism effects
- Aurora gradient backgrounds with animated ethereal color flows
- Custom SVG icons replacing all emoji icons
  - 6 religion card images
  - Hero banner
  - Social preview image
- 3D card hover effects with mouse-following tilt
- Enhanced typography with premium font selection

#### Enhanced Scripture Readers
- Sticky headers with progress bars
- Verse highlighting via URL parameters (deep linking)
- Font size controls (Small, Medium, Large, Extra Large)
- Language selectors for each scripture
- Reading progress indicators with percentage completion

#### Professional Documentation
- README.md with comprehensive project information
- AGENTS.md for AI agent instructions
- CHANGELOG.md (this file)
- VERSION file with semantic versioning
- package.json for dependency management

### Changed

#### Complete UI/UX Redesign
- New color palette with oklch color space
- Improved contrast ratios for accessibility
- Consistent spacing system with CSS variables
- Modern card layouts with hover effects

#### Enhanced Typography
- Premium font selection
  - Playfair Display for headings
  - Inter for body text
  - Amiri for Arabic script
  - Noto Sans for Indic scripts
- Improved line heights and letter spacing
- Better font loading with font-display: swap

#### Improved Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader compatibility
- Color contrast compliance (WCAG 2.1 AA)

#### Better Mobile Experience
- Touch-friendly button sizes
- Optimized tap targets
- Mobile-first responsive design
- Swipe gestures consideration
- Viewport-optimized layouts

### Fixed

#### Layout Issues
- Header overflow on mobile devices
- Grid alignment with inconsistent card heights
- Image scaling with proper aspect ratio maintenance
- Text overflow with ellipsis and wrapping fixes
- Viewport units for consistent sizing across devices

#### API Reliability
- API reliability issues with timeout handling
- Fallback content display when APIs fail
- Retry logic for failed requests
- Status indicators for API health
- Translation loading errors

#### Technical Issues
- CORS issues with fallback data
- Responsive layout problems across breakpoints
- Navigation bar wrapping issues

---

## [1.0.0] - Initial Release

### Added
- Basic support for 6 sacred texts (Quran, Bible, Bhagavad Gita, Torah, Guru Granth Sahib, Dhammapada)
- Basic navigation between religion pages
- Quran with audio recitations by Mishary Alafasy
- Bible with multiple versions
- Simple styling and responsive design
- Bookmark system using localStorage
- Dark/Light theme toggle
- Basic search functionality
- REST API integrations

---

## Contributors

A huge thank you to all contributors who have helped make HoliBooks better:

- [@ai-dev-2024](https://github.com/ai-dev-2024) - Project creator and maintainer

Want to contribute? Check out our [Contributing Guide](./README.md#contributing)!

---

[Unreleased]: https://github.com/ai-dev-2024/HoliBooks/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/ai-dev-2024/HoliBooks/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ai-dev-2024/HoliBooks/releases/tag/v1.0.0
