/**
 * HoliBooks - Torah Module
 * Reads the Pentateuch from wldeh/bible-api (served by jsDelivr)
 */

const API_BASE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';

// Torah Books Data
const TORAH_BOOKS = [
    { id: 'genesis', hebrew: 'בְּרֵאשִׁית', name: 'Genesis', meaning: 'In the Beginning', chapters: 50 },
    { id: 'exodus', hebrew: 'שְׁמוֹת', name: 'Exodus', meaning: 'Names', chapters: 40 },
    { id: 'leviticus', hebrew: 'וַיִּקְרָא', name: 'Leviticus', meaning: 'And He Called', chapters: 27 },
    { id: 'numbers', hebrew: 'בְּמִדְבַּר', name: 'Numbers', meaning: 'In the Wilderness', chapters: 36 },
    { id: 'deuteronomy', hebrew: 'דְּבָרִים', name: 'Deuteronomy', meaning: 'Words', chapters: 34 }
];

// Editions offered. Every code is a folder that exists upstream; the list is
// mirrored in torah.html and checked by tests/bible-torah.test.mjs.
const LANGUAGES = {
    'en-ojps': { code: 'en-ojps', name: 'English (JPS 1917)', translator: 'Jewish Publication Society, 1917', dir: 'ltr', lang: 'en' },
    'he-wlc': { code: 'he-wlc', name: 'עברית (Hebrew)', translator: 'Westminster Leningrad Codex', dir: 'rtl', lang: 'he' },
    'en-kjv': { code: 'en-kjv', name: 'English (KJV)', translator: 'King James Version', dir: 'ltr', lang: 'en' }
};
const DEFAULT_LANGUAGE = 'en-ojps';

let currentBook = 'genesis';
let currentChapter = 1;
let currentLanguage = DEFAULT_LANGUAGE;
const chapterRequests = HoliBooks.latestOnly();

function getBook(bookId) {
    return TORAH_BOOKS.find(b => b.id === bookId);
}

function normalizeBookId(value) {
    if (typeof value !== 'string') return null;
    const id = value.toLowerCase().replace(/[^a-z]/g, '');
    return getBook(id) ? id : null;
}

const bookSelect = document.getElementById('book-select');
const chapterSelect = document.getElementById('chapter-select');
const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
const chapterTitle = document.getElementById('chapter-title');
const verseCount = document.getElementById('verse-count');
const versesContainer = document.getElementById('verses-container');
const themeToggle = document.getElementById('theme-toggle');
const languageBtn = document.getElementById('language-btn');
const currentLanguageSpan = document.getElementById('current-language');

async function init() {
    // Saved position, then URL parameters on top of it
    let book = normalizeBookId(HoliBooks.storage.get('torah_book')) || 'genesis';
    let chapter = HoliBooks.storage.get('torah_chapter');
    const savedLanguage = HoliBooks.storage.get('torah_language');

    // Older builds saved languages that never existed upstream (es-rvr1960, fr-lsg, de-lut).
    if (typeof savedLanguage === 'string' && LANGUAGES[savedLanguage]) currentLanguage = savedLanguage;

    const params = HoliBooks.getQueryParams();
    const urlBook = normalizeBookId(params.book);
    if (urlBook && urlBook !== book) {
        // A saved chapter belongs to the saved book, not to this one.
        book = urlBook;
        chapter = 1;
    }
    if (params.chapter) chapter = params.chapter;

    currentBook = book;
    currentChapter = HoliBooks.clampInt(chapter, 1, getBook(book).chapters, 1);

    populateBookDropdown();
    updateChapterDropdown();
    updateLanguageButton();
    updateMobileLanguageButtons();
    setupEventListeners();
    await loadChapter();
}

function populateBookDropdown() {
    bookSelect.innerHTML = TORAH_BOOKS.map(book =>
        `<option value="${book.id}">${book.hebrew} - ${book.name}</option>`
    ).join('');
    bookSelect.value = currentBook;
}

function updateChapterDropdown() {
    const book = TORAH_BOOKS.find(b => b.id === currentBook);
    chapterSelect.innerHTML = Array.from({ length: book.chapters }, (_, i) =>
        `<option value="${i + 1}">${i + 1}</option>`
    ).join('');
    chapterSelect.value = currentChapter;
}

async function loadChapter() {
    const token = chapterRequests.next();
    const book = getBook(currentBook);
    const chapter = currentChapter;
    const language = currentLanguage;

    chapterTitle.textContent = `${book.hebrew} - ${book.name} Chapter ${chapter}`;
    updateNavigation();
    HoliBooks.showLoading(versesContainer, 'Loading chapter...');

    try {
        const url = `${API_BASE}/${language}/books/${book.id}/chapters/${chapter}.json`;
        const response = await HoliBooks.fetchWithRetry(url, {}, 2);

        // A newer request has started; this response is stale.
        if (!chapterRequests.isCurrent(token)) return;

        // API returns {data: [...]}; upstream repeats verses in some editions.
        const verses = HoliBooks.dedupeVerses(response.data || response.verses || []);

        verseCount.textContent = `${verses.length} Verses`;
        renderVerses(verses, LANGUAGES[language]);

        // Save state
        HoliBooks.storage.set('torah_book', book.id);
        HoliBooks.storage.set('torah_chapter', chapter);
        HoliBooks.storage.set('torah_language', language);

        HoliBooks.scrollToTop();

    } catch (error) {
        if (!chapterRequests.isCurrent(token)) return;
        console.error('Failed to load:', error);
        verseCount.textContent = '';
        HoliBooks.showError(
            versesContainer,
            `Could not load ${book.name} ${chapter}. Check your connection and try again.`,
            loadChapter
        );
    }
}

