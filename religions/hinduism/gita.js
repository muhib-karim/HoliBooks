/**
 * HoliBooks - Bhagavad Gita Module
 * Loads each chapter verse by verse from vedicscriptures.github.io
 */

const API_BASE = 'https://vedicscriptures.github.io';

// Chapter data
const CHAPTERS = [
    { number: 1, name: 'अर्जुनविषादयोग', english: 'Arjuna Vishada Yoga', meaning: 'The Yoga of Arjuna\'s Dejection', verses: 47 },
    { number: 2, name: 'सांख्ययोग', english: 'Sankhya Yoga', meaning: 'The Yoga of Knowledge', verses: 72 },
    { number: 3, name: 'कर्मयोग', english: 'Karma Yoga', meaning: 'The Yoga of Action', verses: 43 },
    { number: 4, name: 'ज्ञानकर्मसंन्यासयोग', english: 'Jnana Karma Sanyasa Yoga', meaning: 'The Yoga of Knowledge and Renunciation of Action', verses: 42 },
    { number: 5, name: 'कर्मसंन्यासयोग', english: 'Karma Sanyasa Yoga', meaning: 'The Yoga of Renunciation of Action', verses: 29 },
    { number: 6, name: 'आत्मसंयमयोग', english: 'Atma Samyama Yoga', meaning: 'The Yoga of Self-Control', verses: 47 },
    { number: 7, name: 'ज्ञानविज्ञानयोग', english: 'Jnana Vijnana Yoga', meaning: 'The Yoga of Knowledge and Wisdom', verses: 30 },
    { number: 8, name: 'अक्षरब्रह्मयोग', english: 'Akshara Brahma Yoga', meaning: 'The Yoga of the Imperishable Brahman', verses: 28 },
    { number: 9, name: 'राजविद्याराजगुह्ययोग', english: 'Raja Vidya Raja Guhya Yoga', meaning: 'The Yoga of Royal Knowledge and Royal Secret', verses: 34 },
    { number: 10, name: 'विभूतियोग', english: 'Vibhuti Yoga', meaning: 'The Yoga of Divine Glories', verses: 42 },
    { number: 11, name: 'विश्वरूपदर्शनयोग', english: 'Vishwarupa Darshana Yoga', meaning: 'The Yoga of the Vision of the Universal Form', verses: 55 },
    { number: 12, name: 'भक्तियोग', english: 'Bhakti Yoga', meaning: 'The Yoga of Devotion', verses: 20 },
    { number: 13, name: 'क्षेत्रक्षेत्रज्ञविभागयोग', english: 'Kshetra Kshetragna Vibhaga Yoga', meaning: 'The Yoga of the Field and the Knower of the Field', verses: 35 },
    { number: 14, name: 'गुणत्रयविभागयोग', english: 'Gunatraya Vibhaga Yoga', meaning: 'The Yoga of the Division of Three Gunas', verses: 27 },
    { number: 15, name: 'पुरुषोत्तमयोग', english: 'Purushottama Yoga', meaning: 'The Yoga of the Supreme Person', verses: 20 },
    { number: 16, name: 'दैवासुरसम्पद्विभागयोग', english: 'Daivasura Sampad Vibhaga Yoga', meaning: 'The Yoga of the Division between Divine and Demonic', verses: 24 },
    { number: 17, name: 'श्रद्धात्रयविभागयोग', english: 'Shraddhatraya Vibhaga Yoga', meaning: 'The Yoga of the Division of Threefold Faith', verses: 28 },
    { number: 18, name: 'मोक्षसंन्यासयोग', english: 'Moksha Sanyasa Yoga', meaning: 'The Yoga of Liberation through Renunciation', verses: 78 }
];

let currentChapter = 1;
let currentLanguage = 'both'; // 'both' (Sanskrit + English), 'hindi', 'sanskrit'
let currentVerses = null;
const chapterRequests = HoliBooks.latestOnly();

const LANGUAGE_MODES = ['both', 'hindi', 'sanskrit'];
const MAX_PARALLEL = 6;              // verse requests in flight at once
const CACHE_PREFIX = 'gita_chapter_v3_';

// Translations shown, in order of preference. Keys and fields are the ones
// vedicscriptures.github.io serves ("et" = English translation, "ht" = Hindi).
const ENGLISH_SOURCES = [
    { key: 'purohit', field: 'et', name: 'Shri Purohit Swami' },
    { key: 'siva', field: 'et', name: 'Swami Sivananda' }
];
const HINDI_SOURCES = [
    { key: 'tej', field: 'ht', name: 'Swami Tejomayananda' },
    { key: 'rams', field: 'ht', name: 'Swami Ramsukhdas' }
];

const chapterSelect = document.getElementById('chapter-select');
const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
const chapterSanskrit = document.getElementById('chapter-sanskrit');
const chapterEnglish = document.getElementById('chapter-english');
const verseCount = document.getElementById('verse-count');
const versesContainer = document.getElementById('verses-container');
const themeToggle = document.getElementById('theme-toggle');
const languageBtn = document.getElementById('language-btn');
const currentLanguageSpan = document.getElementById('current-language');

