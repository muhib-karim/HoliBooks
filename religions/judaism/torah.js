/**
 * HoliBooks - Torah Module
 * Using Free Bible API for Torah/Pentateuch
 */

const API_BASE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books';

const TORAH_BOOKS = [
    { id: 'genesis', hebrew: 'בְּרֵאשִׁית', name: 'Genesis', meaning: 'In the Beginning', chapters: 50 },
    { id: 'exodus', hebrew: 'שְׁמוֹת', name: 'Exodus', meaning: 'Names', chapters: 40 },
    { id: 'leviticus', hebrew: 'וַיִּקְרָא', name: 'Leviticus', meaning: 'And He Called', chapters: 27 },
    { id: 'numbers', hebrew: 'בְּמִדְבַּר', name: 'Numbers', meaning: 'In the Wilderness', chapters: 36 },
    { id: 'deuteronomy', hebrew: 'דְּבָרִים', name: 'Deuteronomy', meaning: 'Words', chapters: 34 }
];

let currentBook = 'genesis';
let currentChapter = 1;

const bookSelect = document.getElementById('book-select');
const chapterSelect = document.getElementById('chapter-select');
const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
const chapterTitle = document.getElementById('chapter-title');
const verseCount = document.getElementById('verse-count');
const versesContainer = document.getElementById('verses-container');
const themeToggle = document.getElementById('theme-toggle');

async function init() {
    const savedBook = HoliBooks.storage.get('torah_book');
    const savedChapter = HoliBooks.storage.get('torah_chapter');

    if (savedBook) currentBook = savedBook;
    if (savedChapter) currentChapter = savedChapter;

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
        const url = `${API_BASE}/${currentBook}/chapters/${currentChapter}.json`;
        const response = await HoliBooks.fetchWithRetry(url, {}, 2);

        // API returns {data: [...]} not {verses: [...]}
        const verses = response.data || response.verses || [];
        const data = { verses: verses };

        chapterTitle.textContent = `${book.hebrew} - ${book.name} Chapter ${currentChapter}`;
        verseCount.textContent = `${verses.length} Verses`;

        renderVerses(data);
        updateNavigation();

        HoliBooks.storage.set('torah_book', currentBook);
        HoliBooks.storage.set('torah_chapter', currentChapter);
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

    themeToggle.addEventListener('click', () => HoliBooks.theme.toggle());
}

document.addEventListener('DOMContentLoaded', init);
