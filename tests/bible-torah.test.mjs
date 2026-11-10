import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, routeFetch, fixture, readRepoFile } from './helpers/browser-env.mjs';

// Version and book IDs verified against cdn.jsdelivr.net/gh/wldeh/bible-api on
// 2026-11-10. `npm run test:apis` re-checks them against the live CDN.
const VERIFIED_BIBLE_VERSIONS = ['en-kjv', 'en-web', 'en-asv'];
const VERIFIED_TORAH_VERSIONS = ['en-ojps', 'he-wlc', 'en-kjv'];
const kjvGenesis1 = fixture('wldeh-kjv-genesis-1.json'); // verses 1-3, each present twice upstream

async function openBible({ url = 'https://holibooks.test/religions/christianity/bible.html', storage = {}, fetch } = {}) {
  const env = createBrowser({ url, storage, fetch: fetch || routeFetch({ '/chapters/': kjvGenesis1 }) });
  env.load('js/utils.js', 'js/language-selector.js', 'religions/christianity/bible.js');
  await env.fire('DOMContentLoaded');
  await env.settle();
  return env;
}

async function openTorah({ url = 'https://holibooks.test/religions/judaism/torah.html', storage = {}, fetch } = {}) {
  const env = createBrowser({ url, storage, fetch: fetch || routeFetch({ '/chapters/': kjvGenesis1 }) });
  env.load('js/utils.js', 'religions/judaism/torah.js');
  await env.fire('DOMContentLoaded');
  await env.settle();
  return env;
}

test('Bible book IDs match the upstream dataset (no hyphens)', async () => {
  const env = await openBible();
  const ids = [...env.get('ALL_BOOKS')].map(b => b.id);
  assert.equal(ids.length, 66);
  assert.deepEqual(ids.filter(id => /[^a-z0-9]/.test(id)), [], 'upstream IDs are lowercase alphanumerics');
  for (const id of ['1samuel', '2kings', '1chronicles', 'songofsolomon', '1corinthians', '2thessalonians', '3john']) assert.ok(ids.includes(id), id);
});

test('Bible deep links accept both the upstream and the old hyphenated book ID', async () => {
  for (const book of ['1corinthians', '1-corinthians', '1-Corinthians']) {
    const env = await openBible({ url: `https://holibooks.test/religions/christianity/bible.html?book=${book}&chapter=13` });
    assert.ok(env.requests[0].endsWith('/en-kjv/books/1corinthians/chapters/13.json'), `${book} -> ${env.requests[0]}`);
  }
});

test('Bible offers only versions that exist upstream and recovers from a dead saved one', async () => {
  const env = await openBible({ storage: { bible_version: '"en-lsg"' } });
  assert.deepEqual([...env.get('VERSIONS')].map(v => v.code), VERIFIED_BIBLE_VERSIONS);
  assert.ok(env.requests[0].includes('/en-kjv/'), 'unknown saved version falls back to KJV');
  const offered = [...env.window.languageSelector.getLanguageConfig().christianity.languages].map(l => l.code);
  assert.deepEqual(offered, VERIFIED_BIBLE_VERSIONS, 'the picker lists exactly the working versions');
});

test('choosing a Bible version requests that exact ID and updates the label', async () => {
  const env = await openBible();
  let onSelect;
  env.window.languageSelector.open = (_religion, cb) => { onSelect = cb; };
  env.el('version-btn').click();
  onSelect('en-web');
  await env.settle();
  assert.ok(env.requests.at(-1).includes('/bibles/en-web/books/genesis/chapters/1.json'), env.requests.at(-1));
  assert.equal(env.el('current-version').textContent, 'WEB');
  assert.equal(env.store.get('bible_version'), '"en-web"');
});

test('Bible renders each verse once even though upstream repeats them', async () => {
  const env = await openBible();
  const html = env.el('verses-container').innerHTML;
  assert.equal((html.match(/class="bible-verse"/g) || []).length, 3);
  assert.equal(env.el('verses-count').textContent, '3 Verses');
});

test('Bible and Torah escape verse text from the API', async () => {
  const hostile = { data: [{ verse: '1', text: '<img src=x onerror="alert(1)">' }] };
  for (const open of [openBible, openTorah]) {
    const env = await open({ fetch: routeFetch({ '/chapters/': hostile }) });
    const html = env.el('verses-container').innerHTML;
    assert.ok(!html.includes('<img'), 'raw tag must not reach innerHTML');
    assert.ok(html.includes('&lt;img'));
  }
});

