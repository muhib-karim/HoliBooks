import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, fixture, readRepoFile } from './helpers/browser-env.mjs';

// One verse in the shape vedicscriptures.github.io/slok/12/1/ served on 2026-11-10:
// the Sanskrit and transliteration are real, the translation is a placeholder.
// Other verses, and every translator's text, are synthesised per request.
const recorded = fixture('gita-slok-12-1.json');
const PAGE = 'https://holibooks.test/religions/hinduism/gita.html';

/** Answers /slok/{chapter}/{verse}/ like the real API; `tweak` can alter or fail a verse. */
function gitaApi(tweak = (v) => v) {
  const stats = { inFlight: 0, maxInFlight: 0 };
  const fetch = async (url) => {
    const m = url.match(/\/slok\/(\d+)\/(\d+)\/$/);
    if (!m) return { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token < in JSON'); } }; // the HTML page the old URL got
    stats.inFlight++; stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);
    await new Promise(resolve => setImmediate(resolve));
    stats.inFlight--;
    const chapter = Number(m[1]), verse = Number(m[2]);
    const body = tweak({
      ...recorded, _id: `BG${chapter}.${verse}`, chapter, verse,
      purohit: { author: 'Shri Purohit Swami', et: `${chapter}.${verse} English of verse ${verse}` },
      tej: { author: 'Swami Tejomayananda', ht: `।।${chapter}.${verse}।। हिन्दी ${verse}` },
    });
    if (body instanceof Error) throw body;
    return { ok: true, status: 200, json: async () => body };
  };
  return { fetch, stats };
}

async function openGita({ url = `${PAGE}?chapter=12`, storage = {}, api = gitaApi() } = {}) {
  const env = createBrowser({ url, storage, fetch: api.fetch });
  env.load('js/utils.js', 'religions/hinduism/gita.js');
  await env.fire('DOMContentLoaded');
  await env.settle();
  return { env, api };
}

test('Gita loads a chapter from the per-verse endpoint, a few requests at a time', async () => {
  const { env, api } = await openGita();
  const expected = Array.from({ length: 20 }, (_, i) => `https://vedicscriptures.github.io/slok/12/${i + 1}/`);
  assert.deepEqual([...env.requests].sort(), [...expected].sort());
  assert.ok(api.stats.maxInFlight <= 6, `max in flight was ${api.stats.maxInFlight}`);
});

test('Gita numbers verses from the API and shows the named English translator', async () => {
  const { env } = await openGita();
  const html = env.el('verses-container').innerHTML;
  const numbers = [...html.matchAll(/Shloka (\d+)</g)].map(m => Number(m[1]));
  assert.deepEqual(numbers, Array.from({ length: 20 }, (_, i) => i + 1));
  assert.match(html, />English of verse 7</, 'verse label prefix "12.7 " is stripped');
  assert.ok(!html.includes('12.7 English'));
  assert.match(html, /Shri Purohit Swami/);
  assert.match(html, /अर्जुन उवाच/);
  assert.ok(!/Coming soon|cached content/i.test(html));
});

test('Gita Hindi mode shows the Hindi translation without its numbering prefix', async () => {
  const { env } = await openGita({ storage: { gita_language: '"hindi"' } });
  const html = env.el('verses-container').innerHTML;
  assert.match(html, />हिन्दी 3</);
  assert.ok(!html.includes('।।12.3।।'));
  assert.match(html, /Swami Tejomayananda/);
});

test('Gita falls back to the next translator, by name, when a verse has no default translation', async () => {
  const api = gitaApi(v => (v.verse === 5 ? { ...v, purohit: { author: 'Shri Purohit Swami', et: '' }, siva: { author: 'Swami Sivananda', et: '12.5 Sivananda wording' } } : v));
  const { env } = await openGita({ api });
  const html = env.el('verses-container').innerHTML;
  assert.match(html, /Sivananda wording/);
  assert.match(html, /Swami Sivananda/);
});

test('Gita does not show the API\'s "did not comment on this sloka" placeholder as a translation', async () => {
  // Real upstream behaviour, e.g. verses 12.3 and 12.18: the translator merged two verses.
  const api = gitaApi(v => (v.verse === 3 ? { ...v, purohit: { author: 'Shri Purohit Swami', et: 'Shri Purohit Swami did not comment on this sloka' }, siva: { author: 'Swami Sivananda', et: '12.3 FIXTURE TEXT' } } : v));
  const { env } = await openGita({ api });
  const html = env.el('verses-container').innerHTML;
  assert.ok(!/did not comment/i.test(html), 'the placeholder sentence is not scripture');
  assert.match(html, /FIXTURE TEXT <span class="shloka-translator"[^>]*>— Swami Sivananda<\/span>/, 'the verse names the translator it fell back to');
  assert.ok(!/did not comment/i.test(env.store.get('gita_chapter_v3_12')), 'and it is not cached either');
});

