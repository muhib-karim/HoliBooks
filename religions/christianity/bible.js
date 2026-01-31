/**
 * HoliBooks - Bible Module
 * Fetches Bible data from Free Bible API
 */

// API Configuration - Using wldeh/bible-api on GitHub
const API_BASE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';

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
        { id: '1-samuel', name: '1 Samuel', chapters: 31 },
        { id: '2-samuel', name: '2 Samuel', chapters: 24 },
        { id: '1-kings', name: '1 Kings', chapters: 22 },
        { id: '2-kings', name: '2 Kings', chapters: 25 },
        { id: '1-chronicles', name: '1 Chronicles', chapters: 29 },
        { id: '2-chronicles', name: '2 Chronicles', chapters: 36 },
        { id: 'ezra', name: 'Ezra', chapters: 10 },
        { id: 'nehemiah', name: 'Nehemiah', chapters: 13 },
        { id: 'esther', name: 'Esther', chapters: 10 },
        { id: 'job', name: 'Job', chapters: 42 },
        { id: 'psalms', name: 'Psalms', chapters: 150 },
        { id: 'proverbs', name: 'Proverbs', chapters: 31 },
        { id: 'ecclesiastes', name: 'Ecclesiastes', chapters: 12 },
        { id: 'song-of-solomon', name: 'Song of Solomon', chapters: 8 },
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
        { id: '1-corinthians', name: '1 Corinthians', chapters: 16 },
        { id: '2-corinthians', name: '2 Corinthians', chapters: 13 },
        { id: 'galatians', name: 'Galatians', chapters: 6 },
        { id: 'ephesians', name: 'Ephesians', chapters: 6 },
        { id: 'philippians', name: 'Philippians', chapters: 4 },
        { id: 'colossians', name: 'Colossians', chapters: 4 },
        { id: '1-thessalonians', name: '1 Thessalonians', chapters: 5 },
        { id: '2-thessalonians', name: '2 Thessalonians', chapters: 3 },
        { id: '1-timothy', name: '1 Timothy', chapters: 6 },
        { id: '2-timothy', name: '2 Timothy', chapters: 4 },
        { id: 'titus', name: 'Titus', chapters: 3 },
        { id: 'philemon', name: 'Philemon', chapters: 1 },
        { id: 'hebrews', name: 'Hebrews', chapters: 13 },
        { id: 'james', name: 'James', chapters: 5 },
        { id: '1-peter', name: '1 Peter', chapters: 5 },
        { id: '2-peter', name: '2 Peter', chapters: 3 },
        { id: '1-john', name: '1 John', chapters: 5 },
        { id: '2-john', name: '2 John', chapters: 1 },
        { id: '3-john', name: '3 John', chapters: 1 },
        { id: 'jude', name: 'Jude', chapters: 1 },
        { id: 'revelation', name: 'Revelation', chapters: 22 }
    ]
};

const ALL_BOOKS = [...BIBLE_BOOKS.oldTestament, ...BIBLE_BOOKS.newTestament];

// Bible versions
const VERSIONS = [
    { code: 'en-kjv', name: 'King James Version', lang: 'English' },
    { code: 'en-web', name: 'World English Bible', lang: 'English' },
    { code: 'en-asv', name: 'American Standard Version', lang: 'English' },
    { code: 'en-bbe', name: 'Bible in Basic English', lang: 'English' },
];

// State
let currentBook = 'genesis';
let currentChapter = 1;
let currentVersion = 'en-kjv';

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

