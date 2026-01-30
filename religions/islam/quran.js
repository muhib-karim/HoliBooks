/**
 * HoliBooks - Quran Module (Enhanced)
 * Fetches Quran data from Al Quran Cloud API with multi-language translations, audio, and enhanced UX
 */

// API Configuration
const API_BASE = 'https://api.alquran.cloud/v1';
const AUDIO_RECITER = 'ar.alafasy';

// State
let surahs = [];
let currentSurahId = 1;
let currentEdition = 'en.sahih';
let currentSurahData = null;
let audioPlaylist = [];
let currentFontSize = 1;
let currentViewMode = 'both'; // 'both', 'arabic', 'translation'

// DOM Elements
const surahSelect = document.getElementById('surah-select');
const prevBtn = document.getElementById('prev-surah');
const nextBtn = document.getElementById('next-surah');
const prevBtnBottom = document.getElementById('prev-surah-bottom');
const nextBtnBottom = document.getElementById('next-surah-bottom');
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
const bookmarkSurahBtn = document.getElementById('bookmark-surah');
const readingProgress = document.getElementById('reading-progress');

// Initialize
async function init() {
    try {
        // Load saved preferences
        loadPreferences();

        // Check URL params
        const params = HoliBooks.getQueryParams();
        if (params.surah) {
            currentSurahId = parseInt(params.surah);
        }

        // Show loading
        HoliBooks.showLoading(versesContainer, 'Loading Quran...');

        // Fetch surah list
        const response = await HoliBooks.fetchJSON(`${API_BASE}/surah`);
        surahs = response.data;

        // Populate dropdown
        populateSurahDropdown();

        // Load current surah
        await loadSurah(currentSurahId);

        // Setup event listeners
        setupEventListeners();

        // Setup scroll progress
        setupScrollProgress();

    } catch (error) {
        console.error('Failed to initialize:', error);
        // Use fallback data
        surahs = getFallbackSurahList();
        populateSurahDropdown();
        
        const fallbackData = getFallbackSurah(1);
        currentSurahId = 1;
        currentSurahData = fallbackData;
        updateSurahInfo(fallbackData);
        renderVerses(fallbackData);
        updateNavigationState();
        
        showFallbackNotice();
        setupEventListeners();
    }
}

// Load user preferences
function loadPreferences() {
    const savedEdition = HoliBooks.storage.get('quran_edition');
    if (savedEdition) {
        currentEdition = savedEdition;
        updateLanguageButton();
    }

    const savedSurah = HoliBooks.storage.get('quran_surah');
    if (savedSurah) {
        currentSurahId = savedSurah;
    }

    const savedFontSize = HoliBooks.storage.get('quran_font_size');
    if (savedFontSize) {
        currentFontSize = savedFontSize;
        applyFontSize();
    }

    const savedViewMode = HoliBooks.storage.get('quran_view_mode');
    if (savedViewMode) {
        currentViewMode = savedViewMode;
        updateViewToggle();
    }
}

// Save preferences
function savePreferences() {
    HoliBooks.storage.set('quran_edition', currentEdition);
    HoliBooks.storage.set('quran_surah', currentSurahId);
    HoliBooks.storage.set('quran_font_size', currentFontSize);
    HoliBooks.storage.set('quran_view_mode', currentViewMode);
}

// Populate surah dropdown
function populateSurahDropdown() {
    surahSelect.innerHTML = surahs.map(surah =>
        `<option value="${surah.number}">${surah.number}. ${surah.englishName} (${surah.name})</option>`
    ).join('');

    surahSelect.value = currentSurahId;
}

// Load a surah
async function loadSurah(surahId) {
    currentSurahId = surahId;
    HoliBooks.showLoading(versesContainer, 'Loading verses...');

    try {
        // Fetch Arabic text and translation in parallel
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

        // Build audio playlist
        audioPlaylist = currentSurahData.ayahs.map(ayah => ({
            url: `https://cdn.islamic.network/quran/audio/128/${AUDIO_RECITER}/${ayah.number}.mp3`,
            title: `Ayah ${ayah.numberInSurah}`,
            subtitle: `Surah ${currentSurahData.englishName}`,
            ayahIndex: ayah.numberInSurah - 1
        }));

        // Update UI
        updateSurahInfo(currentSurahData);
        renderVerses(currentSurahData);
        updateNavigationState();
        updateBookmarkButton();

        // Update URL and save state
        HoliBooks.setQueryParams({ surah: surahId });
        savePreferences();

        // Update dropdown
        surahSelect.value = surahId;

        // Scroll to top
        HoliBooks.scrollToTop();

    } catch (error) {
        console.error(`Failed to load surah ${surahId}:`, error);
        useFallbackData(surahId);
    }
}

// Use fallback data when API fails
function useFallbackData(surahId) {
    const fallbackData = getFallbackSurah(surahId);
    if (fallbackData) {
        currentSurahData = fallbackData;
        updateSurahInfo(fallbackData);
        renderVerses(fallbackData);
        updateNavigationState();
        updateBookmarkButton();
        
        versesContainer.innerHTML = `
            <div class="fallback-notice" style="margin-bottom: var(--space-lg);">
                ⚠️ Live API unavailable. Showing sample data.
            </div>
        ` + versesContainer.innerHTML;
    } else {
        HoliBooks.showError(versesContainer, 'Failed to load surah. Please try again.', () => loadSurah(surahId));
    }
}