test('Gita caches only the fields it shows and reuses them without the network', async () => {
  const { env } = await openGita();
  const cached = JSON.parse(env.store.get('gita_chapter_v3_12'));
  assert.equal(cached.length, 20);
  assert.deepEqual(Object.keys(cached[0]).sort(), ['english', 'englishBy', 'hindi', 'hindiBy', 'slok', 'transliteration', 'verse']);
  const again = await openGita({ storage: Object.fromEntries(env.store) });
  assert.equal(again.env.requests.length, 0, 'second visit is served from the chapter cache');
  assert.match(again.env.el('verses-container').innerHTML, /English of verse 20/);
});

test('Gita shows an error with Retry when a verse fails, and caches nothing partial', async () => {
  let down = true;
  const api = gitaApi(v => (down && v.verse === 9 ? new TypeError('Failed to fetch') : v));
  const { env } = await openGita({ api });
  const container = env.el('verses-container');
  assert.match(container.rendered(), /Could not load chapter 12/);
  assert.ok(!container.innerHTML.includes('shloka-card'), 'no partial or placeholder verses');
  assert.equal(env.store.get('gita_chapter_v3_12'), undefined);
  down = false;
  container.find(c => c.tagName === 'BUTTON').click();
  await env.settle();
  assert.equal((container.innerHTML.match(/class="shloka-card"/g) || []).length, 20);
});

test('Gita survives corrupt saved state', async () => {
  for (const saved of ['99', '"abc"', '{}', 'null']) {
    const { env } = await openGita({ url: PAGE, storage: { gita_chapter: saved, gita_language: '"klingon"' } });
    assert.ok(env.requests.every(u => u.includes('/slok/1/')), `saved=${saved} -> ${env.requests[0]}`);
    assert.equal(env.requests.length, 47);
    assert.equal(env.el('current-language').textContent, 'Sanskrit + English');
  }
});

test('Gita escapes API text', async () => {
  const api = gitaApi(v => ({ ...v, slok: '<script>x</script>', transliteration: '<b>t</b>', purohit: { et: '<img src=x onerror=alert(1)>' } }));
  const { env } = await openGita({ api });
  const html = env.el('verses-container').innerHTML;
  for (const raw of ['<script>', '<b>t', '<img']) assert.ok(!html.includes(raw), raw);
});

test('the Gita fixture keeps the response shape but no translation text', () => {
  assert.deepEqual(Object.keys(recorded).sort(), ['_id', 'chapter', 'purohit', 'slok', 'transliteration', 'verse']);
  assert.deepEqual(Object.keys(recorded.purohit).sort(), ['author', 'et']);
  assert.equal(recorded.purohit.et, '12.1 FIXTURE ENGLISH TRANSLATION', 'numbering prefix kept, wording synthetic');
  assert.match(recorded.slok, /अर्जुन उवाच/);
});

test('Gita ships no bundled verses', () => {
  const src = readRepoFile('religions/hinduism/gita.js');
  assert.ok(!src.includes('spiit'), 'the invented "spiit" field is gone');
  assert.ok(!src.includes('getFallbackVerses'));
  assert.ok(src.length < 30000, `gita.js is ${src.length} bytes`);
});

test('Gita refetches a cached chapter whose verses lack the translation fields', async () => {
  // Storage is untrusted: an entry with the right length but missing fields must not be served.
  const stale = Array.from({ length: 20 }, (_, i) => ({ verse: i + 1, slok: 'FIXTURE SLOK', transliteration: '' }));
  const { env } = await openGita({ storage: { gita_chapter_v3_12: JSON.stringify(stale) } });
  assert.equal(env.requests.length, 20, 'an incomplete cache entry must not be served');
  assert.match(env.el('verses-container').innerHTML, /English of verse 20/);
  const cached = JSON.parse(env.store.get('gita_chapter_v3_12'));
  assert.equal(typeof cached[0].english, 'string', 'the cache is rewritten in full');
});