// Initialize
async function init() {
    try {
        // Load saved preferences
        const savedBook = HoliBooks.storage.get('bible_book');
        const savedChapter = HoliBooks.storage.get('bible_chapter');
        const savedVersion = HoliBooks.storage.get('bible_version');

        if (savedBook) currentBook = savedBook;
        if (savedChapter) currentChapter = savedChapter;
        if (savedVersion) currentVersion = savedVersion;

        // Check URL params
        const params = HoliBooks.getQueryParams();
        if (params.book) {
            const bookId = params.book.toLowerCase();
            const bookExists = ALL_BOOKS.some(b => b.id === bookId);
            if (bookExists) {
                currentBook = bookId;
            }
        }
        if (params.chapter) {
            const chapterNum = parseInt(params.chapter);
            const book = ALL_BOOKS.find(b => b.id === currentBook);
            if (book && chapterNum >= 1 && chapterNum <= book.chapters) {
                currentChapter = chapterNum;
            }
        }

        // Populate dropdowns
        populateBookDropdown();
        updateChapterDropdown();

        // Load chapter
        await loadChapter();

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Failed to initialize:', error);
        HoliBooks.showError(versesContainer, 'Failed to load Bible data. Please refresh the page.');
    }
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
    const book = ALL_BOOKS.find(b => b.id === currentBook);
    if (!book) return;

    chapterSelect.innerHTML = Array.from({ length: book.chapters }, (_, i) =>
        `<option value="${i + 1}">${i + 1}</option>`
    ).join('');

    chapterSelect.value = currentChapter;
}

