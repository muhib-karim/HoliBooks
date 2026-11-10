/**
 * HoliBooks - Bible Module
 * Fetches Bible chapters from wldeh/bible-api (served by jsDelivr)
 */

// API Configuration - Using wldeh/bible-api on GitHub
const API_BASE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';

// Book IDs are the upstream folder names (lowercase, no hyphens or spaces).
// Bible Books Data
const BIBLE_BOOKS = {
    oldTestament: [
        { id: 'genesis', name: 'Genesis', chapters: 50 },
        { id: 'exodus', name: 'Exodus', chapters: 40 },
        { id: 'leviticus', name: 'Leviticus', chapters: 27 },
        { id: 'numbers', name: 'Numbers', chapters: 36 },
        { id: 'deuteronomy', name: 'Deuteronomy', chapters: 34 },
        { id: 'joshua', name: 'Joshua', chapters: 24 },
        { id: 'judges', name: 'Judges', chapters: 21 },
        { id: 'ruth', name: 'Ruth', chapters: 4 },
        { id: '1samuel', name: '1 Samuel', chapters: 31 },
        { id: '2samuel', name: '2 Samuel', chapters: 24 },
        { id: '1kings', name: '1 Kings', chapters: 22 },
        { id: '2kings', name: '2 Kings', chapters: 25 },
        { id: '1chronicles', name: '1 Chronicles', chapters: 29 },
        { id: '2chronicles', name: '2 Chronicles', chapters: 36 },
        { id: 'ezra', name: 'Ezra', chapters: 10 },
        { id: 'nehemiah', name: 'Nehemiah', chapters: 13 },
        { id: 'esther', name: 'Esther', chapters: 10 },
        { id: 'job', name: 'Job', chapters: 42 },
        { id: 'psalms', name: 'Psalms', chapters: 150 },
        { id: 'proverbs', name: 'Proverbs', chapters: 31 },
        { id: 'ecclesiastes', name: 'Ecclesiastes', chapters: 12 },
        { id: 'songofsolomon', name: 'Song of Solomon', chapters: 8 },
        { id: 'isaiah', name: 'Isaiah', chapters: 66 },
        { id: 'jeremiah', name: 'Jeremiah', chapters: 52 },
        { id: 'lamentations', name: 'Lamentations', chapters: 5 },
        { id: 'ezekiel', name: 'Ezekiel', chapters: 48 },
        { id: 'daniel', name: 'Daniel', chapters: 12 },
        { id: 'hosea', name: 'Hosea', chapters: 14 },
        { id: 'joel', name: 'Joel', chapters: 3 },
        { id: 'amos', name: 'Amos', chapters: 9 },
        { id: 'obadiah', name: 'Obadiah', chapters: 1 },
        { id: 'jonah', name: 'Jonah', chapters: 4 },
        { id: 'micah', name: 'Micah', chapters: 7 },
        { id: 'nahum', name: 'Nahum', chapters: 3 },
        { id: 'habakkuk', name: 'Habakkuk', chapters: 3 },
        { id: 'zephaniah', name: 'Zephaniah', chapters: 3 },
        { id: 'haggai', name: 'Haggai', chapters: 2 },
        { id: 'zechariah', name: 'Zechariah', chapters: 14 },
        { id: 'malachi', name: 'Malachi', chapters: 4 }
    ],
    newTestament: [
        { id: 'matthew', name: 'Matthew', chapters: 28 },
        { id: 'mark', name: 'Mark', chapters: 16 },
        { id: 'luke', name: 'Luke', chapters: 24 },
        { id: 'john', name: 'John', chapters: 21 },
        { id: 'acts', name: 'Acts', chapters: 28 },
        { id: 'romans', name: 'Romans', chapters: 16 },
        { id: '1corinthians', name: '1 Corinthians', chapters: 16 },
        { id: '2corinthians', name: '2 Corinthians', chapters: 13 },
        { id: 'galatians', name: 'Galatians', chapters: 6 },
        { id: 'ephesians', name: 'Ephesians', chapters: 6 },
        { id: 'philippians', name: 'Philippians', chapters: 4 },
        { id: 'colossians', name: 'Colossians', chapters: 4 },
        { id: '1thessalonians', name: '1 Thessalonians', chapters: 5 },
        { id: '2thessalonians', name: '2 Thessalonians', chapters: 3 },
        { id: '1timothy', name: '1 Timothy', chapters: 6 },
        { id: '2timothy', name: '2 Timothy', chapters: 4 },
        { id: 'titus', name: 'Titus', chapters: 3 },
        { id: 'philemon', name: 'Philemon', chapters: 1 },
        { id: 'hebrews', name: 'Hebrews', chapters: 13 },
        { id: 'james', name: 'James', chapters: 5 },
        { id: '1peter', name: '1 Peter', chapters: 5 },
        { id: '2peter', name: '2 Peter', chapters: 3 },
        { id: '1john', name: '1 John', chapters: 5 },
        { id: '2john', name: '2 John', chapters: 1 },
        { id: '3john', name: '3 John', chapters: 1 },
        { id: 'jude', name: 'Jude', chapters: 1 },
        { id: 'revelation', name: 'Revelation', chapters: 22 }
    ]
};