// Show fallback notice
function showFallbackNotice() {
    versesContainer.innerHTML = `
        <div class="fallback-notice" style="margin-bottom: var(--space-lg);">
            ⚠️ Live API unavailable. Showing sample data (Al-Fatihah).<br>
            <small>The full Quran will load when API is accessible.</small>
        </div>
    ` + versesContainer.innerHTML;
}

// Fallback surah list
function getFallbackSurahList() {
    return [
        { number: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', englishNameTranslation: 'The Opener', numberOfAyahs: 7, revelationType: 'Meccan' },
        { number: 2, name: 'البقرة', englishName: 'Al-Baqarah', englishNameTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan' },
        { number: 3, name: 'آل عمران', englishName: 'Ali Imran', englishNameTranslation: 'Family of Imran', numberOfAyahs: 200, revelationType: 'Medinan' }
    ];
}

// Fallback surah data
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

// Update surah info header
function updateSurahInfo(surah) {
    surahName.textContent = surah.name;
    surahTransliteration.textContent = surah.englishName;
    surahTranslation.textContent = surah.englishNameTranslation;
    surahVerses.textContent = `${surah.numberOfAyahs} Verses`;
    surahType.textContent = surah.revelationType;
}

// Render verses
function renderVerses(surah) {
    let html = '';

    // Add Bismillah for all surahs except Al-Fatihah (1) and At-Tawbah (9)
    if (surah.number !== 1 && surah.number !== 9) {
        const bismillahStyle = currentViewMode === 'translation' ? 'display: none;' : '';
        html += `
            <div class="bismillah-banner" style="${bismillahStyle}">
                بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
            </div>
        `;
    }

    // Render each verse
    surah.ayahs.forEach((ayah, index) => {
        const isBookmarked = bookmarkManager.isBookmarked('islam', `Quran ${surah.number}:${ayah.numberInSurah}`);
        const arabicStyle = currentViewMode === 'translation' ? 'display: none;' : '';
        const translationStyle = currentViewMode === 'arabic' ? 'display: none;' : '';
        
        html += `
            <article class="verse-card" id="verse-${ayah.numberInSurah}" data-index="${index}">
                <div class="verse-number">${ayah.numberInSurah}</div>
                <div class="verse-content" style="font-size: ${currentFontSize}rem;">
                    <p class="arabic-text" style="${arabicStyle}">${ayah.text}</p>
                    <p class="translation-text" style="${translationStyle}">${ayah.translation}</p>
                </div>
                <div class="verse-actions">
                    <button class="verse-action-btn ${isBookmarked ? 'active' : ''}" 
                            onclick="toggleVerseBookmark(${index})" 
                            title="${isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                    </button>
                    <button class="verse-action-btn" onclick="copyVerse(${index})" title="Copy verse">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                    <button class="verse-action-btn" onclick="shareVerse(${index})" title="Share verse">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                        </svg>
                    </button>
                    <button class="verse-action-btn verse-audio-btn" onclick="playVerse(${index})" title="Play audio">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
            </article>
        `;
    });

    versesContainer.innerHTML = html;
}

// Update navigation state
function updateNavigationState() {
    const canGoPrev = currentSurahId > 1;
    const canGoNext = currentSurahId < 114;

    prevBtn.disabled = !canGoPrev;
    nextBtn.disabled = !canGoNext;
    prevBtnBottom.disabled = !canGoPrev;
    nextBtnBottom.disabled = !canGoNext;
}

// Setup event listeners
function setupEventListeners() {
    // Surah selection
    surahSelect.addEventListener('change', (e) => {
        loadSurah(parseInt(e.target.value));
    });

    // Navigation buttons
    prevBtn.addEventListener('click', () => navigateSurah(-1));
    nextBtn.addEventListener('click', () => navigateSurah(1));
    prevBtnBottom.addEventListener('click', () => navigateSurah(-1));
    nextBtnBottom.addEventListener('click', () => navigateSurah(1));

    // Quick navigation
    const quickNavInput = document.getElementById('quick-nav-input');
    const quickNavBtn = document.getElementById('quick-nav-btn');
    
    quickNavBtn.addEventListener('click', () => {
        const num = parseInt(quickNavInput.value);
        if (num >= 1 && num <= 114) {
            loadSurah(num);
            quickNavInput.value = '';
        }
    });

    quickNavInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            quickNavBtn.click();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        if (e.key === 'ArrowLeft' && currentSurahId > 1) {
            navigateSurah(-1);
        } else if (e.key === 'ArrowRight' && currentSurahId < 114) {
            navigateSurah(1);
        }
    });

    // Language selector
    languageBtn.addEventListener('click', () => {
        window.languageSelector.open('islam', (newEdition) => {
            currentEdition = newEdition;
            savePreferences();
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

    // Bookmark entire surah
    bookmarkSurahBtn.addEventListener('click', () => {
        const firstAyah = currentSurahData.ayahs[0];
        const bookmark = {
            religion: 'islam',
            religionName: 'Islam',
            text: firstAyah.translation,
            reference: `Quran ${currentSurahData.number}:1-${currentSurahData.numberOfAyahs}`,
            translation: firstAyah.text
        };
        
        const wasAdded = bookmarkManager.toggleBookmark(bookmark);
        updateBookmarkButton();
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        HoliBooks.theme.toggle();
        updateThemeIcon();
    });

    // Font size controls
    document.getElementById('font-increase').addEventListener('click', () => {
        currentFontSize = Math.min(currentFontSize + 0.1, 1.5);
        applyFontSize();
        savePreferences();
    });

    document.getElementById('font-decrease').addEventListener('click', () => {
        currentFontSize = Math.max(currentFontSize - 0.1, 0.8);
        applyFontSize();
        savePreferences();
    });

    // View mode toggle
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentViewMode = btn.dataset.view;
            updateViewToggle();
            renderVerses(currentSurahData);
            savePreferences();
        });
    });

    // Track audio progress
    if (window.audioPlayer) {
        window.audioPlayer.audio.addEventListener('ended', () => {
            const currentIdx = window.audioPlayer.currentIndex;
            highlightPlayingVerse(currentIdx);
        });
    }

    updateThemeIcon();
}