test('a saved chapter is not carried over to a different book from the URL', async () => {
  const env = await openBible({
    url: 'https://holibooks.test/religions/christianity/bible.html?book=ruth',
    storage: { bible_book: '"genesis"', bible_chapter: '50' },
  });
  assert.ok(env.requests[0].endsWith('/books/ruth/chapters/1.json'), env.requests[0]);
  const torah = await openTorah({
    url: 'https://holibooks.test/religions/judaism/torah.html?book=leviticus',
    storage: { torah_book: '"genesis"', torah_chapter: '45' },
  });
  assert.ok(torah.requests[0].endsWith('/books/leviticus/chapters/1.json'), torah.requests[0]);
});

test('corrupt saved Bible/Torah positions fall back to Genesis 1', async () => {
  const bible = await openBible({ storage: { bible_book: '"nope"', bible_chapter: '"abc"' } });
  assert.ok(bible.requests[0].endsWith('/books/genesis/chapters/1.json'));
  const torah = await openTorah({ storage: { torah_book: '"matthew"', torah_chapter: '999' } });
  assert.ok(torah.requests[0].endsWith('/books/genesis/chapters/1.json'));
});

test('Bible shows an honest error with a working Retry when the API is down', async () => {
  let down = true;
  const env = await openBible({ fetch: async (url) => { if (down) throw new TypeError('Failed to fetch'); return { ok: true, status: 200, json: async () => kjvGenesis1 }; } });
  const container = env.el('verses-container');
  const shown = container.rendered();
  assert.ok(!/CORS|local server|sample data/i.test(shown), `misleading message: ${shown}`);
  assert.match(shown, /Genesis 1/);
  const retry = container.find(c => c.tagName === 'BUTTON');
  assert.ok(retry, 'Retry button present');
  down = false;
  retry.click();
  await env.settle();
  assert.equal((container.innerHTML.match(/class="bible-verse"/g) || []).length, 3);
});

test('Torah offers JPS 1917 (default), Hebrew and KJV, all present upstream', async () => {
  const env = await openTorah();
  assert.deepEqual(Object.keys(env.get('LANGUAGES')), VERIFIED_TORAH_VERSIONS);
  assert.ok(env.requests[0].includes('/bibles/en-ojps/books/genesis/chapters/1.json'), env.requests[0]);
  const html = readRepoFile('religions/judaism/torah.html');
  const mobile = [...html.matchAll(/class="mobile-language-option[^"]*" data-lang="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(mobile, VERIFIED_TORAH_VERSIONS, 'torah.html mobile options match the script');
});

test('Torah migrates a saved language that no longer exists', async () => {
  const env = await openTorah({ storage: { torah_language: '"es-rvr1960"' } });
  assert.ok(env.requests[0].includes('/en-ojps/'));
});

test('Torah renders Hebrew right-to-left and de-duplicates verses', async () => {
  const hebrew = { data: [{ verse: '1', text: 'בְּרֵאשִׁית' }, { verse: '1', text: 'בְּרֵאשִׁית' }] };
  const env = await openTorah({ storage: { torah_language: '"he-wlc"' }, fetch: routeFetch({ '/chapters/': hebrew }) });
  const html = env.el('verses-container').innerHTML;
  assert.equal((html.match(/class="verse-card"/g) || []).length, 1);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /lang="he"/);
});

test('Torah Retry reloads the chapter instead of dumping function source', async () => {
  let down = true;
  const env = await openTorah({ fetch: async () => { if (down) throw new TypeError('Failed to fetch'); return { ok: true, status: 200, json: async () => kjvGenesis1 }; } });
  const container = env.el('verses-container');
  assert.ok(!container.rendered().includes('function'), 'no source code in the page');
  down = false;
  container.find(c => c.tagName === 'BUTTON').click();
  await env.settle();
  assert.equal((container.innerHTML.match(/class="verse-card"/g) || []).length, 3);
});

test('a slow earlier chapter cannot overwrite a newer one', async () => {
  const pending = [];
  const env = createBrowser({
    url: 'https://holibooks.test/religions/christianity/bible.html',
    fetch: (url) => new Promise(resolve => pending.push({ url, resolve })),
  });
  env.load('js/utils.js', 'js/language-selector.js', 'religions/christianity/bible.js');
  const ready = env.fire('DOMContentLoaded');
  await env.settle();
  const reply = (p, text) => p.resolve({ ok: true, status: 200, json: async () => ({ data: [{ verse: '1', text }] }) });
  reply(pending[0], 'chapter one');
  await ready; await env.settle();
  env.get('goToNextChapter')();   // chapter 2 (slow)
  env.get('goToNextChapter')();   // chapter 3 (fast)
  await env.settle();
  reply(pending[2], 'chapter three');
  await env.settle();
  reply(pending[1], 'chapter two arrives late');
  await env.settle();
  assert.match(env.el('verses-container').innerHTML, /chapter three/);
  assert.equal(env.el('chapter-title').textContent, 'Genesis 3');
});