const ALL_BOOKS = [...BIBLE_BOOKS.oldTestament, ...BIBLE_BOOKS.newTestament];

// Bible versions. Only IDs that exist upstream are offered; the same list is
// shown by js/language-selector.js and checked by tests/bible-torah.test.mjs.
const VERSIONS = [
    { code: 'en-kjv', label: 'KJV', name: 'King James Version' },
    { code: 'en-web', label: 'WEB', name: 'World English Bible' },
    { code: 'en-asv', label: 'ASV', name: 'American Standard Version' }
];
const DEFAULT_VERSION = 'en-kjv';

// State
let currentBook = 'genesis';
let currentChapter = 1;
let currentVersion = DEFAULT_VERSION;
const chapterRequests = HoliBooks.latestOnly();

// DOM Elements
const bookSelect = document.getElementById('book-select');
const chapterSelect = document.getElementById('chapter-select');
const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
const chapterTitle = document.getElementById('chapter-title');
const testamentBadge = document.getElementById('testament-badge');
const versesCount = document.getElementById('verses-count');
const versesContainer = document.getElementById('verses-container');
const versionBtn = document.getElementById('version-btn');
const currentVersionSpan = document.getElementById('current-version');
const themeToggle = document.getElementById('theme-toggle');

/**
 * Map a book ID from a URL or saved state to an upstream ID.
 * Accepts the old hyphenated form ("1-corinthians") as well.
 * @param {*} value
 * @returns {string|null}
 */
function normalizeBookId(value) {
    if (typeof value !== 'string') return null;
    const id = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    return ALL_BOOKS.some(b => b.id === id) ? id : null;
}

/**
 * Map a saved or selected version to one that exists upstream.
 * Older builds saved IDs such as "en-lsg" that never existed.
 * @param {*} value
 * @returns {string}
 */
function resolveVersion(value) {
    const wanted = typeof value === 'string' ? value.toLowerCase() : '';
    const match = VERSIONS.find(v => v.code === wanted || v.code === `en-${wanted}`);
    return match ? match.code : DEFAULT_VERSION;
}

function getBook(bookId) {
    return ALL_BOOKS.find(b => b.id === bookId);
}

// Initialize
async function init() {
    // Saved position, then URL parameters on top of it
    let book = normalizeBookId(HoliBooks.storage.get('bible_book')) || 'genesis';
    let chapter = HoliBooks.storage.get('bible_chapter');

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
    currentVersion = resolveVersion(HoliBooks.storage.get('bible_version'));

    populateBookDropdown();
    updateChapterDropdown();
    updateVersionLabels();
    setupEventListeners();

    await loadChapter();
}

function populateBookDropdown() {
    let html = '<optgroup label="Old Testament">';
    BIBLE_BOOKS.oldTestament.forEach(book => {
        html += `<option value="${book.id}">${book.name}</option>`;
    });
    html += '</optgroup><optgroup label="New Testament">';
    BIBLE_BOOKS.newTestament.forEach(book => {
        html += `<option value="${book.id}">${book.name}</option>`;
    });
    html += '</optgroup>';

    bookSelect.innerHTML = html;
    bookSelect.value = currentBook;
}

function updateChapterDropdown() {
    const book = getBook(currentBook);
    if (!book) return;

    chapterSelect.innerHTML = Array.from({ length: book.chapters }, (_, i) =>
        `<option value="${i + 1}">${i + 1}</option>`
    ).join('');

    chapterSelect.value = currentChapter;
}

async function loadChapter() {
    const token = chapterRequests.next();
    const book = getBook(currentBook);
    const chapter = currentChapter;
    const version = currentVersion;

    updateChapterHeader(book, chapter);
    updateNavigationState();
    HoliBooks.showLoading(versesContainer, 'Loading chapter...');

    try {
        const url = `${API_BASE}/${version}/books/${book.id}/chapters/${chapter}.json`;
        const data = await HoliBooks.fetchWithRetry(url, {}, 2);

        // A newer request has started; this response is stale.
        if (!chapterRequests.isCurrent(token)) return;

        // Upstream repeats every verse (twice in KJV, four times in WEB).
        const verses = HoliBooks.dedupeVerses(data.data || data.verses || []);

        versesCount.textContent = `${verses.length} Verses`;
        renderVerses(verses);

        // Save state
        HoliBooks.storage.set('bible_book', book.id);
        HoliBooks.storage.set('bible_chapter', chapter);

        HoliBooks.scrollToTop();

    } catch (error) {
        if (!chapterRequests.isCurrent(token)) return;
        console.error('Failed to load chapter:', error);
        versesCount.textContent = '';
        HoliBooks.showError(
            versesContainer,
            `Could not load ${book.name} ${chapter}. Check your connection and try again.`,
            loadChapter
        );
    }
}