async function loadChapter() {
    HoliBooks.showLoading(versesContainer, 'Loading chapter...');

    try {
        const book = ALL_BOOKS.find(b => b.id === currentBook);
        if (!book) throw new Error('Book not found');

        // Fetch chapter data with retry
        const url = `${API_BASE}/${currentVersion}/books/${currentBook}/chapters/${currentChapter}.json`;
        const data = await HoliBooks.fetchWithRetry(url, {}, 2);

        // Update UI
        updateChapterInfo(book, data);
        renderVerses(data);
        updateNavigationState();

        // Save state
        HoliBooks.storage.set('bible_book', currentBook);
        HoliBooks.storage.set('bible_chapter', currentChapter);

        // Scroll to top
        HoliBooks.scrollToTop();

    } catch (error) {
        console.error('Failed to load chapter:', error);
        // Use fallback sample data for demonstration
        const fallbackVerses = getFallbackVerses(currentBook, currentChapter);
        if (fallbackVerses) {
            const book = ALL_BOOKS.find(b => b.id === currentBook);
            updateChapterInfo(book, { data: fallbackVerses });
            renderVerses({ data: fallbackVerses });
            updateNavigationState();
            versesContainer.innerHTML = `
                <div class="loading" style="color: var(--text-muted); padding: 20px; text-align: center; font-size: 0.9rem;">
                    ⚠️ Live API unavailable (CORS). Showing sample data.<br>
                    <small>Run with a local server for full content.</small>
                </div>
            ` + versesContainer.innerHTML;
        } else {
            versesContainer.innerHTML = `
                <div class="loading" style="color: var(--text-secondary);">
                    <p>📖 ${getBookName(currentBook)} Chapter ${currentChapter}</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">
                        API unavailable. Please run with a local server.
                    </p>
                    <button class="btn btn-primary" onclick="loadChapter()" style="margin-top: 20px;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Fallback sample data for when API is blocked
function getFallbackVerses(bookId, chapter) {
    if (bookId === 'genesis' && chapter === 1) {
        return [
            { verse: 1, text: 'In the beginning God created the heaven and the earth.' },
            { verse: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep.' },
            { verse: 3, text: 'And God said, Let there be light: and there was light.' },
            { verse: 4, text: 'And God saw the light, that it was good: and God divided the light from the darkness.' },
            { verse: 5, text: 'And God called the light Day, and the darkness he called Night.' }
        ];
    }
    return null;
}

function getBookName(bookId) {
    const book = ALL_BOOKS.find(b => b.id === bookId);
    return book ? book.name : bookId;
}

function updateChapterInfo(book, data) {
    chapterTitle.textContent = `${book.name} ${currentChapter}`;

    const isOldTestament = BIBLE_BOOKS.oldTestament.some(b => b.id === currentBook);
    testamentBadge.textContent = isOldTestament ? 'Old Testament' : 'New Testament';

    const verses = data.data || data.verses || [];
    versesCount.textContent = `${verses.length} Verses`;
}

function renderVerses(data) {
    const verses = data.data || data.verses || [];

    if (verses.length === 0) {
        versesContainer.innerHTML = '<p class="loading">No verses found for this chapter.</p>';
        return;
    }

    // Render as continuous text with verse numbers (traditional Bible style)
    let html = '<div class="bible-verses">';

    verses.forEach(verse => {
        html += `
            <span class="bible-verse">
                <sup class="bible-verse-number">${verse.verse}</sup>
                <span class="bible-verse-text">${verse.text} </span>
            </span>
        `;
    });

    html += '</div>';
    versesContainer.innerHTML = html;
}

function updateNavigationState() {
    const book = ALL_BOOKS.find(b => b.id === currentBook);
    const bookIndex = ALL_BOOKS.findIndex(b => b.id === currentBook);

    // Previous button: disabled if first chapter of first book
    prevBtn.disabled = bookIndex === 0 && currentChapter === 1;

    // Next button: disabled if last chapter of last book
    nextBtn.disabled = bookIndex === ALL_BOOKS.length - 1 && currentChapter === book.chapters;
}

function goToPreviousChapter() {
    if (currentChapter > 1) {
        currentChapter--;
    } else {
        // Go to previous book's last chapter
        const bookIndex = ALL_BOOKS.findIndex(b => b.id === currentBook);
        if (bookIndex > 0) {
            const prevBook = ALL_BOOKS[bookIndex - 1];
            currentBook = prevBook.id;
            currentChapter = prevBook.chapters;
            bookSelect.value = currentBook;
            updateChapterDropdown();
        }
    }
    chapterSelect.value = currentChapter;
    loadChapter();
}

function goToNextChapter() {
    const book = ALL_BOOKS.find(b => b.id === currentBook);

    if (currentChapter < book.chapters) {
        currentChapter++;
    } else {
        // Go to next book's first chapter
        const bookIndex = ALL_BOOKS.findIndex(b => b.id === currentBook);
        if (bookIndex < ALL_BOOKS.length - 1) {
            const nextBook = ALL_BOOKS[bookIndex + 1];
            currentBook = nextBook.id;
            currentChapter = 1;
            bookSelect.value = currentBook;
            updateChapterDropdown();
        }
    }
    chapterSelect.value = currentChapter;
    loadChapter();
}

function setupEventListeners() {
    // Book selection
    bookSelect.addEventListener('change', (e) => {
        currentBook = e.target.value;
        currentChapter = 1;
        updateChapterDropdown();
        loadChapter();
    });

    // Chapter selection
    chapterSelect.addEventListener('change', (e) => {
        currentChapter = parseInt(e.target.value);
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
        window.languageSelector.open('christianity', (newVersion) => {
            currentVersion = 'en-' + newVersion;
            HoliBooks.storage.set('bible_version', currentVersion);
            currentVersionSpan.textContent = newVersion.toUpperCase();
            loadChapter();
        });
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        HoliBooks.theme.toggle();
    });

    // Mobile Menu
    setupMobileMenu();
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
            window.languageSelector.open('christianity', (newVersion) => {
                currentVersion = 'en-' + newVersion;
                HoliBooks.storage.set('bible_version', currentVersion);
                currentVersionSpan.textContent = newVersion.toUpperCase();
                document.getElementById('mobile-current-version').textContent = newVersion.toUpperCase();
                loadChapter();
            });
        }, 300);
    });

    // Mobile theme toggle
    mobileThemeBtn.addEventListener('click', () => {
        HoliBooks.theme.toggle();
        updateMobileThemeText();
    });

    function updateMobileThemeText() {
        const isDark = document.documentElement.classList.contains('dark');
        document.getElementById('mobile-theme-text').textContent = isDark ? 'Dark Mode' : 'Light Mode';
    }

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
