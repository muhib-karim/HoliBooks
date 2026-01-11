/**
 * Quran Web App - JavaScript
 * Fetches Arabic text and English translations from quran-json API
 */

// API base URL - Using jsDelivr CDN (works with local file:// URLs)
const API_BASE = 'https://cdn.jsdelivr.net/gh/risan/quran-json@master/dist';

// State
let surahs = [];
let currentSurahId = 1;

// DOM Elements
const surahSelect = document.getElementById('surah-select');
const prevBtn = document.getElementById('prev-surah');
const nextBtn = document.getElementById('next-surah');
const surahName = document.getElementById('surah-name');
const surahTransliteration = document.getElementById('surah-transliteration');
const surahTranslation = document.getElementById('surah-translation');
const surahVerses = document.getElementById('surah-verses');
const surahType = document.getElementById('surah-type');
const versesContainer = document.getElementById('verses-container');
const loadingSpinner = document.getElementById('loading');

// Initialize app
async function init() {
    try {
        // Fetch all surahs list
        const response = await fetch(`${API_BASE}/quran.json`);
        surahs = await response.json();

        // Populate dropdown
        populateSurahDropdown();

        // Load first surah
        await loadSurah(1);

        // Enable navigation
        updateNavigationState();
    } catch (error) {
        console.error('Failed to initialize:', error);
        showError('Failed to load Quran data. Please refresh the page.');
    }
}

// Populate surah dropdown
function populateSurahDropdown() {
    surahSelect.innerHTML = surahs.map(surah =>
        `<option value="${surah.id}">${surah.id}. ${surah.transliteration} (${surah.name})</option>`
    ).join('');

    surahSelect.addEventListener('change', (e) => {
        loadSurah(parseInt(e.target.value));
    });
}

// Load a surah with translations
async function loadSurah(surahId) {
    currentSurahId = surahId;
    showLoading(true);

    try {
        // Fetch surah with English translations
        const response = await fetch(`${API_BASE}/chapters/en/${surahId}.json`);
        const surah = await response.json();

        // Update UI
        updateSurahInfo(surah);
        renderVerses(surah);
        updateNavigationState();

        // Update dropdown selection
        surahSelect.value = surahId;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error(`Failed to load surah ${surahId}:`, error);
        showError('Failed to load surah. Please try again.');
    }

    showLoading(false);
}

// Update surah info header
function updateSurahInfo(surah) {
    surahName.textContent = surah.name;
    surahTransliteration.textContent = surah.transliteration;
    surahTranslation.textContent = surah.translation || '';
    surahVerses.textContent = `${surah.total_verses} Verses`;
    surahType.textContent = surah.type.charAt(0).toUpperCase() + surah.type.slice(1);
}

// Render verses
function renderVerses(surah) {
    // Start with Bismillah for all surahs except Al-Fatihah (1) and At-Tawbah (9)
    let html = '';

    if (surah.id !== 1 && surah.id !== 9) {
        html += `
            <div class="bismillah-banner">
                بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
            </div>
        `;
    }

    // Render each verse
    surah.verses.forEach(verse => {
        html += `
            <article class="verse-card" id="verse-${verse.id}">
                <div class="verse-number">${verse.id}</div>
                <div class="verse-content">
                    <p class="arabic-text">${verse.text}</p>
                    <p class="translation-text">${verse.translation || ''}</p>
                    ${verse.transliteration ? `<p class="transliteration-text">${verse.transliteration}</p>` : ''}
                </div>
            </article>
        `;
    });

    versesContainer.innerHTML = html;
}

// Update navigation button states
function updateNavigationState() {
    prevBtn.disabled = currentSurahId <= 1;
    nextBtn.disabled = currentSurahId >= 114;
}

// Navigation handlers
prevBtn.addEventListener('click', () => {
    if (currentSurahId > 1) {
        loadSurah(currentSurahId - 1);
    }
});

nextBtn.addEventListener('click', () => {
    if (currentSurahId < 114) {
        loadSurah(currentSurahId + 1);
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentSurahId > 1) {
        loadSurah(currentSurahId - 1);
    } else if (e.key === 'ArrowRight' && currentSurahId < 114) {
        loadSurah(currentSurahId + 1);
    }
});

// Show/hide loading spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        versesContainer.querySelectorAll('.verse-card, .bismillah-banner').forEach(el => el.remove());
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

// Show error message
function showError(message) {
    versesContainer.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 50px; color: #ff6b6b;">
            <p style="font-size: 1.2rem; margin-bottom: 15px;">⚠️ ${message}</p>
            <button onclick="location.reload()" style="
                padding: 12px 30px;
                background: var(--accent-primary);
                color: var(--bg-primary);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
            ">Reload Page</button>
        </div>
    `;
    loadingSpinner.classList.add('hidden');
}

// Start the app
init();
