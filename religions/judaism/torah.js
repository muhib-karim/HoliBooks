/**
 * HoliBooks - Torah Module
 * Using Free Bible API for Torah/Pentateuch with multi-language support
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

// Language configurations
const LANGUAGES = {
    'en-kjv': { code: 'en-kjv', name: 'English', translator: 'King James Version' },
    'es-rvr1960': { code: 'es-rvr1960', name: 'Español', translator: 'Reina Valera 1960' },
    'fr-lsg': { code: 'fr-lsg', name: 'Français', translator: 'Louis Segond' },
    'de-lut': { code: 'de-lut', name: 'Deutsch', translator: 'Luther Bible' }
};

let currentBook = 'genesis';
let currentChapter = 1;
let currentLanguage = 'en-kjv';

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
    // Load saved preferences
    const savedBook = HoliBooks.storage.get('torah_book');
    const savedChapter = HoliBooks.storage.get('torah_chapter');
    const savedLanguage = HoliBooks.storage.get('torah_language');

    if (savedBook) currentBook = savedBook;
    if (savedChapter) currentChapter = savedChapter;
    if (savedLanguage && LANGUAGES[savedLanguage]) currentLanguage = savedLanguage;

    // Check URL params
    const params = HoliBooks.getQueryParams();
    if (params.book) {
        const bookId = params.book.toLowerCase();
        const bookExists = TORAH_BOOKS.some(b => b.id === bookId);
        if (bookExists) {
            currentBook = bookId;
        }
    }
    if (params.chapter) {
        const chapterNum = parseInt(params.chapter);
        const book = TORAH_BOOKS.find(b => b.id === currentBook);
        if (book && chapterNum >= 1 && chapterNum <= book.chapters) {
            currentChapter = chapterNum;
        }
    }

    populateBookDropdown();
    updateChapterDropdown();
    updateLanguageButton();
    updateMobileLanguageButtons();
    await loadChapter();
    setupEventListeners();
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
    HoliBooks.showLoading(versesContainer, 'Loading chapter...');

    try {
        const book = TORAH_BOOKS.find(b => b.id === currentBook);
        const url = `${API_BASE}/${currentLanguage}/books/${currentBook}/chapters/${currentChapter}.json`;
        const response = await HoliBooks.fetchWithRetry(url, {}, 2);

        // API returns {data: [...]} not {verses: [...]}
        const verses = response.data || response.verses || [];
        const data = { verses: verses };

        chapterTitle.textContent = `${book.hebrew} - ${book.name} Chapter ${currentChapter}`;
        verseCount.textContent = `${verses.length} Verses`;

        renderVerses(data);
        updateNavigation();

        // Save state
        HoliBooks.storage.set('torah_book', currentBook);
        HoliBooks.storage.set('torah_chapter', currentChapter);
        HoliBooks.storage.set('torah_language', currentLanguage);
        
        HoliBooks.scrollToTop();

    } catch (error) {
        console.error('Failed to load:', error);
        // Use fallback sample data
        const book = TORAH_BOOKS.find(b => b.id === currentBook);
        const fallbackData = getFallbackVerses(currentBook, currentChapter);
        if (fallbackData) {
            chapterTitle.textContent = `${book.hebrew} - ${book.name} Chapter ${currentChapter}`;
            verseCount.textContent = `${fallbackData.verses.length} Verses`;
            renderVerses(fallbackData);
            updateNavigation();
            versesContainer.innerHTML = `
                <div style="color: var(--text-muted); padding: 20px; text-align: center; font-size: 0.9rem; border-radius: 12px; background: var(--bg-card); margin-bottom: 20px;">
                    ⚠️ Live API unavailable. Showing sample data.<br>
                    <small>The full Torah will load when API is accessible.</small>
                </div>
            ` + versesContainer.innerHTML;
        } else {
            HoliBooks.showError(versesContainer, 'Failed to load chapter. Please try again.', loadChapter);
        }
    }
}

// Fallback sample data for when API is blocked
function getFallbackVerses(bookId, chapter) {
    if (bookId === 'genesis' && chapter === 1) {
        return {
            verses: [
                { verse: 1, text: 'In the beginning God created the heaven and the earth.' },
                { verse: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep.' },
                { verse: 3, text: 'And God said, Let there be light: and there was light.' },
                { verse: 4, text: 'And God saw the light, that it was good: and God divided the light from the darkness.' },
                { verse: 5, text: 'And God called the light Day, and the darkness he called Night.' }
            ]
        };
    }
    return null;
}

function renderVerses(data) {
    const verses = data.verses || data.data || [];

    if (verses.length === 0) {
        versesContainer.innerHTML = '<p class="loading">No verses found</p>';
        return;
    }

    let html = '';
    verses.forEach(v => {
        const verseNum = v.verse || v.number || '';
        const verseText = v.text || '';
        html += `
            <article class="verse-card">
                <div class="verse-number">${verseNum}</div>
                <div class="verse-content">
                    <p class="translation-text">${verseText}</p>
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
    if (currentChapter > 1) {
        currentChapter--;
    } else {
        const bookIndex = TORAH_BOOKS.findIndex(b => b.id === currentBook);
        if (bookIndex > 0) {
            const prevBook = TORAH_BOOKS[bookIndex - 1];
            currentBook = prevBook.id;
            currentChapter = prevBook.chapters;
            bookSelect.value = currentBook;
            updateChapterDropdown();
        }
    }
    chapterSelect.value = currentChapter;
    loadChapter();
}

function goToNext() {
    const book = TORAH_BOOKS.find(b => b.id === currentBook);

    if (currentChapter < book.chapters) {
        currentChapter++;
    } else {
        const bookIndex = TORAH_BOOKS.findIndex(b => b.id === currentBook);
        if (bookIndex < TORAH_BOOKS.length - 1) {
            const nextBook = TORAH_BOOKS[bookIndex + 1];
            currentBook = nextBook.id;
            currentChapter = 1;
            bookSelect.value = currentBook;
            updateChapterDropdown();
        }
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
        currentBook = e.target.value;
        currentChapter = 1;
        updateChapterDropdown();
        loadChapter();
    });

    chapterSelect.addEventListener('change', (e) => {
        currentChapter = parseInt(e.target.value);
        loadChapter();
    });

    prevBtn.addEventListener('click', goToPrev);
    nextBtn.addEventListener('click', goToNext);

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'SELECT') return;
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
