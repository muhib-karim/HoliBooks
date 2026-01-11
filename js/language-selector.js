/**
 * HoliBooks - Language Selector Module
 * Multi-language translation selector for all scriptures
 */

class LanguageSelector {
    constructor() {
        this.currentLanguage = 'en';
        this.currentReligion = null;
        this.languages = {};
        this.isOpen = false;

        this.init();
    }

    init() {
        this.createModalUI();
        this.bindEvents();
        this.loadFromStorage();
    }

    // Language configurations per religion
    getLanguageConfig() {
        return {
            islam: {
                title: 'Quran Translations',
                languages: [
                    { code: 'en.sahih', name: 'English', native: 'English', translator: 'Saheeh International' },
                    { code: 'en.pickthall', name: 'English', native: 'English', translator: 'Pickthall' },
                    { code: 'en.yusufali', name: 'English', native: 'English', translator: 'Yusuf Ali' },
                    { code: 'ur.ahmedali', name: 'Urdu', native: 'اردو', translator: 'Ahmed Ali' },
                    { code: 'ur.jalandhry', name: 'Urdu', native: 'اردو', translator: 'Jalandhry' },
                    { code: 'fr.hamidullah', name: 'French', native: 'Français', translator: 'Hamidullah' },
                    { code: 'de.aburida', name: 'German', native: 'Deutsch', translator: 'Abu Rida' },
                    { code: 'es.cortes', name: 'Spanish', native: 'Español', translator: 'Cortes' },
                    { code: 'tr.diyanet', name: 'Turkish', native: 'Türkçe', translator: 'Diyanet' },
                    { code: 'id.indonesian', name: 'Indonesian', native: 'Bahasa Indonesia', translator: 'Indonesian Ministry' },
                    { code: 'ru.kuliev', name: 'Russian', native: 'Русский', translator: 'Kuliev' },
                    { code: 'zh.majian', name: 'Chinese', native: '中文', translator: 'Ma Jian' },
                    { code: 'bn.bengali', name: 'Bengali', native: 'বাংলা', translator: 'Muhiuddin Khan' },
                    { code: 'hi.hindi', name: 'Hindi', native: 'हिन्दी', translator: 'Suhel Farooq' },
                    { code: 'fa.fooladvand', name: 'Persian', native: 'فارسی', translator: 'Fooladvand' },
                    { code: 'ml.abdulhameed', name: 'Malayalam', native: 'മലയാളം', translator: 'Abdul Hameed' },
                    { code: 'ta.tamil', name: 'Tamil', native: 'தமிழ்', translator: 'Jan Trust' },
                    { code: 'th.thai', name: 'Thai', native: 'ไทย', translator: 'King Fahad Complex' },
                    { code: 'sw.swahili', name: 'Swahili', native: 'Kiswahili', translator: 'Al-Barwani' },
                    { code: 'pt.elhayek', name: 'Portuguese', native: 'Português', translator: 'El-Hayek' },
                    { code: 'it.piccardo', name: 'Italian', native: 'Italiano', translator: 'Piccardo' },
                    { code: 'nl.keyzer', name: 'Dutch', native: 'Nederlands', translator: 'Keyzer' },
                    { code: 'pl.bielawskiego', name: 'Polish', native: 'Polski', translator: 'Bielawskiego' },
                    { code: 'sq.ahmeti', name: 'Albanian', native: 'Shqip', translator: 'Ahmeti' },
                    { code: 'az.mammadaliyev', name: 'Azerbaijani', native: 'Azərbaycanca', translator: 'Mammadaliyev' },
                    { code: 'bs.korkut', name: 'Bosnian', native: 'Bosanski', translator: 'Korkut' },
                    { code: 'ha.gumi', name: 'Hausa', native: 'Hausa', translator: 'Gumi' },
                    { code: 'ko.korean', name: 'Korean', native: '한국어', translator: 'Korean' },
                    { code: 'ja.japanese', name: 'Japanese', native: '日本語', translator: 'Japanese' },
                ]
            },
            christianity: {
                title: 'Bible Versions',
                languages: [
                    { code: 'kjv', name: 'English', native: 'English', translator: 'King James Version' },
                    { code: 'web', name: 'English', native: 'English', translator: 'World English Bible' },
                    { code: 'asv', name: 'English', native: 'English', translator: 'American Standard Version' },
                    { code: 'bbe', name: 'English', native: 'English', translator: 'Bible in Basic English' },
                    { code: 'rv1909', name: 'Spanish', native: 'Español', translator: 'Reina Valera 1909' },
                    { code: 'lsg', name: 'French', native: 'Français', translator: 'Louis Segond' },
                    { code: 'luth1912', name: 'German', native: 'Deutsch', translator: 'Luther 1912' },
                    { code: 'synodal', name: 'Russian', native: 'Русский', translator: 'Synodal' },
                    { code: 'nvi', name: 'Portuguese', native: 'Português', translator: 'Nova Versão' },
                    { code: 'cuv', name: 'Chinese', native: '中文', translator: 'Chinese Union Version' },
                    { code: 'ko', name: 'Korean', native: '한국어', translator: 'Korean Revised' },
                    { code: 'ar', name: 'Arabic', native: 'العربية', translator: 'Smith & Van Dyck' },
                ]
            },
            hinduism: {
                title: 'Bhagavad Gita Translations',
                languages: [
                    { code: 'sanskrit', name: 'Sanskrit', native: 'संस्कृत', translator: 'Original' },
                    { code: 'hi', name: 'Hindi', native: 'हिन्दी', translator: 'Various' },
                    { code: 'en', name: 'English', native: 'English', translator: 'Various' },
                    { code: 'en.swami', name: 'English', native: 'English', translator: 'Swami Prabhupada' },
                    { code: 'en.gam', name: 'English', native: 'English', translator: 'Gambhirananda' },
                ]
            },
            judaism: {
                title: 'Torah Translations',
                languages: [
                    { code: 'he', name: 'Hebrew', native: 'עברית', translator: 'Masoretic Text' },
                    { code: 'en', name: 'English', native: 'English', translator: 'JPS' },
                    { code: 'en.alter', name: 'English', native: 'English', translator: 'Robert Alter' },
                ]
            },
            sikhism: {
                title: 'Guru Granth Sahib Translations',
                languages: [
                    { code: 'gurmukhi', name: 'Gurmukhi', native: 'ਗੁਰਮੁਖੀ', translator: 'Original' },
                    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', translator: 'Prof. Sahib Singh' },
                    { code: 'en', name: 'English', native: 'English', translator: 'Sant Singh Khalsa' },
                    { code: 'hi', name: 'Hindi', native: 'हिन्दी', translator: 'Various' },
                ]
            },
            buddhism: {
                title: 'Dhammapada Translations',
                languages: [
                    { code: 'pali', name: 'Pali', native: 'Pāli', translator: 'Original' },
                    { code: 'en', name: 'English', native: 'English', translator: 'Buddharakkhita' },
                    { code: 'en.thanissaro', name: 'English', native: 'English', translator: 'Thanissaro Bhikkhu' },
                    { code: 'en.muller', name: 'English', native: 'English', translator: 'Max Müller' },
                ]
            }
        };
    }

