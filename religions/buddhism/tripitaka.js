/**
 * HoliBooks - Dhammapada Module
 * Reads the verses from dhammapada-data.js (SuttaCentral, CC0), which the
 * page loads before this script.
 */

// Dhammapada chapters data
const CHAPTERS = [
    { number: 1, pali: 'Yamaka Vagga', english: 'The Pairs', verses: [1, 20] },
    { number: 2, pali: 'Appamāda Vagga', english: 'Heedfulness', verses: [21, 32] },
    { number: 3, pali: 'Citta Vagga', english: 'The Mind', verses: [33, 43] },
    { number: 4, pali: 'Puppha Vagga', english: 'Flowers', verses: [44, 59] },
    { number: 5, pali: 'Bāla Vagga', english: 'Fools', verses: [60, 75] },
    { number: 6, pali: 'Paṇḍita Vagga', english: 'The Wise', verses: [76, 89] },
    { number: 7, pali: 'Arahanta Vagga', english: 'The Arahant', verses: [90, 99] },
    { number: 8, pali: 'Sahassa Vagga', english: 'Thousands', verses: [100, 115] },
    { number: 9, pali: 'Pāpa Vagga', english: 'Evil', verses: [116, 128] },
    { number: 10, pali: 'Daṇḍa Vagga', english: 'Violence', verses: [129, 145] },
    { number: 11, pali: 'Jarā Vagga', english: 'Old Age', verses: [146, 156] },
    { number: 12, pali: 'Atta Vagga', english: 'The Self', verses: [157, 166] },
    { number: 13, pali: 'Loka Vagga', english: 'The World', verses: [167, 178] },
    { number: 14, pali: 'Buddha Vagga', english: 'The Buddha', verses: [179, 196] },
    { number: 15, pali: 'Sukha Vagga', english: 'Happiness', verses: [197, 208] },
    { number: 16, pali: 'Piya Vagga', english: 'Affection', verses: [209, 220] },
    { number: 17, pali: 'Kodha Vagga', english: 'Anger', verses: [221, 234] },
    { number: 18, pali: 'Mala Vagga', english: 'Impurity', verses: [235, 255] },
    { number: 19, pali: 'Dhammaṭṭha Vagga', english: 'The Just', verses: [256, 272] },
    { number: 20, pali: 'Magga Vagga', english: 'The Path', verses: [273, 289] },
    { number: 21, pali: 'Pakiṇṇaka Vagga', english: 'Miscellaneous', verses: [290, 305] },
    { number: 22, pali: 'Niraya Vagga', english: 'Hell', verses: [306, 319] },
    { number: 23, pali: 'Nāga Vagga', english: 'The Elephant', verses: [320, 333] },
    { number: 24, pali: 'Taṇhā Vagga', english: 'Craving', verses: [334, 359] },
    { number: 25, pali: 'Bhikkhu Vagga', english: 'The Monk', verses: [360, 382] },
    { number: 26, pali: 'Brāhmaṇa Vagga', english: 'The Brahmin', verses: [383, 423] }
];

// Language modes
const LANGUAGE_MODES = {
    'both': { name: 'Pali + English', showPali: true, showEnglish: true },
    'pali': { name: 'Pali Only', showPali: true, showEnglish: false },
    'english': { name: 'English Only', showPali: false, showEnglish: true }
};

// All 423 verses: [{ num, pali, english }], lines separated by "\n".
const VERSES = Array.isArray(window.DHAMMAPADA_VERSES) ? window.DHAMMAPADA_VERSES : [];
const TOTAL_VERSES = 423;

let currentChapter = 1;
let currentLanguageMode = 'both';
let highlightedVerse = null;

const chapterSelect = document.getElementById('chapter-select');
const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
const chapterPali = document.getElementById('chapter-pali');
const chapterEnglish = document.getElementById('chapter-english');
const verseCount = document.getElementById('verse-count');
const versesContainer = document.getElementById('verses-container');
const themeToggle = document.getElementById('theme-toggle');
const languageBtn = document.getElementById('language-btn');
const currentLanguageSpan = document.getElementById('current-language');

async function init() {
    // Load saved preferences (range-checked: storage can hold anything)
    currentChapter = HoliBooks.clampInt(HoliBooks.storage.get('dhammapada_chapter'), 1, CHAPTERS.length, 1);
    const savedLanguage = HoliBooks.storage.get('dhammapada_language');
    if (typeof savedLanguage === 'string' && LANGUAGE_MODES[savedLanguage]) currentLanguageMode = savedLanguage;

    // Check URL params
    const params = HoliBooks.getQueryParams();
    currentChapter = HoliBooks.clampInt(params.chapter, 1, CHAPTERS.length, currentChapter);

    const verseNum = HoliBooks.clampInt(params.verse, 1, TOTAL_VERSES, null);
    if (verseNum !== null) {
        // Open the chapter that contains this verse and mark the verse
        const chapter = CHAPTERS.find(ch => verseNum >= ch.verses[0] && verseNum <= ch.verses[1]);
        currentChapter = chapter.number;
        highlightedVerse = verseNum;
    }

    populateChapterDropdown();
    updateLanguageButton();
    updateMobileLanguageButtons();
    setupEventListeners();
    await loadChapter(currentChapter);
}

function populateChapterDropdown() {
    chapterSelect.innerHTML = CHAPTERS.map(ch =>
        `<option value="${ch.number}">Chapter ${ch.number}: ${ch.english}</option>`
    ).join('');
    chapterSelect.value = currentChapter;
}

function versesOf(chapter) {
    const [first, last] = chapter.verses;
    return VERSES.filter(v => v.num >= first && v.num <= last);
}

