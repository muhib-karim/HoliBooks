/**
 * HoliBooks - Audio Player Module
 * Global audio player for all scripture audio playback
 */

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.playbackRate = 1;
        this.isLooping = false;
        this.consecutiveErrors = 0;
        this.errorTimer = null;

        this.init();
    }

    init() {
        this.createPlayerUI();
        this.bindEvents();
        this.loadFromStorage();
    }

    createPlayerUI() {
        const playerHTML = `
            <div class="audio-player" id="audio-player">
                <div class="audio-player-content">
                    <div class="audio-info">
                        <div class="audio-title" id="audio-title">No track selected</div>
                        <div class="audio-subtitle" id="audio-subtitle"></div>
                    </div>
                    
                    <div class="audio-controls">
                        <button class="btn btn-icon btn-secondary" id="audio-prev" title="Previous">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-icon btn-primary" id="audio-play" title="Play/Pause">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" id="play-icon">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" id="pause-icon" style="display:none">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                        </button>
                        <button class="btn btn-icon btn-secondary" id="audio-next" title="Next">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="audio-progress">
                        <span class="audio-time" id="audio-current">0:00</span>
                        <div class="progress-bar" id="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <span class="audio-time" id="audio-duration">0:00</span>
                    </div>
                    
                    <div class="audio-extras">
                        <button class="btn btn-icon btn-secondary" id="audio-speed" title="Playback Speed">
                            1x
                        </button>
                        <button class="btn btn-icon btn-secondary" id="audio-loop" title="Loop">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                            </svg>
                        </button>
                        <button class="btn btn-icon btn-secondary" id="audio-close" title="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', playerHTML);

        // Cache DOM elements
        this.playerEl = document.getElementById('audio-player');
        this.titleEl = document.getElementById('audio-title');
        this.subtitleEl = document.getElementById('audio-subtitle');
        this.playBtn = document.getElementById('audio-play');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('audio-prev');
        this.nextBtn = document.getElementById('audio-next');
        this.progressBar = document.getElementById('progress-bar');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTimeEl = document.getElementById('audio-current');
        this.durationEl = document.getElementById('audio-duration');
        this.speedBtn = document.getElementById('audio-speed');
        this.loopBtn = document.getElementById('audio-loop');
        this.closeBtn = document.getElementById('audio-close');
    }

    bindEvents() {
        // Play/Pause
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Previous/Next
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());

        // Progress bar
        this.progressBar.addEventListener('click', (e) => this.seek(e));

        // Speed control
        this.speedBtn.addEventListener('click', () => this.cycleSpeed());

        // Loop control
        this.loopBtn.addEventListener('click', () => this.toggleLoop());

        // Close player
        this.closeBtn.addEventListener('click', () => this.hide());

        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.onTrackEnd());
        this.audio.addEventListener('error', (e) => this.onError(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    loadTrack(track) {
        this.currentTrack = track;
        this.audio.src = track.url;
        // Changing src resets the element's speed; re-apply the chosen one.
        this.applyPlaybackRate();
        this.titleEl.textContent = track.title || 'Unknown';
        this.subtitleEl.textContent = track.subtitle || '';
        this.show();
        this.play();
    }

    loadPlaylist(tracks, startIndex = 0) {
        this.playlist = tracks;
        this.currentIndex = startIndex;
        if (tracks.length > 0) {
            this.loadTrack(tracks[startIndex]);
        }
    }

    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.consecutiveErrors = 0;
            this.updatePlayButton();
        }).catch(err => {
            console.error('Playback failed:', err);
        });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    hasNext() {
        return this.currentIndex < this.playlist.length - 1;
    }

    // The playlist is one surah: it stops at either end instead of wrapping.
    playPrevious() {
        if (this.currentIndex <= 0 || this.playlist.length === 0) return;
        this.currentIndex -= 1;
        this.loadTrack(this.playlist[this.currentIndex]);
    }

    playNext() {
        if (!this.hasNext()) return;
        this.currentIndex += 1;
        this.loadTrack(this.playlist[this.currentIndex]);
    }

    seek(e) {
        // duration is NaN until metadata has loaded
        if (!Number.isFinite(this.audio.duration)) return;
        const rect = this.progressBar.getBoundingClientRect();
        const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        this.audio.currentTime = percent * this.audio.duration;
    }

    applyPlaybackRate() {
        this.audio.defaultPlaybackRate = this.playbackRate;
        this.audio.playbackRate = this.playbackRate;
        this.speedBtn.textContent = this.playbackRate + 'x';
    }

    cycleSpeed() {
        const currentIdx = AudioPlayer.SPEEDS.indexOf(this.playbackRate);
        this.playbackRate = AudioPlayer.SPEEDS[(currentIdx + 1) % AudioPlayer.SPEEDS.length];
        this.applyPlaybackRate();
        this.saveToStorage();
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.audio.loop = this.isLooping;
        this.loopBtn.classList.toggle('active', this.isLooping);
        this.loopBtn.style.color = this.isLooping ? 'var(--accent-primary)' : '';
    }

    updatePlayButton() {
        this.playIcon.style.display = this.isPlaying ? 'none' : 'block';
        this.pauseIcon.style.display = this.isPlaying ? 'block' : 'none';
    }

    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = percent + '%';
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    onTrackEnd() {
        if (this.isLooping) return;
        if (this.hasNext()) {
            this.playNext();
        } else {
            this.pause();
        }
    }

    onError(e) {
        console.error('Audio error:', e);
        this.isPlaying = false;
        this.updatePlayButton();

        // Show user-friendly error message
        this.titleEl.textContent = 'Audio unavailable';
        this.subtitleEl.textContent = 'Try playing another verse or check your connection';

        // Skip one bad track, but stop after a few in a row: when the device is
        // offline every track fails and this used to cycle the playlist forever.
        this.consecutiveErrors += 1;
        clearTimeout(this.errorTimer);
        this.errorTimer = null;
        if (this.hasNext() && this.consecutiveErrors < AudioPlayer.MAX_CONSECUTIVE_ERRORS) {
            this.errorTimer = setTimeout(() => {
                this.errorTimer = null;
                this.playNext();
            }, 2000);
        }
    }

    handleKeyboard(e) {
        // Only if player is visible
        if (!this.playerEl.classList.contains('visible')) return;

        switch (e.code) {
            case 'Space':
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.togglePlay();
                }
                break;
            case 'ArrowLeft':
                if (!Number.isFinite(this.audio.duration)) break;
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
                break;
            case 'ArrowRight':
                if (!Number.isFinite(this.audio.duration)) break;
                this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
                break;
        }
    }

    show() {
        this.playerEl.classList.add('visible');
        document.body.style.paddingBottom = '80px';
    }

    hide() {
        clearTimeout(this.errorTimer);
        this.errorTimer = null;
        this.pause();
        this.playerEl.classList.remove('visible');
        document.body.style.paddingBottom = '';
    }

    loadFromStorage() {
        // Stored data may be missing, corrupt or from another version.
        try {
            const data = JSON.parse(localStorage.getItem('holibooks_audio'));
            if (data && AudioPlayer.SPEEDS.includes(data.playbackRate)) {
                this.playbackRate = data.playbackRate;
            }
        } catch (e) {
            console.warn('Ignoring unreadable audio settings:', e);
        }
        this.applyPlaybackRate();
    }

    saveToStorage() {
        try {
            localStorage.setItem('holibooks_audio', JSON.stringify({
                playbackRate: this.playbackRate
            }));
        } catch (e) {
            console.warn('Could not save audio settings:', e);
        }
    }
}

AudioPlayer.SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
AudioPlayer.MAX_CONSECUTIVE_ERRORS = 3;

// Initialize and export
window.audioPlayer = new AudioPlayer();
