/**
 * HoliBooks - API Health Monitor
 * Monitors API status and provides offline fallback support
 */

class APIMonitor {
    constructor() {
        this.apis = {
            quran: {
                name: 'AlQuran Cloud',
                url: 'https://api.alquran.cloud/v1/surah/1',
                status: 'unknown',
                responseTime: null,
                lastChecked: null
            },
            bible: {
                name: 'Bible API',
                url: 'https://cdn.jsdelivr.net/gh/wldeh/bible-api@master/books/en.json',
                status: 'unknown',
                responseTime: null,
                lastChecked: null
            },
            gita: {
                name: 'Vedic Scriptures',
                url: 'https://vedicscriptures.github.io/gita/chapters/1',
                status: 'unknown',
                responseTime: null,
                lastChecked: null
            },
            gurbani: {
                name: 'GurbaniNow',
                url: 'https://gurbaninow.com/gurbani/1',
                status: 'unknown',
                responseTime: null,
                lastChecked: null
            }
        };
        
        this.cache = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.retryDelay = 2000;
        this.statusIndicator = null;
        this.tooltip = null;
        
        this.init();
    }
    
    async init() {
        this.createStatusIndicator();
        this.createTooltip();
        this.bindEvents();
        
        // Check API status on page load
        await this.checkAllAPIs();
        
        // Periodic health check every 5 minutes
        setInterval(() => this.checkAllAPIs(), 5 * 60 * 1000);
    }
    
    createStatusIndicator() {
        // Check if indicator already exists
        if (document.getElementById('api-status-indicator')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'api-status-indicator';
        indicator.className = 'api-status-indicator';
        indicator.innerHTML = `
            <div class="api-status-dot" id="api-status-dot"></div>
            <span class="api-status-text" id="api-status-text">Checking...</span>
        `;
        
        // Add to footer or header
        const footer = document.querySelector('.footer-bottom');
        const header = document.querySelector('.hero-content');
        
        if (footer) {
            footer.insertBefore(indicator, footer.firstChild);
        } else if (header) {
            indicator.style.cssText = 'position: absolute; top: 20px; right: 20px;';
            header.appendChild(indicator);
        }
        
        this.statusIndicator = indicator;
    }
    
    createTooltip() {
        if (document.getElementById('api-status-tooltip')) return;
        
        const tooltip = document.createElement('div');
        tooltip.id = 'api-status-tooltip';
        tooltip.className = 'api-status-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        
        this.tooltip = tooltip;
    }
    
    bindEvents() {
        if (!this.statusIndicator) return;
        
        // Show tooltip on hover
        this.statusIndicator.addEventListener('mouseenter', () => {
            this.showTooltip();
        });
        
        this.statusIndicator.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Refresh on click
        this.statusIndicator.addEventListener('click', () => {
            this.checkAllAPIs();
            this.showToast('Checking API status...', 'info');
        });
        
        // Handle offline/online events
        window.addEventListener('offline', () => {
            this.updateOverallStatus('offline');
        });
        
        window.addEventListener('online', () => {
            this.checkAllAPIs();
        });
    }
    
    showTooltip() {
        if (!this.tooltip) return;
        
        const statusList = Object.entries(this.apis).map(([key, api]) => {
            const statusIcon = this.getStatusIcon(api.status);
            const responseTime = api.responseTime ? `${api.responseTime}ms` : '--';
            return `
                <div class="api-status-item">
                    <span class="api-status-icon ${api.status}">${statusIcon}</span>
                    <span class="api-status-name">${api.name}</span>
                    <span class="api-status-time">${responseTime}</span>
                </div>
            `;
        }).join('');
        
        const overallStatus = this.getOverallStatus();
        const message = overallStatus === 'online' 
            ? 'All systems operational'
            : overallStatus === 'degraded'
            ? 'Some services experiencing issues'
            : overallStatus === 'offline'
            ? 'You are offline. Using cached data.'
            : 'Checking API status...';
        
        this.tooltip.innerHTML = `
            <div class="api-tooltip-header">
                <strong>API Status</strong>
                <span class="api-overall-status ${overallStatus}">${message}</span>
            </div>
            <div class="api-tooltip-content">
                ${statusList}
            </div>
            <div class="api-tooltip-footer">
                <small>Click to refresh</small>
            </div>
        `;
        
        // Position tooltip
        const rect = this.statusIndicator.getBoundingClientRect();
        this.tooltip.style.cssText = `
            display: block;
            position: fixed;
            bottom: ${window.innerHeight - rect.top + 10}px;
            right: ${window.innerWidth - rect.right}px;
            z-index: 10000;
        `;
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'online': return '●';
            case 'degraded': return '◐';
            case 'offline': return '○';
            default: return '?';
        }
    }
    
    async checkAllAPIs() {
        const promises = Object.entries(this.apis).map(async ([key, api]) => {
            await this.checkAPI(key);
        });
        
        await Promise.all(promises);
        this.updateOverallStatus();
    }
    
    async checkAPI(apiKey) {
        const api = this.apis[apiKey];
        const startTime = performance.now();
        
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(api.url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            const endTime = performance.now();
            api.responseTime = Math.round(endTime - startTime);
            api.lastChecked = new Date().toISOString();
            
            // Determine status based on response time
            if (api.responseTime < 1000) {
                api.status = 'online';
            } else if (api.responseTime < 5000) {
                api.status = 'degraded';
            } else {
                api.status = 'offline';
            }
            
            // Reset retry attempts on success
            this.retryAttempts.set(apiKey, 0);
            
        } catch (error) {
            api.status = 'offline';
            api.responseTime = null;
            api.lastChecked = new Date().toISOString();
            
            // Attempt retry with exponential backoff
            await this.retryAPI(apiKey);
        }
    }
    
