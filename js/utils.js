/**
 * HoliBooks - Utility Functions
 * Shared helper functions used across the application
 */

// ===== DOM Utilities =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ===== Safe storage access =====
// localStorage throws when storage is blocked (private modes, strict cookie
// settings). Nothing here may throw at load time, or every reader breaks.
function readRaw(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeRaw(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn('LocalStorage write failed:', e);
    }
}

// ===== Theme Management =====
const theme = {
    current: readRaw('holibooks_theme') === 'light' ? 'light' : 'dark',

    init() {
        document.documentElement.setAttribute('data-theme', this.current);
    },

    toggle() {
        this.current = this.current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.current);
        writeRaw('holibooks_theme', this.current);
    },

    set(themeName) {
        this.current = themeName === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.current);
        writeRaw('holibooks_theme', this.current);
    }
};

// ===== API Helpers =====
const FETCH_TIMEOUT_MS = 15000;

/**
 * Fetch JSON with a timeout. Rejects with an Error carrying `status` on a
 * non-2xx response.
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} JSON response
 */
async function fetchJSON(url, options = {}) {
    // Don't add Content-Type for GET requests (causes CORS preflight)
    const fetchOptions = {
        ...options,
        mode: 'cors'
    };

    // Only add Content-Type for non-GET requests
    if (options.method && options.method !== 'GET') {
        fetchOptions.headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });

        if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`);
            error.status = response.status;
            throw error;
        }

        // The abort signal stays armed while the body is read.
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

// Retry fetch with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fetchJSON(url, options);
        } catch (error) {
            // A 4xx means the request itself is wrong; repeating it cannot help.
            const permanent = error.status >= 400 && error.status < 500 &&
                error.status !== 408 && error.status !== 429;
            if (permanent || i === maxRetries - 1) throw error;
            await sleep(Math.pow(2, i) * 1000);
        }
    }
}

// ===== Value Guards =====
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escape text for use inside HTML. Everything that comes from an API,
 * the URL or localStorage must pass through this before innerHTML.
 * @param {*} value
 * @returns {string}
 */
function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/**
 * Parse an integer and accept it only inside [min, max].
 * @returns {number|*} the integer, or `fallback`
 */
function clampInt(value, min, max, fallback) {
    const n = typeof value === 'number' ? value
        : (typeof value === 'string' && /^\s*-?\d+\s*$/.test(value)) ? parseInt(value, 10)
        : NaN;
    return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

/**
 * Token source for "latest request wins": a slow earlier response must not
 * overwrite a newer one.
 */
function latestOnly() {
    let current = 0;
    return {
        next() { return ++current; },
        isCurrent(token) { return token === current; }
    };
}

/**
 * Drop repeated verse numbers. The upstream Bible JSON repeats every verse
 * (twice in KJV, four times in WEB).
 */
function dedupeVerses(verses, key = 'verse') {
    if (!Array.isArray(verses)) return [];
    const seen = new Set();
    return verses.filter(v => {
        const id = v && v[key] !== undefined && v[key] !== null ? String(v[key]) : '';
        if (id === '') return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

// ===== Number Utilities =====
function toArabicNumerals(num) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).split('').map(digit => arabicNumerals[parseInt(digit)] || digit).join('');
}

function toDevanagariNumerals(num) {
    const devanagari = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).split('').map(digit => devanagari[parseInt(digit)] || digit).join('');
}

function toGurmukhiNumerals(num) {
    const gurmukhi = ['੦', '੧', '੨', '੩', '੪', '੫', '੬', '੭', '੮', '੯'];
    return String(num).split('').map(digit => gurmukhi[parseInt(digit)] || digit).join('');
}

// ===== String Utilities =====
function truncate(str, maxLength = 100) {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ===== Time Utilities =====
function formatDuration(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== URL/Navigation =====
function getQueryParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
}

function setQueryParams(params) {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    });
    window.history.pushState({}, '', url);
}

function navigateTo(path) {
    window.location.href = path;
}

// ===== LocalStorage =====
const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('LocalStorage remove failed:', e);
        }
    }
};

// ===== Debounce & Throttle =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== Loading States =====
function showLoading(container, message = 'Loading...') {
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>${escapeHTML(message)}</p>
        </div>
    `;
}

/**
 * Show an error state with an optional working "Try Again" button.
 * The callback is attached as a listener, never serialised into markup,
 * so closures keep working and nothing is injected into the page.
 * @param {HTMLElement} container
 * @param {string} message
 * @param {Function|null} retryCallback
 */
function showError(container, message, retryCallback = null) {
    container.innerHTML = '';

    const box = document.createElement('div');
    box.className = 'loading error-state';
    box.setAttribute('role', 'alert');
    box.style.color = '#ff6b6b';

    const text = document.createElement('p');
    text.style.fontSize = '1.2rem';
    text.style.marginBottom = '15px';
    text.textContent = `⚠️ ${message}`;
    box.appendChild(text);

    if (typeof retryCallback === 'function') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-primary';
        button.textContent = 'Try Again';
        button.addEventListener('click', () => retryCallback());
        box.appendChild(button);
    }

    container.appendChild(box);
}

// ===== Scroll Management =====
function scrollToTop(smooth = true) {
    window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

function scrollToElement(selector, offset = 100) {
    const element = document.querySelector(selector);
    if (element) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

// ===== Event Delegation =====
function delegate(parent, eventType, selector, handler) {
    parent.addEventListener(eventType, (e) => {
        const target = e.target.closest(selector);
        if (target && parent.contains(target)) {
            handler.call(target, e, target);
        }
    });
}

// ===== Initialize Theme =====
theme.init();

// Export for use in modules
window.HoliBooks = {
    $, $$,
    theme,
    fetchJSON,
    fetchWithRetry,
    escapeHTML,
    clampInt,
    latestOnly,
    dedupeVerses,
    toArabicNumerals,
    toDevanagariNumerals,
    toGurmukhiNumerals,
    truncate,
    capitalize,
    formatDuration,
    sleep,
    getQueryParams,
    setQueryParams,
    navigateTo,
    storage,
    debounce,
    throttle,
    showLoading,
    showError,
    scrollToTop,
    scrollToElement,
    delegate
};
