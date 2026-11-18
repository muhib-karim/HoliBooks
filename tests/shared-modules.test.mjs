import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './helpers/browser-env.mjs';

const CORRUPT = ['{not json', 'null', '{}', '"x"', '[1,2]', '42'];
const open = (file, storage = {}) => createBrowser({ storage }).load('js/utils.js', file);

// Text-translation editions listed by api.alquran.cloud/v1/edition on 2026-11-10.
const VERIFIED_QURAN_EDITIONS = new Set(['en.sahih', 'en.pickthall', 'en.yusufali', 'ur.ahmedali', 'ur.jalandhry', 'fr.hamidullah',
  'de.aburida', 'es.cortes', 'tr.diyanet', 'id.indonesian', 'ru.kuliev', 'zh.majian', 'bn.bengali', 'hi.hindi', 'fa.fooladvand',
  'ml.abdulhameed', 'ta.tamil', 'th.thai', 'sw.barwani', 'pt.elhayek', 'it.piccardo', 'nl.keyzer', 'pl.bielawskiego', 'sq.ahmeti',
  'az.mammadaliyev', 'bs.korkut', 'ha.gumi', 'ko.korean', 'ja.japanese']);

test('shared modules load with corrupt localStorage', () => {
  for (const [file, key, global] of [
    ['js/bookmarks.js', 'holibooks_bookmarks', 'bookmarkManager'],
    ['js/audio-player.js', 'holibooks_audio', 'audioPlayer'],
    ['js/language-selector.js', 'holibooks_languages', 'languageSelector'],
    ['js/search.js', 'holibooks_search_history', 'globalSearch'],
  ]) {
    for (const value of CORRUPT) {
      let env;
      assert.doesNotThrow(() => { env = open(file, { [key]: value }); }, `${file} with ${key}=${value}`);
      assert.ok(env.window[global], `${global} exists with ${key}=${value}`);
    }
  }
});

test('bookmarks: bad stored values become an empty list; good ones survive', () => {
  for (const value of CORRUPT) assert.equal(open('js/bookmarks.js', { holibooks_bookmarks: value }).window.bookmarkManager.bookmarks.length, 0, value);
  const good = JSON.stringify([{ id: '1', religion: 'islam', religionName: 'Islam', text: 't', reference: 'Quran 1:1' }, 'junk', null]);
  const manager = open('js/bookmarks.js', { holibooks_bookmarks: good }).window.bookmarkManager;
  assert.equal(manager.bookmarks.length, 1);
  assert.equal(manager.isBookmarked('islam', 'Quran 1:1'), true);
});

test('bookmarks: every stored field is escaped and no handler is built from stored text', () => {
  const hostile = JSON.stringify([{ id: `x');alert('1`, religion: 'islam', religionName: '<img src=x onerror=alert(1)>', text: '<b>t</b>', reference: '<script>r</script>' }]);
  const env = open('js/bookmarks.js', { holibooks_bookmarks: hostile });
  const html = env.el('bookmark-list').innerHTML;
  for (const raw of ['<img', '<b>t', '<script>', `alert('1`]) assert.ok(!html.includes(raw), raw);
  assert.ok(!/onclick=/.test(html), 'actions use delegated listeners, not inline onclick');
  assert.match(html, /data-action="remove"/);
});

test('bookmarks: delegated actions find the bookmark by id', () => {
  const env = open('js/bookmarks.js', { holibooks_bookmarks: JSON.stringify([{ id: 'a1', religion: 'islam', religionName: 'Islam', text: 't', reference: 'Quran 2:255' }]) });
  const manager = env.window.bookmarkManager;
  env.el('bookmark-list').dispatch('click', { target: { closest: () => ({ dataset: { action: 'remove', id: 'a1' } }) } });
  assert.equal(manager.bookmarks.length, 0);
  assert.equal(env.store.get('holibooks_bookmarks'), '[]');
});

test('bookmarks: a full or blocked localStorage does not break adding', () => {
  const env = open('js/bookmarks.js');
  env.window.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.doesNotThrow(() => env.window.bookmarkManager.addBookmark({ religion: 'islam', religionName: 'Islam', text: 't', reference: 'Quran 1:2' }));
  assert.equal(env.window.bookmarkManager.bookmarks.length, 1);
});

