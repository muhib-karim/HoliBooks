# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-01-31

### ✨ Added

#### Multi-Language Support
- **Quran**: Support for 90+ languages including Arabic, English, Urdu, French, Spanish, Indonesian, and more
- **Bible**: 200+ versions and translations across 100+ languages
- **Bhagavad Gita**: Sanskrit, English, Hindi, and other Indian languages
- **Torah**: Hebrew, English, Yiddish, and Ladino translations
- **Guru Granth Sahib**: Gurmukhi, English, and Punjabi support
- **Tripitaka**: Pali, English, and Buddhist canonical languages

#### UI/UX Enhancements
- **Desktop/Mobile View Toggle** - Switch between desktop and mobile preview modes for testing
- **API Health Monitoring System** - Real-time status dashboard showing all API endpoints
- **Progressive Web App (PWA) Support**
  - Service Worker for offline functionality
  - Web App Manifest for installability
  - Offline fallback page with sample content
  - Cached assets for fast loading
- **Custom SVG Icons** - Replaced all emoji icons with handcrafted SVG icons
  - Religion-specific icon sets
  - Consistent styling across themes
  - Scalable vector graphics

#### Design System
- **Glass Morphism UI** - Modern translucent design elements
  - Backdrop blur effects
  - Semi-transparent backgrounds
  - Border highlights with gradients
- **Aurora Gradient Backgrounds** - Animated ethereal color flows
  - Multiple animated gradient blobs
  - Mesh gradient overlays
  - Smooth floating animations
- **3D Religion Cards** - Interactive cards with depth
  - Mouse-following tilt effect
  - Radial gradient glow on hover
  - Perspective transforms
  - Smooth transitions

#### Navigation & Layout
- **Mobile Responsive Navigation** - Hamburger menu for mobile devices
- **Sticky Headers with Progress Bars** - Reading progress indicators
- **Verse Highlighting via URL Parameters** - Deep linking to specific verses
  - Shareable verse URLs
  - Automatic scroll to highlighted verse
  - Visual highlight animation

#### Reading Features
- **Font Size Controls** - Adjustable text sizes (Small, Medium, Large, Extra Large)
- **Reading Progress Indicators** - Track progress through chapters/books
  - Visual progress bars
  - Percentage completion
  - Chapter navigation

#### Search & Discovery
- **Global Search (Ctrl+K)** - Search across all religious texts
  - Keyboard shortcut activation
  - Recent searches history
  - Popular search suggestions
  - Results from all scriptures

### 🎨 Changed

#### Complete UI Redesign
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

### 🐛 Fixed

#### Layout Issues
- **Header Overflow on Mobile** - Fixed navigation bar wrapping issues
  - Responsive breakpoints adjusted
  - Flexible layout containers
  - Better text truncation

#### API Reliability
- **API Timeout Handling** - Added proper error handling for slow connections
- **Fallback Content** - Sample verses display when APIs fail
- **Retry Logic** - Automatic retry for failed requests
- **Status Indicators** - Visual feedback for API health

#### Responsive Layout Issues
- **Grid Alignment** - Fixed inconsistent card heights
- **Image Scaling** - Proper aspect ratio maintenance
- **Text Overflow** - Ellipsis and wrapping fixes
- **Viewport Units** - Consistent sizing across devices

---

## [1.0.0] - 2025-12-15

### 🎉 Initial Release

#### Core Features
- **6 Sacred Texts** - Support for Quran, Bible, Bhagavad Gita, Torah, Guru Granth Sahib, and Dhammapada
- **Basic Multi-Language Support** - Initial translations for major languages
- **Audio Recitations** - Quran audio by Mishary Alafasy
- **Bookmark System** - Save favorite verses to localStorage
- **Dark/Light Themes** - Toggle between color schemes
- **Responsive Design** - Works on desktop and mobile devices

#### Technical Foundation
- Vanilla HTML, CSS, and JavaScript
- No external frameworks or dependencies
- Modular CSS architecture
- REST API integrations
- localStorage for data persistence

#### UI Components
- Hero section with animated background
- Religion cards with hover effects
- Scripture readers with navigation
- Audio player component
- Search functionality
- Theme toggle

---

## Future Roadmap

### Planned for v2.1.0
- [ ] User accounts and cloud sync for bookmarks
- [ ] Note-taking feature for verses
- [ ] Reading plans and daily devotionals
- [ ] Social sharing with custom cards
- [ ] More audio recitations for other texts

### Planned for v3.0.0
- [ ] Mobile app (React Native/Flutter)
- [ ] Offline text downloads
- [ ] Advanced search with filters
- [ ] Community translations
- [ ] Accessibility improvements (screen reader optimization)

---

## Contributors

A huge thank you to all contributors who have helped make HoliBooks better:

- [@ai-dev-2024](https://github.com/ai-dev-2024) - Project creator and maintainer

Want to contribute? Check out our [Contributing Guide](./README.md#contributing)!

---

[Unreleased]: https://github.com/ai-dev-2024/HoliBooks/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/ai-dev-2024/HoliBooks/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ai-dev-2024/HoliBooks/releases/tag/v1.0.0
