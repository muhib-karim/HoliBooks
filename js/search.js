/**
 * HoliBooks - Global Search Module
 * Search across all sacred texts
 */

class GlobalSearch {
    constructor() {
        this.isOpen = false;
        this.searchHistory = [];
        this.recentSearches = [];
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.createModalUI();
        this.bindEvents();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('holibooks_search_history');
        if (saved) {
            try {
                this.searchHistory = JSON.parse(saved);
                this.recentSearches = this.searchHistory.slice(0, 5);
            } catch (e) {
                console.error('Failed to load search history:', e);
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('holibooks_search_history', JSON.stringify(this.searchHistory.slice(0, 20)));
    }

    createModalUI() {
        const modalHTML = `
            <div class="search-modal-overlay" id="search-modal-overlay">
                <div class="search-modal" id="search-modal">
                    <div class="search-modal-header">
                        <div class="search-input-wrapper">
                            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <input type="text" id="search-input" placeholder="Search scriptures, verses, chapters..." class="search-input" autocomplete="off">
                            <div class="search-shortcut">ESC</div>
                        </div>
                        <button class="btn btn-icon btn-secondary" id="search-modal-close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="search-modal-body">
                        <div class="search-recent" id="search-recent">
                            <div class="search-section-title">Recent Searches</div>
                            <div class="search-recent-list" id="search-recent-list"></div>
                        </div>
                        <div class="search-results" id="search-results" style="display: none;">
                            <div class="search-results-header">
                                <span id="search-results-count"></span>
                                <button class="btn btn-text" id="search-clear-results">Clear</button>
                            </div>
                            <div class="search-results-list" id="search-results-list"></div>
                        </div>
                        <div class="search-suggestions" id="search-suggestions">
                            <div class="search-section-title">Popular Searches</div>
                            <div class="search-suggestions-list">
                                <button class="search-suggestion-chip" data-query="love">love</button>
                                <button class="search-suggestion-chip" data-query="peace">peace</button>
                                <button class="search-suggestion-chip" data-query="mercy">mercy</button>
                                <button class="search-suggestion-chip" data-query="guidance">guidance</button>
                                <button class="search-suggestion-chip" data-query="forgiveness">forgiveness</button>
                                <button class="search-suggestion-chip" data-query="faith">faith</button>
                            </div>
                        </div>
                    </div>
                    <div class="search-modal-footer">
                        <div class="search-shortcuts-hint">
                            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
                            <span><kbd>↵</kbd> Select</span>
                            <span><kbd>esc</kbd> Close</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating Search Button -->
            <button class="search-fab" id="search-fab" title="Search (Ctrl+K)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
            </button>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            .search-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                z-index: 3000;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 10vh;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s, visibility 0.2s;
            }

            .search-modal-overlay.open {
                opacity: 1;
                visibility: visible;
            }

            .search-modal {
                width: 90%;
                max-width: 640px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-lg);
                overflow: hidden;
                transform: scale(0.95) translateY(-10px);
                transition: transform 0.2s;
            }

            .search-modal-overlay.open .search-modal {
                transform: scale(1) translateY(0);
            }

            .search-modal-header {
                display: flex;
                align-items: center;
                gap: var(--space-md);
                padding: var(--space-md) var(--space-lg);
                border-bottom: 1px solid var(--border-color);
            }

            .search-input-wrapper {
                flex: 1;
                display: flex;
                align-items: center;
                gap: var(--space-md);
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                padding: var(--space-sm) var(--space-md);
            }

            .search-input-wrapper:focus-within {
                border-color: var(--accent-primary);
            }

            .search-icon {
                color: var(--text-muted);
                flex-shrink: 0;
            }

            .search-input {
                flex: 1;
                background: transparent;
                border: none;
                color: var(--text-primary);
                font-size: 1rem;
                outline: none;
            }

            .search-input::placeholder {
                color: var(--text-muted);
            }

            .search-shortcut {
                font-size: 0.75rem;
                color: var(--text-muted);
                background: var(--bg-secondary);
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid var(--border-color);
            }

            .search-modal-body {
                max-height: 50vh;
                overflow-y: auto;
                padding: var(--space-md) 0;
            }

            .search-section-title {
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 1px;
                padding: var(--space-sm) var(--space-lg);
            }

            .search-recent-list,
            .search-results-list {
                padding: 0 var(--space-md);
            }

            .search-recent-item,
            .search-result-item {
                display: flex;
                align-items: center;
                gap: var(--space-md);
                padding: var(--space-md);
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: background 0.15s;
            }

            .search-recent-item:hover,
            .search-result-item:hover,
            .search-recent-item.selected,
            .search-result-item.selected {
                background: var(--bg-hover);
            }

            .search-recent-item svg,
            .search-result-icon {
                color: var(--text-muted);
                flex-shrink: 0;
            }

            .search-recent-text {
                flex: 1;
                color: var(--text-primary);
            }

            .search-recent-remove {
                opacity: 0;
                color: var(--text-muted);
                transition: opacity 0.15s;
            }

            .search-recent-item:hover .search-recent-remove {
                opacity: 1;
            }

            .search-recent-remove:hover {
                color: var(--text-primary);
            }

            .search-results-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm) var(--space-lg);
                border-bottom: 1px solid var(--border-color);
                margin-bottom: var(--space-sm);
            }

            .search-results-count {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .search-result-item {
                flex-direction: column;
                align-items: flex-start;
                gap: var(--space-sm);
            }

            .search-result-meta {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                font-size: 0.875rem;
            }

            .search-result-religion {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                color: var(--accent-primary);
            }

            .search-result-reference {
                color: var(--text-secondary);
            }

            .search-result-text {
                color: var(--text-primary);
                line-height: 1.5;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .search-result-highlight {
                background: rgba(201, 165, 92, 0.3);
                border-radius: 2px;
                padding: 0 2px;
            }

            .search-suggestions-list {
                display: flex;
                flex-wrap: wrap;
                gap: var(--space-sm);
                padding: 0 var(--space-lg);
            }

            .search-suggestion-chip {
                background: var(--bg-hover);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-full);
                padding: var(--space-sm) var(--space-md);
                color: var(--text-secondary);
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.15s;
            }

            .search-suggestion-chip:hover {
                background: var(--accent-primary);
                color: var(--bg-primary);
                border-color: var(--accent-primary);
            }

            .search-modal-footer {
                padding: var(--space-md) var(--space-lg);
                border-top: 1px solid var(--border-color);
                background: var(--bg-primary);
            }

            .search-shortcuts-hint {
                display: flex;
                gap: var(--space-lg);
                font-size: 0.75rem;
                color: var(--text-muted);
            }

            .search-shortcuts-hint kbd {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 2px 6px;
                font-family: inherit;
            }

            /* Floating Search Button */
            .search-fab {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                color: var(--text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: var(--shadow-md);
                transition: all 0.3s;
                z-index: 100;
            }

            .search-fab:hover {
                background: var(--accent-primary);
                color: var(--bg-primary);
                transform: scale(1.1);
            }

            @media (max-width: 768px) {
                .search-modal-overlay {
                    padding-top: 0;
                    align-items: flex-end;
                }

                .search-modal {
                    width: 100%;
                    max-width: 100%;
                    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
                    max-height: 80vh;
                }

                .search-fab {
                    bottom: 80px;
                    right: 16px;
                    width: 48px;
                    height: 48px;
                }

                .search-shortcuts-hint {
                    display: none;
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Cache elements
        this.overlay = document.getElementById('search-modal-overlay');
        this.modal = document.getElementById('search-modal');
        this.input = document.getElementById('search-input');
        this.recentSection = document.getElementById('search-recent');
        this.recentList = document.getElementById('search-recent-list');
        this.resultsSection = document.getElementById('search-results');
        this.resultsList = document.getElementById('search-results-list');
        this.resultsCount = document.getElementById('search-results-count');
        this.suggestionsSection = document.getElementById('search-suggestions');
    }

    bindEvents() {
        // Toggle modal
        document.getElementById('search-fab').addEventListener('click', () => this.open());
        document.getElementById('search-modal-close').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Search input
        this.input.addEventListener('input', (e) => this.handleInput(e.target.value));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Clear results
        document.getElementById('search-clear-results').addEventListener('click', () => {
            this.input.value = '';
            this.showRecent();
            this.input.focus();
        });

        // Suggestion chips
        document.querySelectorAll('.search-suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.input.value = chip.dataset.query;
                this.handleInput(chip.dataset.query);
            });
        });

        // Keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        this.isOpen = true;
        this.overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        this.input.focus();
        this.renderRecent();
    }

    close() {
        this.isOpen = false;
        this.overlay.classList.remove('open');
        document.body.style.overflow = '';
        this.input.value = '';
        this.showRecent();
    }

    handleInput(query) {
        if (!query.trim()) {
            this.showRecent();
            return;
        }

        this.showResults();
        this.performSearch(query);
    }

    handleKeydown(e) {
        const items = this.resultsSection.style.display !== 'none' 
            ? this.resultsList.querySelectorAll('.search-result-item')
            : this.recentList.querySelectorAll('.search-recent-item');
        
        const selected = this.modal.querySelector('.selected');
        let index = Array.from(items).indexOf(selected);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                index = Math.min(index + 1, items.length - 1);
                this.selectItem(items, index);
                break;
            case 'ArrowUp':
                e.preventDefault();
                index = Math.max(index - 1, -1);
                if (index === -1) {
                    this.input.focus();
                    selected?.classList.remove('selected');
                } else {
                    this.selectItem(items, index);
                }
                break;
            case 'Enter':
                if (selected) {
                    selected.click();
                } else if (this.input.value.trim()) {
                    this.addToHistory(this.input.value.trim());
                }
                break;
        }
    }

    selectItem(items, index) {
        items.forEach(item => item.classList.remove('selected'));
        if (items[index]) {
            items[index].classList.add('selected');
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    showRecent() {
        this.recentSection.style.display = 'block';
        this.resultsSection.style.display = 'none';
        this.suggestionsSection.style.display = 'block';
        this.renderRecent();
    }

    showResults() {
        this.recentSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
        this.suggestionsSection.style.display = 'none';
    }

    renderRecent() {
        if (this.recentSearches.length === 0) {
            this.recentSection.style.display = 'none';
            return;
        }

        this.recentList.innerHTML = this.recentSearches.map((query, index) => `
            <div class="search-recent-item" data-index="${index}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
                <span class="search-recent-text">${this.escapeHtml(query)}</span>
                <button class="search-recent-remove" onclick="globalSearch.removeFromHistory(${index}); event.stopPropagation();">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `).join('');

        this.recentList.querySelectorAll('.search-recent-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const query = this.recentSearches[index];
                this.input.value = query;
                this.handleInput(query);
            });
        });
    }

    addToHistory(query) {
        this.searchHistory = [query, ...this.searchHistory.filter(q => q !== query)].slice(0, 20);
        this.recentSearches = this.searchHistory.slice(0, 5);
        this.saveToStorage();
    }

    removeFromHistory(index) {
        const query = this.recentSearches[index];
        this.searchHistory = this.searchHistory.filter(q => q !== query);
        this.recentSearches = this.searchHistory.slice(0, 5);
        this.saveToStorage();
        this.renderRecent();
    }

    async performSearch(query) {
        // This is a simplified search - in production, you'd search actual API data
        const results = this.getSampleResults(query);
        
        this.resultsCount.textContent = `${results.length} results found`;
        
        if (results.length === 0) {
            this.resultsList.innerHTML = `
                <div class="search-empty" style="text-align: center; padding: var(--space-2xl); color: var(--text-secondary);">
                    <p>No results found for "${this.escapeHtml(query)}"</p>
                    <p style="font-size: 0.875rem; margin-top: var(--space-sm);">Try different keywords or browse by religion</p>
                </div>
            `;
            return;
        }

        this.resultsList.innerHTML = results.map((result, index) => `
            <div class="search-result-item" data-index="${index}" onclick="globalSearch.navigateToResult('${result.religion}', '${result.reference}')">
                <div class="search-result-meta">
                    <span class="search-result-religion">
                        <span>${this.getReligionIcon(result.religion)}</span>
                        <span>${result.religionName}</span>
                    </span>
                    <span class="search-result-reference">${result.reference}</span>
                </div>
                <div class="search-result-text">${this.highlightText(this.escapeHtml(result.text), query)}</div>
            </div>
        `).join('');

        this.addToHistory(query);
    }

    getSampleResults(query) {
        const lowerQuery = query.toLowerCase();
        const sampleData = [
            { religion: 'islam', religionName: 'Islam', reference: 'Quran 2:255', text: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence...' },
            { religion: 'islam', religionName: 'Islam', reference: 'Quran 1:1', text: 'In the name of Allah, the Entirely Merciful, the Especially Merciful...' },
            { religion: 'christianity', religionName: 'Christianity', reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son...' },
            { religion: 'christianity', religionName: 'Christianity', reference: '1 Corinthians 13:4-8', text: 'Love is patient, love is kind. It does not envy, it does not boast...' },
            { religion: 'hinduism', religionName: 'Hinduism', reference: 'Bhagavad Gita 2:20', text: 'For the soul there is neither birth nor death at any time...' },
            { religion: 'buddhism', religionName: 'Buddhism', reference: 'Dhammapada 50', text: 'Let none find fault with others; let none see the omissions and commissions of others...' },
        ];

        return sampleData.filter(item => 
            item.text.toLowerCase().includes(lowerQuery) ||
            item.reference.toLowerCase().includes(lowerQuery)
        );
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<span class="search-result-highlight">$1</span>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getReligionIcon(religion) {
        const icons = {
            islam: '☪️',
            christianity: '✝️',
            hinduism: '🕉️',
            judaism: '✡️',
            sikhism: '🪯',
            buddhism: '☸️'
        };
        return icons[religion] || '📖';
    }

    navigateToResult(religion, reference) {
        // In production, this would navigate to the specific verse
        const urls = {
            islam: 'religions/islam/quran.html',
            christianity: 'religions/christianity/bible.html',
            hinduism: 'religions/hinduism/gita.html',
            judaism: 'religions/judaism/torah.html',
            sikhism: 'religions/sikhism/gurbani.html',
            buddhism: 'religions/buddhism/tripitaka.html'
        };

        this.close();
        window.location.href = urls[religion] || 'index.html';
    }
}

// Initialize
window.globalSearch = new GlobalSearch();