async function init() {
    // Load saved preferences (range-checked: storage can hold anything)
    currentChapter = HoliBooks.clampInt(HoliBooks.storage.get('gita_chapter'), 1, CHAPTERS.length, 1);

    const savedLanguage = HoliBooks.storage.get('gita_language');
    if (LANGUAGE_MODES.includes(savedLanguage)) currentLanguage = savedLanguage;

    // Check URL params
    const params = HoliBooks.getQueryParams();
    currentChapter = HoliBooks.clampInt(params.chapter, 1, CHAPTERS.length, currentChapter);

    removeLegacyCache();
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

// Earlier builds stored whole API responses, or differently chosen
// translations, under these keys.
function removeLegacyCache() {
    CHAPTERS.forEach(ch => {
        HoliBooks.storage.remove(`gita_chapter_${ch.number}_cache`);
        HoliBooks.storage.remove(`gita_chapter_v2_${ch.number}`);
    });
}

/** The API serves one verse per URL; there is no per-chapter endpoint. */
function verseUrl(chapter, verse) {
    return `${API_BASE}/slok/${chapter}/${verse}/`;
}

/** Translations arrive prefixed with their own number ("2.20 ...", "।।2.20।। ..."). */
function stripVerseLabel(text) {
    return String(text || '').replace(/^\s*(?:।।\s*\d+\.\d+\s*।।|\d+\.\d+)\s*/, '').trim();
}

// Where a translator rendered several verses as one, the API serves this
// sentence in place of a translation ("Shri Purohit Swami did not comment on
// this sloka"). It is not scripture and must not be shown as if it were.
const NO_TRANSLATION = /did not comment on this sl?oka/i;

function pickTranslation(raw, sources) {
    for (const source of sources) {
        const entry = raw && raw[source.key];
        const text = stripVerseLabel(entry && entry[source.field]);
        if (text && !NO_TRANSLATION.test(text)) return { text, by: source.name };
    }
    return { text: '', by: '' };
}

/** Keep only the fields the reader shows; a full verse response is 16-100 KB. */
function toVerse(raw, verseNumber) {
    const english = pickTranslation(raw, ENGLISH_SOURCES);
    const hindi = pickTranslation(raw, HINDI_SOURCES);
    return {
        verse: HoliBooks.clampInt(raw && raw.verse, 1, 99, verseNumber),
        slok: String((raw && raw.slok) || ''),
        transliteration: String((raw && raw.transliteration) || ''),
        english: english.text,
        englishBy: english.by,
        hindi: hindi.text,
        hindiBy: hindi.by
    };
}

/** Fetch every verse of a chapter, MAX_PARALLEL at a time. Rejects if any verse fails. */
async function fetchChapter(chapter) {
    const verses = new Array(chapter.verses);
    let next = 1;
    let failed = false;

    async function worker() {
        while (!failed && next <= chapter.verses) {
            const verse = next++;
            try {
                const raw = await HoliBooks.fetchWithRetry(verseUrl(chapter.number, verse), {}, 2);
                verses[verse - 1] = toVerse(raw, verse);
            } catch (error) {
                failed = true;
                throw error;
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL, chapter.verses) }, worker));
    return verses;
}

function readCachedChapter(chapter) {
    const cached = HoliBooks.storage.get(CACHE_PREFIX + chapter.number);
    const valid = Array.isArray(cached) && cached.length === chapter.verses &&
        cached.every(v => v && typeof v.slok === 'string' && typeof v.verse === 'number');
    return valid ? cached : null;
}

async function loadChapter(chapterNum) {
    const number = HoliBooks.clampInt(chapterNum, 1, CHAPTERS.length, null);
    if (number === null) return;

    const token = chapterRequests.next();
    const chapter = CHAPTERS[number - 1];
    currentChapter = number;
    chapterSelect.value = number;

    // Update chapter info
    chapterSanskrit.textContent = `अध्याय ${number}: ${chapter.name}`;
    chapterEnglish.textContent = chapter.meaning;
    verseCount.textContent = `${chapter.verses} Shlokas`;
    updateNavigation();

    const cached = readCachedChapter(chapter);
    if (cached) {
        showChapter(cached, number);
        return;
    }

    HoliBooks.showLoading(versesContainer, `Loading ${chapter.verses} shlokas...`);

    try {
        const verses = await fetchChapter(chapter);

        // A newer request has started; this response is stale.
        if (!chapterRequests.isCurrent(token)) return;

        HoliBooks.storage.set(CACHE_PREFIX + number, verses);
        showChapter(verses, number);

    } catch (error) {
        if (!chapterRequests.isCurrent(token)) return;
        console.error('Failed to load chapter:', error);
        currentVerses = null;
        HoliBooks.showError(
            versesContainer,
            `Could not load chapter ${number}. Check your connection and try again.`,
            () => loadChapter(number)
        );
    }
}