async function loadChapter(chapterNum) {
    const number = HoliBooks.clampInt(chapterNum, 1, CHAPTERS.length, null);
    if (number === null) return;
    currentChapter = number;

    const chapter = CHAPTERS[number - 1];

    // Update chapter info
    chapterPali.textContent = chapter.pali;
    chapterEnglish.textContent = chapter.english;
    const verseRange = chapter.verses;
    verseCount.textContent = `Verses ${verseRange[0]} - ${verseRange[1]}`;

    renderVerses(versesOf(chapter));

    updateNavigation();
    HoliBooks.storage.set('dhammapada_chapter', number);
    chapterSelect.value = number;

    if (highlightedVerse !== null && highlightedVerse >= verseRange[0] && highlightedVerse <= verseRange[1]) {
        highlightVerse(highlightedVerse);
    } else {
        HoliBooks.scrollToTop();
    }
    highlightedVerse = null;
}

function renderVerses(verses) {
    const mode = LANGUAGE_MODES[currentLanguageMode];

    if (verses.length === 0) {
        // dhammapada-data.js did not load (offline before the first visit, or blocked)
        HoliBooks.showError(
            versesContainer,
            'The Dhammapada text could not be loaded. Check your connection and reload the page.',
            () => window.location.reload()
        );
        return;
    }

    // Escaped like all other text; line breaks inside a verse become <br>.
    const lines = (text) => HoliBooks.escapeHTML(text).replace(/\n/g, '<br>');

    let html = '';
    verses.forEach(verse => {
        html += `
            <article class="gatha-card" id="verse-${verse.num}">
                <span class="gatha-number">Verse ${verse.num}</span>
                ${mode.showPali && verse.pali ? `<p class="gatha-pali" lang="pi">${lines(verse.pali)}</p>` : ''}
                ${mode.showEnglish && verse.english ? `<p class="gatha-translation">${lines(verse.english)}</p>` : ''}
            </article>
        `;
    });

    html += `
        <p class="translation-credit" style="color: var(--text-muted); font-size: 0.8rem; text-align: center; margin-top: var(--space-lg);">
            Pali: Mahāsaṅgīti edition. English: Bhikkhu Sujato. Both from SuttaCentral, public domain (CC0).
        </p>
    `;

    versesContainer.innerHTML = html;
}

function highlightVerse(verseNum) {
    const card = document.getElementById(`verse-${verseNum}`);
    if (!card) return;
    card.classList.add('highlighted');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateNavigation() {
    prevBtn.disabled = currentChapter <= 1;
    nextBtn.disabled = currentChapter >= 26;
}

function changeLanguageMode(mode) {
    if (LANGUAGE_MODES[mode]) {
        currentLanguageMode = mode;
        HoliBooks.storage.set('dhammapada_language', currentLanguageMode);
        updateLanguageButton();
        updateMobileLanguageButtons();
        
        // Re-render current chapter
        renderVerses(versesOf(CHAPTERS[currentChapter - 1]));
    }
}

function updateLanguageButton() {
    const mode = LANGUAGE_MODES[currentLanguageMode];
    if (mode) {
        currentLanguageSpan.textContent = mode.name;
    }
}

function updateMobileLanguageButtons() {
    document.querySelectorAll('.mobile-language-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguageMode);
    });
}

function setupEventListeners() {
    chapterSelect.addEventListener('change', (e) => {
        loadChapter(parseInt(e.target.value));
    });

    prevBtn.addEventListener('click', () => {
        if (currentChapter > 1) loadChapter(currentChapter - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentChapter < 26) loadChapter(currentChapter + 1);
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'SELECT') return;
        if (e.key === 'ArrowLeft' && currentChapter > 1) loadChapter(currentChapter - 1);
        if (e.key === 'ArrowRight' && currentChapter < 26) loadChapter(currentChapter + 1);
    });

    themeToggle.addEventListener('click', () => {
        HoliBooks.theme.toggle();
        updateThemeIcons();
    });

    // Language selector button
    languageBtn.addEventListener('click', () => {
        // Cycle through language modes
        const modes = Object.keys(LANGUAGE_MODES);
        const currentIndex = modes.indexOf(currentLanguageMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        changeLanguageMode(modes[nextIndex]);
    });

    // Mobile Menu
    setupMobileMenu();

    updateThemeIcons();
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileThemeBtn = document.getElementById('mobile-theme-btn');

    function openMobileMenu() {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    mobileMenuBtn.addEventListener('click', openMobileMenu);
    mobileMenuClose.addEventListener('click', closeMobileMenu);
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);

    // Mobile language options
    document.querySelectorAll('.mobile-language-option').forEach(btn => {
        btn.addEventListener('click', () => {
            changeLanguageMode(btn.dataset.lang);
            closeMobileMenu();
        });
    });

    // Mobile theme toggle
    mobileThemeBtn.addEventListener('click', () => {
        HoliBooks.theme.toggle();
        updateThemeIcons();
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

function updateThemeIcons() {
    const isDark = HoliBooks.theme.current === 'dark';
    
    // Desktop theme icons
    const themeIconDark = document.getElementById('theme-icon-dark');
    const themeIconLight = document.getElementById('theme-icon-light');
    if (themeIconDark && themeIconLight) {
        themeIconDark.style.display = isDark ? 'block' : 'none';
        themeIconLight.style.display = isDark ? 'none' : 'block';
    }

    // Mobile theme button
    const mobileThemeText = document.getElementById('mobile-theme-text');
    const mobileThemeIcon = document.getElementById('mobile-theme-icon');
    if (mobileThemeText) {
        mobileThemeText.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    }
    if (mobileThemeIcon) {
        mobileThemeIcon.innerHTML = isDark 
            ? '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>'
            : '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>';
    }
}

document.addEventListener('DOMContentLoaded', init);
