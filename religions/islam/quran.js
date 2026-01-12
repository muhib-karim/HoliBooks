/**
 * HoliBooks - Quran Module
 * Fetches Quran data from Al Quran Cloud API with multi-language translations and audio
 */

// API Configuration
const API_BASE = 'https://api.alquran.cloud/v1';
const AUDIO_RECITER = 'ar.alafasy'; // Mishary Alafasy

// State
let surahs = [];
let currentSurahId = 1;
let currentEdition = 'en.sahih';
let currentSurahData = null;
let audioPlaylist = [];

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
const languageBtn = document.getElementById('language-btn');
const currentLanguageSpan = document.getElementById('current-language');
const playSurahBtn = document.getElementById('play-surah');
const themeToggle = document.getElementById('theme-toggle');

// Initialize
async function init() {
    try {
        // Load saved preferences
        const savedEdition = HoliBooks.storage.get('quran_edition');
        if (savedEdition) {
            currentEdition = savedEdition;
            updateLanguageButton();
        }

        const savedSurah = HoliBooks.storage.get('quran_surah');
        if (savedSurah) {
            currentSurahId = savedSurah;
        }

        // Check URL params
        const params = HoliBooks.getQueryParams();
        if (params.surah) {
            currentSurahId = parseInt(params.surah);
        }

        // Fetch surah list
        HoliBooks.showLoading(versesContainer, 'Loading Quran...');
        const response = await HoliBooks.fetchJSON(`${API_BASE}/surah`);
        surahs = response.data;

        // Populate dropdown
        populateSurahDropdown();

        // Load current surah
        await loadSurah(currentSurahId);

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Failed to initialize:', error);
        // Use fallback sample data
        surahs = getFallbackSurahList();
        populateSurahDropdown();

        // Load fallback surah
        const fallbackData = getFallbackSurah(1);
        currentSurahId = 1;
        currentSurahData = fallbackData;
        updateSurahInfo(fallbackData);
        renderVerses(fallbackData);
        updateNavigationState();

        versesContainer.innerHTML = `
            <div class="loading" style="color: var(--text-muted); padding: 20px; text-align: center; font-size: 0.9rem; border-radius: 12px; background: var(--bg-card); margin-bottom: 20px;">
                ⚠️ Live API unavailable. Showing sample data (Al-Fatihah).<br>
                <small>The full Quran will load when API is accessible.</small>
            </div>
        ` + versesContainer.innerHTML;

        setupEventListeners();
    }
}

