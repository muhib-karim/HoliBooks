/**
 * HoliBooks - Guru Granth Sahib Module
 * Using GurbaniNow API with multi-language support
 */

const API_BASE = 'https://api.gurbaninow.com/v2';
const TOTAL_ANGS = 1430;

// Language modes
const LANGUAGE_MODES = {
    'all': { name: 'Gurmukhi + English', showGurmukhi: true, showTransliteration: true, showTranslation: true },
    'gurmukhi': { name: 'Gurmukhi Only', showGurmukhi: true, showTransliteration: false, showTranslation: false },
    'transliteration': { name: 'Transliteration', showGurmukhi: false, showTransliteration: true, showTranslation: false },
    'translation': { name: 'English Only', showGurmukhi: false, showTransliteration: false, showTranslation: true }
};

let currentAng = 1;
let currentLanguageMode = 'all';
let currentAngData = null;
const angRequests = HoliBooks.latestOnly();

const angInput = document.getElementById('ang-input');
const goBtn = document.getElementById('go-ang');
const prevBtn = document.getElementById('prev-ang');
const nextBtn = document.getElementById('next-ang');
const angTitle = document.getElementById('ang-title');
const versesContainer = document.getElementById('verses-container');
const themeToggle = document.getElementById('theme-toggle');
const languageBtn = document.getElementById('language-btn');
const currentLanguageSpan = document.getElementById('current-language');

async function init() {
    // Load saved preferences (range-checked: storage can hold anything)
    currentAng = HoliBooks.clampInt(HoliBooks.storage.get('gurbani_ang'), 1, TOTAL_ANGS, 1);
    const savedLanguage = HoliBooks.storage.get('gurbani_language');
    if (typeof savedLanguage === 'string' && LANGUAGE_MODES[savedLanguage]) currentLanguageMode = savedLanguage;

    // Check URL params
    const params = HoliBooks.getQueryParams();
    currentAng = HoliBooks.clampInt(params.page, 1, TOTAL_ANGS, currentAng);

    angInput.value = currentAng;
    updateLanguageButton();
    updateMobileLanguageButtons();
    setupEventListeners();
    await loadAng(currentAng);
}

async function loadAng(angNum) {
    const ang = HoliBooks.clampInt(angNum, 1, TOTAL_ANGS, null);
    if (ang === null) return;

    const token = angRequests.next();
    currentAng = ang;
    angInput.value = ang;
    angTitle.textContent = `ਅੰਗ ${ang}`;
    document.querySelector('.ang-subtitle').textContent = `Ang (Page) ${ang} of ${TOTAL_ANGS}`;
    updateNavigation();
    HoliBooks.showLoading(versesContainer, 'Loading Gurbani...');

    try {
        const response = await HoliBooks.fetchWithRetry(`${API_BASE}/ang/${ang}`, {}, 2);

        // A newer request has started; this response is stale.
        if (!angRequests.isCurrent(token)) return;

        currentAngData = response;
        renderVerses(response);

        HoliBooks.storage.set('gurbani_ang', ang);
        HoliBooks.scrollToTop();

    } catch (error) {
        if (!angRequests.isCurrent(token)) return;
        console.error('Failed to load ang:', error);
        currentAngData = null;
        HoliBooks.showError(
            versesContainer,
            `Could not load Ang ${ang}. Check your connection and try again.`,
            () => loadAng(ang)
        );
    }
}

/**
 * Read a string out of a field that upstream serves either as a plain
 * string or as an object ({ unicode }, { text }, { default }, { english }).
 */
function textOf(value, key) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && typeof value[key] === 'string') return value[key];
    return '';
}

/**
 * Pull the displayable fields from one GurbaniNow v2 line entry:
 * { line: { gurmukhi: { unicode }, transliteration: { english: { text } },
 *           translation: { english: { default } }, writer: { english } } }
 */
function extractLine(entry) {
    const line = (entry && entry.line) || {};
    return {
        gurmukhi: textOf(line.gurmukhi, 'unicode'),
        transliteration: textOf(line.transliteration && line.transliteration.english, 'text'),
        translation: textOf(line.translation && line.translation.english, 'default'),
        writer: textOf(line.writer, 'english')
    };
}

function renderVerses(data) {
    const page = Array.isArray(data && data.page) ? data.page : [];
    const mode = LANGUAGE_MODES[currentLanguageMode];
    const esc = HoliBooks.escapeHTML;

    if (page.length === 0) {
        versesContainer.innerHTML = '<p class="loading">No content found for this Ang</p>';
        return;
    }

    let html = '';
    let previousWriter = '';
    page.forEach(entry => {
        const { gurmukhi, transliteration, translation, writer } = extractLine(entry);
        // Name the writer where it changes, not on every line of the page.
        const showWriter = writer && writer !== previousWriter;
        if (writer) previousWriter = writer;

        html += `
            <article class="shabad-card">
                ${mode.showGurmukhi && gurmukhi ? `<p class="shabad-gurmukhi">${esc(gurmukhi)}</p>` : ''}
                ${mode.showTransliteration && transliteration ? `<p class="shabad-transliteration">${esc(transliteration)}</p>` : ''}
                ${mode.showTranslation && translation ? `<p class="shabad-translation">${esc(translation)}</p>` : ''}
                ${showWriter ? `<p class="shabad-writer" style="font-size: 0.85rem; color: var(--text-muted); margin-top: var(--space-sm); font-style: italic;">— ${esc(writer)}</p>` : ''}
            </article>
        `;
    });

    versesContainer.innerHTML = html;
}

function updateNavigation() {
    prevBtn.disabled = currentAng <= 1;
    nextBtn.disabled = currentAng >= TOTAL_ANGS;
}

function changeLanguageMode(mode) {
    if (LANGUAGE_MODES[mode]) {
        currentLanguageMode = mode;
        HoliBooks.storage.set('gurbani_language', currentLanguageMode);
        updateLanguageButton();
        updateMobileLanguageButtons();
        
        // Re-render with new language mode
        if (currentAngData) {
            renderVerses(currentAngData);
        }
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
    goBtn.addEventListener('click', () => {
        loadAng(angInput.value);
    });

    angInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadAng(angInput.value);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentAng > 1) loadAng(currentAng - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentAng < TOTAL_ANGS) loadAng(currentAng + 1);
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.key === 'ArrowLeft' && currentAng > 1) loadAng(currentAng - 1);
        if (e.key === 'ArrowRight' && currentAng < TOTAL_ANGS) loadAng(currentAng + 1);
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
