/**
 * HoliBooks - Utility Functions
 * Shared helper functions used across the application
 */

// ===== DOM Utilities =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ===== Theme Management =====
const theme = {
    current: localStorage.getItem('holibooks_theme') || 'dark',

    init() {
        document.documentElement.setAttribute('data-theme', this.current);
    },

    toggle() {
        this.current = this.current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.current);
        localStorage.setItem('holibooks_theme', this.current);
    },

    set(themeName) {
        this.current = themeName;
        document.documentElement.setAttribute('data-theme', this.current);
        localStorage.setItem('holibooks_theme', this.current);
    }
};

// ===== API Helpers =====
async function fetchJSON(url, options = {}) {
    try {
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
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Retry fetch with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fetchJSON(url, options);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(Math.pow(2, i) * 1000);
        }
    }
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
        localStorage.removeItem(key);
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
            <p>${message}</p>
        </div>
    `;
}

function showError(container, message, retryCallback = null) {
    container.innerHTML = `
        <div class="loading" style="color: #ff6b6b;">
            <p style="font-size: 1.2rem; margin-bottom: 15px;">⚠️ ${message}</p>
            ${retryCallback ? `
                <button class="btn btn-primary" onclick="(${retryCallback.toString()})()">
                    Try Again
                </button>
            ` : ''}
        </div>
    `;
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