// Fallback surah list
function getFallbackSurahList() {
    return [
        { number: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', englishNameTranslation: 'The Opener', numberOfAyahs: 7, revelationType: 'Meccan' },
        { number: 2, name: 'البقرة', englishName: 'Al-Baqarah', englishNameTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan' },
        { number: 3, name: 'آل عمران', englishName: 'Ali Imran', englishNameTranslation: 'Family of Imran', numberOfAyahs: 200, revelationType: 'Medinan' }
    ];
}

function populateSurahDropdown() {
    surahSelect.innerHTML = surahs.map(surah =>
        `<option value="${surah.number}">${surah.number}. ${surah.englishName} (${surah.name})</option>`
    ).join('');

    surahSelect.value = currentSurahId;
}

async function loadSurah(surahId) {
    currentSurahId = surahId;
    HoliBooks.showLoading(versesContainer, 'Loading verses...');

    try {
        // Fetch Arabic text and translation in parallel with retry
        const [arabicResponse, translationResponse] = await Promise.all([
            HoliBooks.fetchWithRetry(`${API_BASE}/surah/${surahId}`, {}, 2),
            HoliBooks.fetchWithRetry(`${API_BASE}/surah/${surahId}/${currentEdition}`, {}, 2)
        ]);

        const arabicData = arabicResponse.data;
        const translationData = translationResponse.data;

        // Merge Arabic with translation
        currentSurahData = {
            ...arabicData,
            ayahs: arabicData.ayahs.map((ayah, index) => ({
                ...ayah,
                translation: translationData.ayahs[index]?.text || ''
            }))
        };

        // Build audio playlist - use full reciter ID (ar.alafasy not just alafasy)
        audioPlaylist = currentSurahData.ayahs.map(ayah => ({
            url: `https://cdn.islamic.network/quran/audio/128/${AUDIO_RECITER}/${ayah.number}.mp3`,
            title: `Ayah ${ayah.numberInSurah}`,
            subtitle: `Surah ${currentSurahData.englishName}`
        }));

        // Update UI
        updateSurahInfo(currentSurahData);
        renderVerses(currentSurahData);
        updateNavigationState();

        // Update URL and save state
        HoliBooks.setQueryParams({ surah: surahId });
        HoliBooks.storage.set('quran_surah', surahId);

        // Update dropdown
        surahSelect.value = surahId;

        // Scroll to top
        HoliBooks.scrollToTop();

    } catch (error) {
        console.error(`Failed to load surah ${surahId}:`, error);
        // Use fallback sample data for demonstration
        const fallbackData = getFallbackSurah(surahId);
        if (fallbackData) {
            currentSurahData = fallbackData;
            updateSurahInfo(fallbackData);
            renderVerses(fallbackData);
            updateNavigationState();
            versesContainer.innerHTML = `
                <div class="loading" style="color: var(--text-muted); padding: 20px; text-align: center; font-size: 0.9rem;">
                    ⚠️ Live API unavailable (CORS). Showing sample data.<br>
                    <small>Run with a local server for full content.</small>
                </div>
            ` + versesContainer.innerHTML;
        } else {
            HoliBooks.showError(versesContainer, 'Failed to load surah. Please try again.', () => loadSurah(surahId));
        }
    }
}

// Fallback sample data for when API is blocked
function getFallbackSurah(surahId) {
    const SAMPLE_SURAHS = {
        1: {
            number: 1,
            name: 'الفاتحة',
            englishName: 'Al-Fatihah',
            englishNameTranslation: 'The Opener',
            numberOfAyahs: 7,
            revelationType: 'Meccan',
            ayahs: [
                { numberInSurah: 1, number: 1, text: 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
                { numberInSurah: 2, number: 2, text: 'ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ', translation: 'All praise is due to Allah, Lord of the worlds.' },
                { numberInSurah: 3, number: 3, text: 'ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful.' },
                { numberInSurah: 4, number: 4, text: 'مَٰلِكِ يَوۡمِ ٱلدِّينِ', translation: 'Sovereign of the Day of Recompense.' },
                { numberInSurah: 5, number: 5, text: 'إِيَّاكَ نَعۡبُدُ وَإِيَّاكَ نَسۡتَعِينُ', translation: 'It is You we worship and You we ask for help.' },
                { numberInSurah: 6, number: 6, text: 'ٱهۡدِنَا ٱلصِّرَٰطَ ٱلۡمُسۡتَقِيمَ', translation: 'Guide us to the straight path.' },
                { numberInSurah: 7, number: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنۡعَمۡتَ عَلَيۡهِمۡ غَيۡرِ ٱلۡمَغۡضُوبِ عَلَيۡهِمۡ وَلَا ٱلضَّآلِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.' }
            ]
        }
    };
    return SAMPLE_SURAHS[surahId] || SAMPLE_SURAHS[1];
}

function updateSurahInfo(surah) {
    surahName.textContent = surah.name;
    surahTransliteration.textContent = surah.englishName;
    surahTranslation.textContent = surah.englishNameTranslation;
    surahVerses.textContent = `${surah.numberOfAyahs} Verses`;
    surahType.textContent = surah.revelationType;
}

function renderVerses(surah) {
    let html = '';

    // Add Bismillah for all surahs except Al-Fatihah (1) and At-Tawbah (9)
    if (surah.number !== 1 && surah.number !== 9) {
        html += `
            <div class="bismillah-banner">
                بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
            </div>
        `;
    }

    // Render each verse
    surah.ayahs.forEach((ayah, index) => {
        html += `
            <article class="verse-card" id="verse-${ayah.numberInSurah}" data-index="${index}">
                <div class="verse-number">${ayah.numberInSurah}</div>
                <div class="verse-content">
                    <p class="arabic-text">${ayah.text}</p>
                    <p class="translation-text">${ayah.translation}</p>
                </div>
                <div class="verse-audio">
                    <button class="btn btn-icon" onclick="playVerse(${index})" title="Play this verse">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
            </article>
        `;
    });

    versesContainer.innerHTML = html;
}

function updateNavigationState() {
    prevBtn.disabled = currentSurahId <= 1;
    nextBtn.disabled = currentSurahId >= 114;
}

function setupEventListeners() {
    // Surah selection
    surahSelect.addEventListener('change', (e) => {
        loadSurah(parseInt(e.target.value));
    });

    // Navigation
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        if (e.key === 'ArrowLeft' && currentSurahId > 1) {
            loadSurah(currentSurahId - 1);
        } else if (e.key === 'ArrowRight' && currentSurahId < 114) {
            loadSurah(currentSurahId + 1);
        }
    });

    // Language selector
    languageBtn.addEventListener('click', () => {
        window.languageSelector.open('islam', (newEdition) => {
            currentEdition = newEdition;
            HoliBooks.storage.set('quran_edition', newEdition);
            updateLanguageButton();
            loadSurah(currentSurahId);
        });
    });

    // Play surah
    playSurahBtn.addEventListener('click', () => {
        if (audioPlaylist.length > 0) {
            window.audioPlayer.loadPlaylist(audioPlaylist, 0);
            highlightPlayingVerse(0);
        }
    });

    // Track audio progress to highlight verses
    window.audioPlayer.audio.addEventListener('ended', () => {
        const currentIdx = window.audioPlayer.currentIndex;
        highlightPlayingVerse(currentIdx);
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        HoliBooks.theme.toggle();
    });
}

function updateLanguageButton() {
    const config = window.languageSelector.getLanguageConfig().islam;
    const lang = config.languages.find(l => l.code === currentEdition);
    if (lang) {
        currentLanguageSpan.textContent = lang.translator;
    }
}

// Play individual verse
function playVerse(index) {
    if (audioPlaylist.length > index) {
        window.audioPlayer.loadPlaylist(audioPlaylist, index);
        highlightPlayingVerse(index);
    }
}

function highlightPlayingVerse(index) {
    // Remove previous highlighting
    document.querySelectorAll('.verse-card.playing').forEach(el => {
        el.classList.remove('playing');
    });

    // Add highlighting to current verse
    const verseCard = document.querySelector(`.verse-card[data-index="${index}"]`);
    if (verseCard) {
        verseCard.classList.add('playing');
        verseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Make playVerse globally accessible
window.playVerse = playVerse;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