function showChapter(verses, number) {
    currentVerses = verses;
    renderVerses(verses);
    HoliBooks.storage.set('gita_chapter', number);
    HoliBooks.scrollToTop();
}

function renderVerses(verses) {
    if (!Array.isArray(verses) || verses.length === 0) {
        versesContainer.innerHTML = '<p class="loading">No verses found</p>';
        return;
    }

    // API text is escaped; line breaks inside a shloka become <br>.
    const lines = (text) => HoliBooks.escapeHTML(text).replace(/\n/g, '<br>');
    const showTranslation = currentLanguage !== 'sanskrit';
    const hindiFirst = currentLanguage === 'hindi';
    const usualTranslator = (hindiFirst ? HINDI_SOURCES : ENGLISH_SOURCES)[0].name;
    const translators = new Set();

    let html = '';
    verses.forEach(verse => {
        const options = hindiFirst
            ? [[verse.hindi, verse.hindiBy], [verse.english, verse.englishBy]]
            : [[verse.english, verse.englishBy], [verse.hindi, verse.hindiBy]];
        const [translationText, translator] = options.find(([text]) => text) || ['', ''];
        if (showTranslation && translator) translators.add(translator);
        // Say so on the verse itself when it is not from the usual translator.
        const otherTranslator = translator && translator !== usualTranslator
            ? ` <span class="shloka-translator" style="color: var(--text-muted); font-size: 0.8rem;">— ${HoliBooks.escapeHTML(translator)}</span>`
            : '';

        html += `
            <article class="shloka-card">
                <span class="shloka-number">Shloka ${HoliBooks.escapeHTML(verse.verse)}</span>
                ${verse.slok ? `<p class="shloka-sanskrit">${lines(verse.slok)}</p>` : ''}
                ${verse.transliteration ? `<p class="shloka-transliteration">${lines(verse.transliteration)}</p>` : ''}
                ${showTranslation && translationText ? `<p class="shloka-translation">${lines(translationText)}${otherTranslator}</p>` : ''}
            </article>
        `;
    });

    const credit = translators.size
        ? `Translation: ${[...translators].map(HoliBooks.escapeHTML).join(', ')}. `
        : '';
    html += `
        <p class="translation-credit" style="color: var(--text-muted); font-size: 0.8rem; text-align: center; margin-top: var(--space-lg);">
            ${credit}Text served by vedicscriptures.github.io.
        </p>
    `;

    versesContainer.innerHTML = html;
}

function updateNavigation() {
    prevBtn.disabled = currentChapter <= 1;
    nextBtn.disabled = currentChapter >= 18;
}

function setupEventListeners() {
    chapterSelect.addEventListener('change', (e) => {
        loadChapter(e.target.value);
    });

    prevBtn.addEventListener('click', () => {
        if (currentChapter > 1) loadChapter(currentChapter - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentChapter < 18) loadChapter(currentChapter + 1);
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowLeft' && currentChapter > 1) loadChapter(currentChapter - 1);
        if (e.key === 'ArrowRight' && currentChapter < 18) loadChapter(currentChapter + 1);
    });

    themeToggle.addEventListener('click', () => {
        HoliBooks.theme.toggle();
        updateThemeIcons();
    });

    // Language selector button
    languageBtn.addEventListener('click', () => {
        cycleLanguage();
    });

    // Mobile menu
    setupMobileMenu();

    updateThemeIcons();
}

function cycleLanguage() {
    const currentIndex = LANGUAGE_MODES.indexOf(currentLanguage);
    currentLanguage = LANGUAGE_MODES[(currentIndex + 1) % LANGUAGE_MODES.length];
    
    HoliBooks.storage.set('gita_language', currentLanguage);
    updateLanguageButton();
    updateMobileLanguageButtons();
    
    // Re-render current chapter with new language
    if (currentVerses) renderVerses(currentVerses);
}

function updateLanguageButton() {
    const labels = {
        'both': 'Sanskrit + English',
        'hindi': 'Sanskrit + Hindi',
        'sanskrit': 'Sanskrit Only'
    };
    currentLanguageSpan.textContent = labels[currentLanguage] || 'Sanskrit + English';
}

function updateMobileLanguageButtons() {
    document.querySelectorAll('.mobile-view-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
}

function updateThemeIcons() {
    const isDark = HoliBooks.theme.current === 'dark';
    
    // Desktop theme icon
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
    document.querySelectorAll('.mobile-view-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!LANGUAGE_MODES.includes(btn.dataset.lang)) return;
            currentLanguage = btn.dataset.lang;
            HoliBooks.storage.set('gita_language', currentLanguage);
            updateLanguageButton();
            updateMobileLanguageButtons();

            // Re-render current chapter
            if (currentVerses) renderVerses(currentVerses);
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

document.addEventListener('DOMContentLoaded', init);