test('audio: chosen speed is saved, restored and re-applied to every track', () => {
  const env = open('js/audio-player.js');
  const player = env.window.audioPlayer;
  player.cycleSpeed(); // 1 -> 1.25
  assert.equal(JSON.parse(env.store.get('holibooks_audio')).playbackRate, 1.25);
  player.audio.playbackRate = 1; // what the browser does when src changes
  player.loadTrack({ url: 'https://cdn.test/1.mp3', title: 'Ayah 1' });
  assert.equal(player.audio.playbackRate, 1.25, 'speed survives a track change');
  const restored = open('js/audio-player.js', { holibooks_audio: '{"playbackRate":1.5}' }).window.audioPlayer;
  assert.equal(restored.playbackRate, 1.5);
  assert.equal(open('js/audio-player.js', { holibooks_audio: '{"playbackRate":99}' }).window.audioPlayer.playbackRate, 1, 'unknown speeds are ignored');
});

test('audio: repeated errors stop instead of cycling the playlist forever', async () => {
  const env = open('js/audio-player.js');
  const player = env.window.audioPlayer;
  const tracks = Array.from({ length: 5 }, (_, i) => ({ url: `https://cdn.test/${i}.mp3`, title: `Ayah ${i + 1}` }));
  let attempts = 0;
  player.audio.play = () => { attempts++; return Promise.reject(new Error('NotSupportedError')); }; // offline: nothing plays
  player.loadPlaylist(tracks, 0);
  for (let i = 0; i < 12; i++) { player.onError({}); await env.settle(); }
  assert.ok(attempts <= 3, `tried to play ${attempts} times across 12 consecutive errors`);
  assert.match(player.titleEl.textContent, /unavailable/i);
  assert.equal(env.pendingTimers().length, 0, 'no auto-advance timer is left running');
});

test('audio: closing the player cancels a pending auto-advance', async () => {
  const env = open('js/audio-player.js');
  const player = env.window.audioPlayer;
  player.loadPlaylist([{ url: 'a' }, { url: 'b' }], 0);
  player.onError({});
  player.hide();
  await env.settle();
  assert.equal(player.currentIndex, 0);
  assert.equal(player.playerEl.classList.contains('visible'), false, 'the player stays closed');
});

test('audio: the playlist stops at its last track instead of wrapping around', () => {
  const env = open('js/audio-player.js');
  const player = env.window.audioPlayer;
  player.loadPlaylist([{ url: 'a' }, { url: 'b' }], 1);
  player.onTrackEnd();
  assert.equal(player.currentIndex, 1, 'no wrap to the first track');
  player.playNext();
  assert.equal(player.currentIndex, 1);
  player.currentIndex = 0;
  player.playPrevious();
  assert.equal(player.currentIndex, 0);
});

test('audio: seeking before metadata has loaded does not throw', () => {
  const env = open('js/audio-player.js');
  const player = env.window.audioPlayer;
  player.show();
  assert.doesNotThrow(() => player.seek({ clientX: 50 }));
  assert.doesNotThrow(() => player.handleKeyboard({ code: 'ArrowRight', target: { tagName: 'BODY' }, preventDefault() {} }));
  assert.equal(Number.isNaN(player.audio.currentTime), false);
});

test('language selector: every Quran edition offered exists upstream', () => {
  const env = open('js/language-selector.js');
  const codes = [...env.window.languageSelector.getLanguageConfig().islam.languages].map(l => l.code);
  assert.deepEqual(codes.filter(c => !VERIFIED_QURAN_EDITIONS.has(c)), []);
  assert.ok(codes.includes('sw.barwani'));
});

test('language selector: stored selections must be a plain object', () => {
  for (const value of CORRUPT) {
    const selector = open('js/language-selector.js', { holibooks_languages: value }).window.languageSelector;
    assert.equal(selector.getLanguage('islam'), 'en.sahih', value);
  }
  const kept = open('js/language-selector.js', { holibooks_languages: '{"islam":"en.pickthall"}' }).window.languageSelector;
  assert.equal(kept.getLanguage('islam'), 'en.pickthall');
});

test('bookmarks: a search with no matches says so instead of "No bookmarks yet"', () => {
  const env = open('js/bookmarks.js', { holibooks_bookmarks: JSON.stringify([{ id: 'a1', religion: 'islam', religionName: 'Islam', text: 'FIXTURE TEXT', reference: 'Quran 2:255' }]) });
  env.window.bookmarkManager.filterBookmarks('zzz');
  const html = env.el('bookmark-list').innerHTML;
  assert.ok(!html.includes('FIXTURE TEXT'), 'the non-matching bookmark is hidden');
  assert.match(html, /No matching bookmarks/);
  assert.ok(!html.includes('No bookmarks yet'), 'the user has bookmarks');
});