function renderVerses(verses, edition) {
    if (verses.length === 0) {
        versesContainer.innerHTML = '<p class="loading">No verses found</p>';
        return;
    }

    // Hebrew is set right-to-left in the Hebrew face; verse text is always escaped.
    const rtl = edition && edition.dir === 'rtl';
    const textClass = rtl ? 'translation-text text-hebrew' : 'translation-text';
    const textAttrs = rtl ? ` dir="rtl" lang="${edition.lang}"` : '';

    let html = '';
    verses.forEach(v => {
        const verseNum = v.verse || v.number || '';
        html += `
            <article class="verse-card">
                <div class="verse-number">${HoliBooks.escapeHTML(verseNum)}</div>
                <div class="verse-content">
                    <p class="${textClass}"${textAttrs}>${HoliBooks.escapeHTML(v.text || '')}</p>
                </div>
            </article>
        `;
    });

    versesContainer.innerHTML = html;
}

function updateNavigation() {
    const book = TORAH_BOOKS.find(b => b.id === currentBook);
    const bookIndex = TORAH_BOOKS.findIndex(b => b.id === currentBook);

    prevBtn.disabled = bookIndex === 0 && currentChapter === 1;
    nextBtn.disabled = bookIndex === TORAH_BOOKS.length - 1 && currentChapter === book.chapters;
}

function goToPrev() {
    const bookIndex = TORAH_BOOKS.findIndex(b => b.id === currentBook);
    if (currentChapter > 1) {
        currentChapter--;
    } else if (bookIndex > 0) {
        const prevBook = TORAH_BOOKS[bookIndex - 1];
        currentBook = prevBook.id;
        currentChapter = prevBook.chapters;
        bookSelect.value = currentBook;
        updateChapterDropdown();
    } else {
        return; // already at Genesis 1
    }
    chapterSelect.value = currentChapter;
    loadChapter();
}

function goToNext() {
    const book = TORAH_BOOKS.find(b => b.id === currentBook);

    const bookIndex = TORAH_BOOKS.findIndex(b => b.id === currentBook);
    if (currentChapter < book.chapters) {
        currentChapter++;
    } else if (bookIndex < TORAH_BOOKS.length - 1) {
        const nextBook = TORAH_BOOKS[bookIndex + 1];
        currentBook = nextBook.id;
        currentChapter = 1;
        bookSelect.value = currentBook;
        updateChapterDropdown();
    } else {
        return; // already at Deuteronomy 34
    }
    chapterSelect.value = currentChapter;
    loadChapter();
}

function changeLanguage(langCode) {
    if (LANGUAGES[langCode]) {
        currentLanguage = langCode;
        HoliBooks.storage.set('torah_language', currentLanguage);
        updateLanguageButton();
        updateMobileLanguageButtons();
        loadChapter();
    }
}

function updateLanguageButton() {
    const lang = LANGUAGES[currentLanguage];
    if (lang) {
        currentLanguageSpan.textContent = lang.name;
    }
}

function updateMobileLanguageButtons() {
    document.querySelectorAll('.mobile-language-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
}

function setupEventListeners() {
    bookSelect.addEventListener('change', (e) => {
        const bookId = normalizeBookId(e.target.value);
        if (!bookId) return;
        currentBook = bookId;
        currentChapter = 1;
        updateChapterDropdown();
        loadChapter();
    });

    chapterSelect.addEventListener('change', (e) => {
        currentChapter = HoliBooks.clampInt(e.target.value, 1, getBook(currentBook).chapters, 1);
        loadChapter();
    });

    prevBtn.addEventListener('click', goToPrev);
    nextBtn.addEventListener('click', goToNext);

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowLeft') goToPrev();
        if (e.key === 'ArrowRight') goToNext();
    });

    themeToggle.addEventListener('click', () => {
        HoliBooks.theme.toggle();
        updateThemeIcons();
    });

    // Language selector button
    languageBtn.addEventListener('click', () => {
        // Cycle through languages
        const langCodes = Object.keys(LANGUAGES);
        const currentIndex = langCodes.indexOf(currentLanguage);
        const nextIndex = (currentIndex + 1) % langCodes.length;
        changeLanguage(langCodes[nextIndex]);
    });

    // Mobile menu
    setupMobileMenu();

    updateThemeIcons();
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

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

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
    if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMobileMenu);

    // Mobile language options
    document.querySelectorAll('.mobile-language-option').forEach(btn => {
        btn.addEventListener('click', () => {
            changeLanguage(btn.dataset.lang);
            closeMobileMenu();
        });
    });

    // Mobile theme toggle
    const mobileThemeBtn = document.getElementById('mobile-theme-btn');
    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', () => {
            HoliBooks.theme.toggle();
            updateThemeIcons();
        });
    }
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