    async retryAPI(apiKey) {
        const attempts = this.retryAttempts.get(apiKey) || 0;
        
        if (attempts < this.maxRetries) {
            this.retryAttempts.set(apiKey, attempts + 1);
            const delay = this.retryDelay * Math.pow(2, attempts);
            
            await this.sleep(delay);
            await this.checkAPI(apiKey);
        }
    }
    
    getOverallStatus() {
        if (!navigator.onLine) return 'offline';
        
        const statuses = Object.values(this.apis).map(api => api.status);
        
        if (statuses.every(s => s === 'online')) return 'online';
        if (statuses.some(s => s === 'online')) return 'degraded';
        return 'offline';
    }
    
    updateOverallStatus(forcedStatus = null) {
        const status = forcedStatus || this.getOverallStatus();
        const dot = document.getElementById('api-status-dot');
        const text = document.getElementById('api-status-text');
        
        if (!dot || !text) return;
        
        dot.className = `api-status-dot ${status}`;
        
        switch (status) {
            case 'online':
                text.textContent = 'All systems operational';
                break;
            case 'degraded':
                text.textContent = 'Some services slow';
                break;
            case 'offline':
                text.textContent = 'Offline mode';
                break;
            default:
                text.textContent = 'Checking...';
        }
    }
    
    // Cache management for offline support
    async fetchWithCache(url, options = {}) {
        const cacheKey = `${url}-${JSON.stringify(options)}`;
        
        // Try cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
                console.log('[API Monitor] Using cached data for:', url);
                return cached.data;
            }
        }
        
        // Fetch fresh data
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            // Cache successful response
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            // Return cached data if available, even if expired
            if (this.cache.has(cacheKey)) {
                console.log('[API Monitor] Using stale cached data for:', url);
                return this.cache.get(cacheKey).data;
            }
            throw error;
        }
    }
    
    // Clear expired cache entries
    clearExpiredCache() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > maxAge) {
                this.cache.delete(key);
            }
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showToast(message, type = 'info') {
        if (window.HoliBooks && window.HoliBooks.showToast) {
            window.HoliBooks.showToast(message, type);
        } else {
            // Fallback toast
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 12px 24px;
                background: var(--bg-card);
                color: var(--text-primary);
                border-radius: 8px;
                z-index: 10000;
                animation: slideUp 0.3s ease;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
}

// CSS for API Monitor
const apiMonitorStyles = `
    .api-status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--glass-bg, rgba(255, 255, 255, 0.05));
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        margin-bottom: 16px;
    }
    
    .api-status-indicator:hover {
        background: var(--glass-bg, rgba(255, 255, 255, 0.1));
        transform: translateY(-2px);
    }
    
    .api-status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        animation: pulse-dot 2s ease-in-out infinite;
    }
    
    .api-status-dot.online {
        background: #22c55e;
        box-shadow: 0 0 10px #22c55e;
    }
    
    .api-status-dot.degraded {
        background: #eab308;
        box-shadow: 0 0 10px #eab308;
    }
    
    .api-status-dot.offline {
        background: #ef4444;
        box-shadow: 0 0 10px #ef4444;
        animation: none;
    }
    
    .api-status-text {
        font-size: 0.85rem;
        color: var(--text-secondary);
    }
    
    .api-status-tooltip {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 16px;
        min-width: 280px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(20px);
    }
    
    .api-tooltip-header {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
    }
    
    .api-tooltip-header strong {
        display: block;
        margin-bottom: 4px;
        color: var(--text-primary);
    }
    
    .api-overall-status {
        font-size: 0.85rem;
    }
    
    .api-overall-status.online {
        color: #22c55e;
    }
    
    .api-overall-status.degraded {
        color: #eab308;
    }
    
    .api-overall-status.offline {
        color: #ef4444;
    }
    
    .api-tooltip-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .api-status-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
    }
    
    .api-status-icon {
        font-size: 0.8rem;
        width: 16px;
        text-align: center;
    }
    
    .api-status-icon.online {
        color: #22c55e;
    }
    
    .api-status-icon.degraded {
        color: #eab308;
    }
    
    .api-status-icon.offline {
        color: #ef4444;
    }
    
    .api-status-name {
        flex: 1;
        color: var(--text-primary);
    }
    
    .api-status-time {
        color: var(--text-muted);
        font-size: 0.8rem;
        font-family: monospace;
    }
    
    .api-tooltip-footer {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        text-align: center;
        color: var(--text-muted);
    }
    
    @keyframes pulse-dot {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.7;
            transform: scale(1.1);
        }
    }
    
    [data-theme="light"] .api-status-tooltip {
        background: rgba(255, 255, 255, 0.95);
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = apiMonitorStyles;
document.head.appendChild(styleSheet);

// Initialize API Monitor when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiMonitor = new APIMonitor();
    });
} else {
    window.apiMonitor = new APIMonitor();
}

// Export for use in other scripts
window.HoliBooks = window.HoliBooks || {};
window.HoliBooks.APIMonitor = APIMonitor;
window.HoliBooks.apiMonitor = window.apiMonitor;
