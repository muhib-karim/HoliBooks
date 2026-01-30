/**
 * HoliBooks - Bookmarks Module
 * Save and manage favorite verses across all religions
 */

class BookmarkManager {
    constructor() {
        this.bookmarks = [];
        this.drawerOpen = false;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.createDrawerUI();
        this.bindEvents();
    }

    // Load bookmarks from localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('holibooks_bookmarks');
        if (saved) {
            try {
                this.bookmarks = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load bookmarks:', e);
                this.bookmarks = [];
            }
        }
    }

    // Save bookmarks to localStorage
    saveToStorage() {
        localStorage.setItem('holibooks_bookmarks', JSON.stringify(this.bookmarks));
    }

    // Add a bookmark
    addBookmark(bookmark) {
        // Check if already exists
        const exists = this.bookmarks.some(b => 
            b.religion === bookmark.religion && 
            b.reference === bookmark.reference
        );

        if (exists) {
            this.showToast('This verse is already bookmarked', 'info');
            return false;
        }

        const newBookmark = {
            id: Date.now().toString(),
            religion: bookmark.religion,
            religionName: bookmark.religionName,
            text: bookmark.text,
            reference: bookmark.reference,
            translation: bookmark.translation || '',
            timestamp: new Date().toISOString()
        };

        this.bookmarks.unshift(newBookmark);
        this.saveToStorage();
        this.renderBookmarks();
        this.showToast('Verse bookmarked!', 'success');
        return true;
    }

    // Remove a bookmark
    removeBookmark(id) {
        this.bookmarks = this.bookmarks.filter(b => b.id !== id);
        this.saveToStorage();
        this.renderBookmarks();
        this.showToast('Bookmark removed', 'info');
    }

    // Check if a verse is bookmarked
    isBookmarked(religion, reference) {
        return this.bookmarks.some(b => 
            b.religion === religion && b.reference === reference
        );
    }

    // Toggle bookmark
    toggleBookmark(bookmark) {
        const existing = this.bookmarks.find(b => 
            b.religion === bookmark.religion && 
            b.reference === bookmark.reference
        );

        if (existing) {
            this.removeBookmark(existing.id);
            return false;
        } else {
            this.addBookmark(bookmark);
            return true;
        }
    }

    // Create drawer UI
    createDrawerUI() {
        const drawerHTML = `
            <div class="bookmark-drawer-overlay" id="bookmark-drawer-overlay">
                <div class="bookmark-drawer" id="bookmark-drawer">
                    <div class="bookmark-drawer-header">
                        <div class="bookmark-drawer-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                            <span>My Bookmarks</span>
                            <span class="bookmark-count" id="bookmark-count">0</span>
                        </div>
                        <button class="btn btn-icon btn-secondary" id="bookmark-drawer-close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="bookmark-search">
                        <input type="text" id="bookmark-search" placeholder="Search bookmarks..." class="bookmark-search-input">
                    </div>
                    <div class="bookmark-list" id="bookmark-list">
                        <!-- Bookmarks will be rendered here -->
                    </div>
                    <div class="bookmark-drawer-footer">
                        <button class="btn btn-secondary" id="bookmark-export">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                            Export
                        </button>
                        <button class="btn btn-secondary" id="bookmark-clear">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            <!-- Floating Bookmark Button -->
            <button class="bookmark-fab" id="bookmark-fab" title="My Bookmarks">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <span class="bookmark-fab-count" id="bookmark-fab-count">0</span>
            </button>
        `;

        // Add drawer styles
        const styles = document.createElement('style');
        styles.textContent = `
            .bookmark-drawer-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 2000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s, visibility 0.3s;
            }

            .bookmark-drawer-overlay.open {
                opacity: 1;
                visibility: visible;
            }

            .bookmark-drawer {
                position: fixed;
                top: 0;
                right: 0;
                width: 100%;
                max-width: 420px;
                height: 100%;
                background: var(--bg-primary);
                border-left: 1px solid var(--border-color);
                display: flex;
                flex-direction: column;
                transform: translateX(100%);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .bookmark-drawer-overlay.open .bookmark-drawer {
                transform: translateX(0);
            }

            .bookmark-drawer-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-lg) var(--space-xl);
                border-bottom: 1px solid var(--border-color);
            }

            .bookmark-drawer-title {
                display: flex;
                align-items: center;
                gap: var(--space-md);
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-primary);
            }

            .bookmark-drawer-title svg {
                color: var(--accent-primary);
            }

            .bookmark-count {
                background: var(--accent-primary);
                color: var(--bg-primary);
                font-size: 0.75rem;
                font-weight: 600;
                padding: 2px 8px;
                border-radius: var(--radius-full);
            }

            .bookmark-search {
                padding: var(--space-md) var(--space-xl);
                border-bottom: 1px solid var(--border-color);
            }

            .bookmark-search-input {
                width: 100%;
                padding: var(--space-md) var(--space-lg);
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                color: var(--text-primary);
                font-size: 1rem;
                transition: border-color 0.2s;
            }

            .bookmark-search-input:focus {
                outline: none;
                border-color: var(--accent-primary);
            }

            .bookmark-search-input::placeholder {
                color: var(--text-muted);
            }

            .bookmark-list {
                flex: 1;
                overflow-y: auto;
                padding: var(--space-md);
            }

            .bookmark-item {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                padding: var(--space-lg);
                margin-bottom: var(--space-md);
                cursor: pointer;
                transition: all 0.2s;
            }

            .bookmark-item:hover {
                border-color: var(--accent-primary);
                transform: translateX(4px);
            }

            .bookmark-item-religion {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                font-size: 0.875rem;
                color: var(--accent-primary);
                margin-bottom: var(--space-sm);
            }

            .bookmark-item-text {
                font-size: 0.95rem;
                line-height: 1.6;
                color: var(--text-primary);
                margin-bottom: var(--space-sm);
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .bookmark-item-reference {
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-bottom: var(--space-md);
            }

            .bookmark-item-actions {
                display: flex;
                gap: var(--space-sm);
            }

            .bookmark-item-actions .btn {
                padding: var(--space-sm) var(--space-md);
                font-size: 0.875rem;
            }

            .bookmark-empty {
                text-align: center;
                padding: var(--space-3xl) var(--space-xl);
                color: var(--text-secondary);
            }

            .bookmark-empty svg {
                width: 64px;
                height: 64px;
                margin-bottom: var(--space-lg);
                opacity: 0.3;
            }

            .bookmark-drawer-footer {
                display: flex;
                gap: var(--space-md);
                padding: var(--space-lg) var(--space-xl);
                border-top: 1px solid var(--border-color);
            }

            .bookmark-drawer-footer .btn {
                flex: 1;
                justify-content: center;
            }

            /* Floating Action Button */
            .bookmark-fab {
                position: fixed;
                bottom: 100px;
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                border: none;
                color: var(--bg-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(201, 165, 92, 0.4);
                transition: all 0.3s;
                z-index: 100;
            }

            .bookmark-fab:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(201, 165, 92, 0.5);
            }

            .bookmark-fab-count {
                position: absolute;
                top: -4px;
                right: -4px;
                background: #ef4444;
                color: white;
                font-size: 0.75rem;
                font-weight: 600;
                min-width: 20px;
                height: 20px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 6px;
            }

            .bookmark-fab-count:empty,
            .bookmark-fab-count[data-count="0"] {
                display: none;
            }

            /* Bookmark Button in Verse Cards */
            .verse-bookmark-btn {
                position: absolute;
                top: var(--space-md);
                right: 60px;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .verse-card:hover .verse-bookmark-btn {
                opacity: 1;
            }

            .verse-bookmark-btn.active {
                opacity: 1;
                color: var(--accent-primary);
            }

            .verse-bookmark-btn.active svg {
                fill: var(--accent-primary);
            }

            @media (max-width: 768px) {
                .bookmark-fab {
                    bottom: 80px;
                    right: 16px;
                    width: 48px;
                    height: 48px;
                }

                .bookmark-drawer {
                    max-width: 100%;
                }

                .verse-bookmark-btn {
                    opacity: 1;
                    right: var(--space-md);
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.insertAdjacentHTML('beforeend', drawerHTML);

        // Cache elements
        this.overlay = document.getElementById('bookmark-drawer-overlay');
        this.drawer = document.getElementById('bookmark-drawer');
        this.listContainer = document.getElementById('bookmark-list');
        this.countEl = document.getElementById('bookmark-count');
        this.fabCountEl = document.getElementById('bookmark-fab-count');
    }

    // Bind events
    bindEvents() {
        // Toggle drawer
        document.getElementById('bookmark-fab').addEventListener('click', () => this.openDrawer());
        document.getElementById('bookmark-drawer-close').addEventListener('click', () => this.closeDrawer());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.closeDrawer();
        });

        // Search
        document.getElementById('bookmark-search').addEventListener('input', (e) => {
            this.filterBookmarks(e.target.value);
        });

        // Export
        document.getElementById('bookmark-export').addEventListener('click', () => this.exportBookmarks());

        // Clear all
        document.getElementById('bookmark-clear').addEventListener('click', () => {
            if (this.bookmarks.length > 0 && confirm('Are you sure you want to clear all bookmarks?')) {
                this.bookmarks = [];
                this.saveToStorage();
                this.renderBookmarks();
                this.showToast('All bookmarks cleared', 'info');
            }
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.drawerOpen) {
                this.closeDrawer();
            }
        });

        this.renderBookmarks();
    }

    // Open drawer
    openDrawer() {
        this.drawerOpen = true;
        this.overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        this.renderBookmarks();
    }

    // Close drawer
    closeDrawer() {
        this.drawerOpen = false;
        this.overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Render bookmarks
    renderBookmarks(bookmarksToRender = null) {
        const bookmarks = bookmarksToRender || this.bookmarks;
        
        // Update counts
        const count = this.bookmarks.length;
        this.countEl.textContent = count;
        this.fabCountEl.textContent = count;
        this.fabCountEl.style.display = count > 0 ? 'flex' : 'none';

        if (bookmarks.length === 0) {
            this.listContainer.innerHTML = `
                <div class="bookmark-empty">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                    <p>No bookmarks yet</p>
                    <p style="font-size: 0.875rem; margin-top: var(--space-sm);">Start reading and save your favorite verses!</p>
                </div>
            `;
            return;
        }

        this.listContainer.innerHTML = bookmarks.map(bookmark => `
            <div class="bookmark-item" data-id="${bookmark.id}">
                <div class="bookmark-item-religion">
                    <span>${this.getReligionIcon(bookmark.religion)}</span>
                    <span>${bookmark.religionName}</span>
                </div>
                <div class="bookmark-item-text">"${this.escapeHtml(bookmark.text)}"</div>
                <div class="bookmark-item-reference">${bookmark.reference}</div>
                <div class="bookmark-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="bookmarkManager.copyBookmark('${bookmark.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        Copy
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="bookmarkManager.shareBookmark('${bookmark.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                        </svg>
                        Share
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="bookmarkManager.removeBookmark('${bookmark.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Filter bookmarks
    filterBookmarks(query) {
        if (!query) {
            this.renderBookmarks();
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = this.bookmarks.filter(b => 
            b.text.toLowerCase().includes(lowerQuery) ||
            b.reference.toLowerCase().includes(lowerQuery) ||
            b.religionName.toLowerCase().includes(lowerQuery)
        );

        this.renderBookmarks(filtered);
    }

    // Copy bookmark
    copyBookmark(id) {
        const bookmark = this.bookmarks.find(b => b.id === id);
        if (bookmark) {
            const text = `"${bookmark.text}" — ${bookmark.reference}`;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard!', 'success');
            });
        }
    }

    // Share bookmark
    shareBookmark(id) {
        const bookmark = this.bookmarks.find(b => b.id === id);
        if (!bookmark) return;

        const text = `"${bookmark.text}" — ${bookmark.reference}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'HoliBooks Bookmark',
                text: text
            });
        } else {
            this.copyBookmark(id);
        }
    }

    // Export bookmarks
    exportBookmarks() {
        if (this.bookmarks.length === 0) {
            this.showToast('No bookmarks to export', 'info');
            return;
        }

        const data = {
            app: 'HoliBooks',
            exportedAt: new Date().toISOString(),
            bookmarks: this.bookmarks
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `holibooks-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Bookmarks exported!', 'success');
    }

    // Get religion icon
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

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show toast notification
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            // Fallback if global toast isn't available
            const event = new CustomEvent('holibooks:toast', { detail: { message, type } });
            document.dispatchEvent(event);
        }
    }
}

// Initialize
window.bookmarkManager = new BookmarkManager();