    createModalUI() {
        const modalHTML = `
            <div class="language-modal-overlay" id="language-modal-overlay">
                <div class="language-modal" id="language-modal">
                    <div class="language-modal-header">
                        <h3 id="language-modal-title">Select Translation</h3>
                        <button class="btn btn-icon btn-secondary" id="language-modal-close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="language-search">
                        <input type="text" id="language-search" placeholder="Search languages..." class="select" />
                    </div>
                    <div class="language-list" id="language-list">
                        <!-- Languages will be populated here -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add modal styles
        const styles = document.createElement('style');
        styles.textContent = `
            .language-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                opacity: 0;
                visibility: hidden;
                transition: all var(--transition-normal);
            }
            
            .language-modal-overlay.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .language-modal {
                background: var(--bg-secondary);
                border-radius: var(--radius-xl);
                border: 1px solid var(--border-color);
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                transform: scale(0.9);
                transition: transform var(--transition-normal);
            }
            
            .language-modal-overlay.visible .language-modal {
                transform: scale(1);
            }
            
            .language-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-lg);
                border-bottom: 1px solid var(--border-color);
            }
            
            .language-search {
                padding: var(--space-md) var(--space-lg);
            }
            
            .language-list {
                flex: 1;
                overflow-y: auto;
                padding: var(--space-md) var(--space-lg);
            }
            
            .language-group {
                margin-bottom: var(--space-lg);
            }
            
            .language-group-title {
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: var(--space-sm);
                padding: var(--space-xs) 0;
            }
            
            .language-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-md);
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .language-item:hover {
                background: var(--bg-hover);
            }
            
            .language-item.selected {
                background: rgba(201, 165, 92, 0.15);
                border: 1px solid var(--accent-primary);
            }
            
            .language-item-info {
                display: flex;
                flex-direction: column;
            }
            
            .language-item-name {
                font-weight: 500;
            }
            
            .language-item-translator {
                font-size: 0.85rem;
                color: var(--text-secondary);
            }
            
            .language-item-native {
                font-size: 0.9rem;
                color: var(--text-muted);
            }
        `;
        document.head.appendChild(styles);

        // Cache DOM elements
        this.overlay = document.getElementById('language-modal-overlay');
        this.modal = document.getElementById('language-modal');
        this.modalTitle = document.getElementById('language-modal-title');
        this.closeBtn = document.getElementById('language-modal-close');
        this.searchInput = document.getElementById('language-search');
        this.listContainer = document.getElementById('language-list');
    }

    bindEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        this.searchInput.addEventListener('input', (e) => this.filterLanguages(e.target.value));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    open(religion, onSelect) {
        this.currentReligion = religion;
        this.onSelect = onSelect;

        const config = this.getLanguageConfig()[religion];
        if (!config) {
            console.error('Unknown religion:', religion);
            return;
        }

        this.modalTitle.textContent = config.title;
        this.renderLanguages(config.languages);

        this.overlay.classList.add('visible');
        this.isOpen = true;
        this.searchInput.focus();
    }

    close() {
        this.overlay.classList.remove('visible');
        this.isOpen = false;
        this.searchInput.value = '';
    }

    renderLanguages(languages) {
        // Group by language name
        const groups = {};
        languages.forEach(lang => {
            if (!groups[lang.name]) {
                groups[lang.name] = [];
            }
            groups[lang.name].push(lang);
        });

        let html = '';
        Object.keys(groups).sort().forEach(groupName => {
            html += `<div class="language-group">`;
            html += `<div class="language-group-title">${groupName}</div>`;

            groups[groupName].forEach(lang => {
                const isSelected = this.languages[this.currentReligion] === lang.code;
                html += `
                    <div class="language-item ${isSelected ? 'selected' : ''}" data-code="${lang.code}">
                        <div class="language-item-info">
                            <span class="language-item-name">${lang.translator}</span>
                            <span class="language-item-translator">${lang.native}</span>
                        </div>
                        ${isSelected ? '<span class="badge">Selected</span>' : ''}
                    </div>
                `;
            });

            html += `</div>`;
        });

        this.listContainer.innerHTML = html;

        // Bind click events
        this.listContainer.querySelectorAll('.language-item').forEach(item => {
            item.addEventListener('click', () => {
                const code = item.dataset.code;
                this.selectLanguage(code);
            });
        });
    }

    filterLanguages(query) {
        const items = this.listContainer.querySelectorAll('.language-item');
        const groups = this.listContainer.querySelectorAll('.language-group');

        query = query.toLowerCase();

        groups.forEach(group => {
            let hasVisible = false;
            group.querySelectorAll('.language-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                const visible = text.includes(query);
                item.style.display = visible ? '' : 'none';
                if (visible) hasVisible = true;
            });
            group.style.display = hasVisible ? '' : 'none';
        });
    }

    selectLanguage(code) {
        this.languages[this.currentReligion] = code;
        this.saveToStorage();

        if (this.onSelect) {
            this.onSelect(code);
        }

        this.close();
    }

    getLanguage(religion) {
        return this.languages[religion] || this.getDefaultLanguage(religion);
    }

    getDefaultLanguage(religion) {
        const defaults = {
            islam: 'en.sahih',
            christianity: 'kjv',
            hinduism: 'en',
            judaism: 'en',
            sikhism: 'en',
            buddhism: 'en'
        };
        return defaults[religion] || 'en';
    }

    loadFromStorage() {
        const saved = localStorage.getItem('holibooks_languages');
        if (saved) {
            this.languages = JSON.parse(saved);
        }
    }

    saveToStorage() {
        localStorage.setItem('holibooks_languages', JSON.stringify(this.languages));
    }
}

// Initialize and export
window.languageSelector = new LanguageSelector();