// Navigate to previous/next surah
function navigateSurah(direction) {
    const newId = currentSurahId + direction;
    if (newId >= 1 && newId <= 114) {
        loadSurah(newId);
    }
}

// Update theme icon
function updateThemeIcon() {
    const isDark = HoliBooks.theme.current === 'dark';
    document.getElementById('theme-icon-dark').style.display = isDark ? 'block' : 'none';
    document.getElementById('theme-icon-light').style.display = isDark ? 'none' : 'block';
}

// Update language button text
function updateLanguageButton() {
    const config = window.languageSelector?.getLanguageConfig().islam;
    if (config) {
        const lang = config.languages.find(l => l.code === currentEdition);
        if (lang) {
            currentLanguageSpan.textContent = lang.translator;
        }
    }
}

// Update view toggle UI
function updateViewToggle() {
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === currentViewMode);
    });
}

// Apply font size
function applyFontSize() {
    document.querySelectorAll('.verse-content').forEach(el => {
        el.style.fontSize = `${currentFontSize}rem`;
    });
}

// Update bookmark button state
function updateBookmarkButton() {
    const isBookmarked = bookmarkManager.isBookmarked('islam', `Quran ${currentSurahId}:1-${currentSurahData?.numberOfAyahs || 0}`);
    bookmarkSurahBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
        </svg>
        ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
    `;
    bookmarkSurahBtn.classList.toggle('active', isBookmarked);
}

// Toggle verse bookmark
function toggleVerseBookmark(index) {
    const ayah = currentSurahData.ayahs[index];
    const bookmark = {
        religion: 'islam',
        religionName: 'Islam',
        text: ayah.translation,
        reference: `Quran ${currentSurahData.number}:${ayah.numberInSurah}`,
        translation: ayah.text
    };
    
    const wasAdded = bookmarkManager.toggleBookmark(bookmark);
    
    // Update button UI
    const card = document.querySelector(`.verse-card[data-index="${index}"]`);
    const btn = card?.querySelector('.verse-action-btn');
    if (btn) {
        btn.classList.toggle('active', wasAdded);
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${wasAdded ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
        `;
        btn.title = wasAdded ? 'Remove bookmark' : 'Bookmark this verse';
    }
}

// Copy verse
function copyVerse(index) {
    const ayah = currentSurahData.ayahs[index];
    const text = `"${ayah.translation}" — Quran ${currentSurahData.number}:${ayah.numberInSurah}`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Verse copied to clipboard!', 'success');
    });
}

// Share verse
function shareVerse(index) {
    const ayah = currentSurahData.ayahs[index];
    const text = `"${ayah.translation}" — Quran ${currentSurahData.number}:${ayah.numberInSurah}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'HoliBooks - Quran Verse',
            text: text
        });
    } else {
        copyVerse(index);
    }
}

// Play individual verse
function playVerse(index) {
    if (audioPlaylist.length > index) {
        window.audioPlayer.loadPlaylist(audioPlaylist, index);
        highlightPlayingVerse(index);
    }
}

// Highlight playing verse
function highlightPlayingVerse(index) {
    document.querySelectorAll('.verse-card.playing').forEach(el => {
        el.classList.remove('playing');
    });

    const verseCard = document.querySelector(`.verse-card[data-index="${index}"]`);
    if (verseCard) {
        verseCard.classList.add('playing');
        verseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Setup scroll progress
function setupScrollProgress() {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        readingProgress.style.width = scrollPercent + '%';
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Create toast container
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Make functions globally accessible
window.toggleVerseBookmark = toggleVerseBookmark;
window.copyVerse = copyVerse;
window.shareVerse = shareVerse;
window.playVerse = playVerse;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
