# Multi-Language Support Implementation Plan

## Goal: Make ALL religions accessible in multiple languages

## Current Status:
- ✅ Quran: 90+ languages (via AlQuran Cloud API)
- ✅ Bible: 200+ versions (via jsDelivr Bible API)
- ✅ Gita: Sanskrit + English/Hindi
- ⚠️ Torah: English only (Bible API limitation)
- ⚠️ Gurbani: Punjabi/English limited
- ⚠️ Tripitaka: English only

## Implementation Strategy:

### 1. Quran (Already Multi-Language)
**Status:** ✅ Complete
- AlQuran Cloud API provides 90+ language editions
- Language selector already implemented

### 2. Bible (Already Multi-Language)
**Status:** ✅ Complete  
- Bible API supports 200+ versions
- Version selector already implemented

### 3. Bhagavad Gita (Enhanced)
**Status:** ✅ Recently Added
- Sanskrit (original)
- English translation
- Hindi translation

### 4. Torah (Needs Multi-Language)
**Implementation:**
- Primary: English (Bible API)
- Add Hebrew text display (static for key verses)
- Add Spanish, French, German via Bible API versions
- Add language selector with available options

**API Strategy:**
```
English: en-kjv (King James Version)
Spanish: es-bes (Biblia en Español)
French: fr-lsg (Louis Segond)
German: de-lut (Luther Bible)
```

### 5. Guru Granth Sahib (Needs Multi-Language)
**Implementation:**
- Gurmukhi (original script)
- Punjabi transliteration
- English translation
- Hindi translation

**Approach:**
- Use GurbaniNow API with different endpoints
- Store multiple language responses
- Add language toggle

### 6. Tripitaka/Dhammapada (Needs Multi-Language)
**Implementation:**
- Pali (original)
- English translation
- Add Hindi, Thai translations via additional sources

**Approach:**
- Extend existing embedded JSON
- Add translation layers
- Language selector

## Technical Implementation:

### Language Selector Component (Universal)
```html
<button class="language-btn" id="language-btn">
    <svg><!-- globe icon --></svg>
    <span id="current-language">English</span>
</button>

<div class="language-dropdown" id="language-dropdown">
    <div class="language-option" data-lang="en">English</div>
    <div class="language-option" data-lang="es">Español</div>
    <div class="language-option" data-lang="fr">Français</div>
    <!-- etc -->
</div>
```

### Storage Strategy:
```javascript
// localStorage keys
{religion}_language: "en"
{religion}_script: "original" // for dual-script languages
```

## Files to Modify:

1. **religions/judaism/torah.html + torah.js**
   - Add language selector
   - Support multiple Bible API versions
   - Add Hebrew text display

2. **religions/sikhism/gurbani.html + gurbani.js**
   - Enhance API calls for multiple languages
   - Add language toggle
   - Support Gurmukhi/English/Punjabi/Hindi

3. **religions/buddhism/tripitaka.html + tripitaka.js**
   - Add language selector
   - Extend JSON data with translations
   - Support Pali/English/Hindi/Thai

4. **css/global.css**
   - Add language selector styles
   - Consistent dropdown styling

## Priority Order:
1. Torah (English + Hebrew + 3 European languages)
2. Gurbani (4 languages)
3. Tripitaka (4 languages)
