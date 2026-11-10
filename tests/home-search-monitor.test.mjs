import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createBrowser, readRepoFile, root } from './helpers/browser-env.mjs';

const QURAN_PAGE = 'https://holibooks.test/religions/islam/quran.html';
const openSearch = (storage = {}) => createBrowser({ url: QURAN_PAGE, storage }).load('js/utils.js', 'js/search.js');

// Wording that used to be hardcoded from copyrighted translations
// (Saheeh International, NIV, Prabhupada, Buddharakkhita).
const REMOVED_WORDING = ['Entirely Merciful', 'bestowed favor', 'one and only Son', 'Love is patient, love is kind',
  'neither birth nor death at any time', 'Let none find fault with others', 'Better than a thousand useless words'];

// ---------- search ----------

test('search results link to pages that exist, from any page depth', () => {
  const env = openSearch();
  const search = env.window.globalSearch;
  for (const query of ['a', 'e', 'the']) {
    for (const result of search.getSampleResults(query)) {
      assert.ok(result.url.startsWith('/'), `${result.reference}: ${result.url} must be root-relative`);
      const file = path.join(root, result.url.split('?')[0]);
      assert.ok(existsSync(file), `${result.url} does not resolve to a file`);
      assert.match(result.url, /\?/, `${result.reference} deep-links into the text`);
    }
  }
  const [first] = search.getSampleResults('the');
  search.navigateToResult(first);
  assert.equal(env.location.pathname + env.location.search, first.url);
});

test('typing does not fill the search history; choosing a result does', () => {
  const env = openSearch();
  const search = env.window.globalSearch;
  for (const partial of ['l', 'lo', 'lov', 'love']) search.handleInput(partial);
  assert.equal(search.searchHistory.length, 0, `history after typing: ${JSON.stringify([...search.searchHistory])}`);
  search.navigateToResult(search.getSampleResults('love')[0], 'love');
  assert.deepEqual([...search.searchHistory], ['love']);
});

test('search history must be a list of strings', () => {
  for (const value of ['{}', '"x"', '[1,{"a":2},"peace"]', 'null', '{bad']) {
    const search = openSearch({ holibooks_search_history: value }).window.globalSearch;
    assert.ok(Array.isArray([...search.searchHistory]));
    assert.ok([...search.searchHistory].every(q => typeof q === 'string'), value);
    assert.doesNotThrow(() => search.open());
  }
  assert.deepEqual([...openSearch({ holibooks_search_history: '[1,{"a":2},"peace"]' }).window.globalSearch.searchHistory], ['peace']);
});

test('search results name their edition and escape what they render', () => {
  const env = openSearch();
  const search = env.window.globalSearch;
  for (const result of search.getSampleResults('e')) assert.ok(result.edition, `${result.reference} names its translation`);
  search.handleInput('<img src=x onerror=alert(1)>');
  assert.ok(!env.el('search-results-list').innerHTML.includes('<img'));
  assert.ok(!/onclick=/.test(env.el('search-results-list').innerHTML));
});

test('no copyrighted sample wording is left in search.js or index.html', () => {
  for (const file of ['js/search.js', 'index.html']) {
    const src = readRepoFile(file);
    for (const phrase of REMOVED_WORDING) assert.ok(!src.includes(phrase), `${file} still contains "${phrase}"`);
  }
});

// ---------- homepage ----------

test('homepage quotes cite the right verse and source', () => {
  const html = readRepoFile('index.html');
  const verses = [...createBrowser().load('religions/buddhism/dhammapada-data.js').window.DHAMMAPADA_VERSES];
  const verse100 = verses[99].english.replace(/\n/g, ' ');
  assert.ok(html.includes(verse100), 'the Dhammapada quote is verse 100 as bundled');
  assert.match(html, /Dhammapada, verse 100/);
  assert.match(html, /tripitaka\.html\?verse=100/);
  assert.ok(!/Dhammapada, Verse 8\b/.test(html));
  assert.ok(!html.includes('Recognize the whole human race'), 'the Dasam Granth line is no longer attributed to the Guru Granth Sahib');
  assert.match(html, /bible\.html\?book=1corinthians&chapter=13/);
  // Gita 2:20 is quoted from Edwin Arnold (1885) on the homepage and in the search sample.
  const search = readRepoFile('js/search.js');
  for (const [file, src] of [['index.html', html], ['js/search.js', search]]) {
    assert.match(src, /Never the spirit was born; the spirit shall cease to be never;/, file);
    assert.match(src, /Sir Edwin Arnold, The Song Celestial/, file);
    assert.ok(!src.includes('Purohit'), `${file} no longer quotes Purohit Swami`);
  }
  // The Japji Sahib line is this project's own rendering and says so.
  assert.match(html, /Guru Granth Sahib, Ang 1 \(Japji Sahib; tr\. HoliBooks\)/);
});

test('homepage links opened in a new tab do not expose window.opener', () => {
  const html = readRepoFile('index.html');
  const blank = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map(m => m[0]);
  assert.ok(blank.length >= 3);
  for (const tag of blank) assert.match(tag, /rel="[^"]*noopener/, tag);
});

// ---------- API monitor ----------

const readerBase = (file) => readRepoFile(file).match(/const API_BASE = '([^']+)'/)[1];
const READER_BASES = {
  quran: readerBase('religions/islam/quran.js'),
  bible: readerBase('religions/christianity/bible.js'),
  gita: readerBase('religions/hinduism/gita.js'),
  gurbani: readerBase('religions/sikhism/gurbani.js'),
};

async function openMonitor(fetch) {
  const calls = [];
  const env = createBrowser({ fetch: async (url, init) => { calls.push({ url, init }); return fetch(url); } });
  env.load('js/utils.js', 'js/api-monitor.js');
  await env.settle();
  return { env, calls, monitor: env.window.apiMonitor };
}

test('API monitor probes the endpoints the readers use', async () => {
  const { monitor } = await openMonitor(async () => ({ ok: true, status: 200 }));
  for (const [key, base] of Object.entries(READER_BASES)) {
    assert.ok(monitor.apis[key].url.startsWith(base + '/'), `${key}: ${monitor.apis[key].url} is not under ${base}`);
  }
});

test('API monitor reports an API that answers 404 as down', async () => {
  const { env, monitor, calls } = await openMonitor(async (url) => (url.includes('gurbaninow') ? { ok: false, status: 404 } : { ok: true, status: 200 }));
  assert.equal(monitor.apis.gurbani.status, 'offline');
  assert.equal(monitor.apis.quran.status, 'online');
  assert.notEqual(monitor.getOverallStatus(), 'online');
  assert.notEqual(env.el('api-status-text').textContent, 'All systems operational');
  assert.ok(calls.every(c => c.init?.mode !== 'no-cors'), 'an opaque no-cors response cannot show the status');
});

test('API monitor says all clear only when every API answered OK', async () => {
  const { env, monitor } = await openMonitor(async () => ({ ok: true, status: 200 }));
  assert.equal(monitor.getOverallStatus(), 'online');
  assert.equal(env.el('api-status-text').textContent, 'All systems operational');
});

test('API monitor checks once per load and does not poll or retry in a loop', async () => {
  const { env, calls } = await openMonitor(async () => { throw new TypeError('Failed to fetch'); });
  assert.equal(calls.length, 4, 'one request per API');
  assert.equal(env.intervals.length, 0, 'no setInterval polling of third-party APIs');
  assert.equal(env.window.HoliBooks.apiMonitor, env.window.apiMonitor, 'HoliBooks.apiMonitor is the live instance');
});