function getBookName(bookId) {
    const book = getBook(bookId);
    return book ? book.name : bookId;
}

function updateChapterHeader(book, chapter) {
    chapterTitle.textContent = `${book.name} ${chapter}`;

    const isOldTestament = BIBLE_BOOKS.oldTestament.some(b => b.id === book.id);
    testamentBadge.textContent = isOldTestament ? 'Old Testament' : 'New Testament';
}

function renderVerses(verses) {
    if (verses.length === 0) {
        versesContainer.innerHTML = '<p class="loading">No verses found for this chapter.</p>';
        return;
    }

    // Render as continuous text with verse numbers (traditional Bible style).
    // Verse text comes from a third-party API, so it is always escaped.
    let html = '<div class="bible-verses">';

    verses.forEach(verse => {
        html += `
            <span class="bible-verse">
                <sup class="bible-verse-number">${HoliBooks.escapeHTML(verse.verse)}</sup>
                <span class="bible-verse-text">${HoliBooks.escapeHTML(verse.text)} </span>
            </span>
        `;
    });

    html += '</div>';
    versesContainer.innerHTML = html;
}

function updateNavigationState() {
    const book = getBook(currentBook);
    const bookIndex = ALL_BOOKS.findIndex(b => b.id === currentBook);

    // Previous button: disabled if first chapter of first book
    prevBtn.disabled = bookIndex === 0 && currentChapter === 1;

    // Next button: disabled if last chapter of last book
    nextBtn.disabled = bookIndex === ALL_BOOKS.length - 1 && currentChapter === book.chapters;
}

function goToPreviousChapter() {
    const bookIndex = ALL_BOOKS.findIndex(b => b.id === currentBook);

    if (currentChapter > 1) {
        currentChapter--;
    } else if (bookIndex > 0) {
        // Go to previous book's last chapter
        const prevBook = ALL_BOOKS[bookIndex - 1];
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

function goToNextChapter() {
    const book = getBook(currentBook);
    const bookIndex = ALL_BOOKS.findIndex(b => b.id === currentBook);

    if (currentChapter < book.chapters) {
        currentChapter++;
    } else if (bookIndex < ALL_BOOKS.length - 1) {
        // Go to next book's first chapter
        const nextBook = ALL_BOOKS[bookIndex + 1];
        currentBook = nextBook.id;
        currentChapter = 1;
        bookSelect.value = currentBook;
        updateChapterDropdown();
    } else {
        return; // already at Revelation 22
    }
    chapterSelect.value = currentChapter;
    loadChapter();
}

function updateVersionLabels() {
    const version = VERSIONS.find(v => v.code === currentVersion) || VERSIONS[0];
    currentVersionSpan.textContent = version.label;
    document.getElementById('mobile-current-version').textContent = version.label;
}

function chooseVersion(code) {
    currentVersion = resolveVersion(code);
    HoliBooks.storage.set('bible_version', currentVersion);
    updateVersionLabels();
    loadChapter();
}

function setupEventListeners() {
    // Book selection
    bookSelect.addEventListener('change', (e) => {
        const bookId = normalizeBookId(e.target.value);
        if (!bookId) return;
        currentBook = bookId;
        currentChapter = 1;
        updateChapterDropdown();
        loadChapter();
    });

    // Chapter selection
    chapterSelect.addEventListener('change', (e) => {
        currentChapter = HoliBooks.clampInt(e.target.value, 1, getBook(currentBook).chapters, 1);
        loadChapter();
    });

    // Navigation
    prevBtn.addEventListener('click', goToPreviousChapter);
    nextBtn.addEventListener('click', goToNextChapter);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        if (e.key === 'ArrowLeft') {
            goToPreviousChapter();
        } else if (e.key === 'ArrowRight') {
            goToNextChapter();
        }
    });

    // Version selector
    versionBtn.addEventListener('click', () => {
        window.languageSelector.open('christianity', chooseVersion);
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        HoliBooks.theme.toggle();
        updateMobileThemeText();
    });

    // Mobile Menu
    setupMobileMenu();
}

function updateMobileThemeText() {
    const isDark = HoliBooks.theme.current === 'dark';
    document.getElementById('mobile-theme-text').textContent = isDark ? 'Dark Mode' : 'Light Mode';
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileVersionBtn = document.getElementById('mobile-version-btn');
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

    // Mobile version selector
    mobileVersionBtn.addEventListener('click', () => {
        closeMobileMenu();
        setTimeout(() => {
            window.languageSelector.open('christianity', chooseVersion);
        }, 300);
    });

    // Mobile theme toggle
    mobileThemeBtn.addEventListener('click', () => {
        HoliBooks.theme.toggle();
        updateMobileThemeText();
    });

    // Initial theme text update
    updateMobileThemeText();

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
