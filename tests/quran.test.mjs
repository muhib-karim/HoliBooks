import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, fixture } from './helpers/browser-env.mjs';

// Recorded from api.alquran.cloud on 2026-11-10 (first two ayahs of each surah).
// The Arabic is real; the translated ayahs are placeholders.
const surah1 = fixture('alquran-surah-1.json');
const surah2 = fixture('alquran-surah-2.json');
const surah2en = fixture('alquran-surah-2-en.sahih.json');
const PAGE = 'https://holibooks.test/religions/islam/quran.html';
const SCRIPTS = ['js/utils.js', 'js/audio-player.js', 'js/language-selector.js', 'js/bookmarks.js', 'js/search.js', 'religions/islam/quran.js'];
const BISMILLAH = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const list = { data: Array.from({ length: 114 }, (_, i) => ({ number: i + 1, name: `سورة ${i + 1}`, englishName: `Surah-${i + 1}`, englishNameTranslation: 'x', numberOfAyahs: 7, revelationType: 'Meccan' })) };

/** Answers like AlQuran Cloud. `surah(n, edition)` may return a body, or throw. */
function quranApi(surah = (n, edition) => (n === 1 ? surah1 : edition ? surah2en : surah2)) {
  return async (url) => {
    const m = url.match(/\/v1\/surah(?:\/(\d+)(?:\/([\w.-]+))?)?$/);
    if (!m) return { ok: false, status: 404, json: async () => ({}) };
    if (!m[1]) return ok(list);
    return ok(await surah(Number(m[1]), m[2]));
  };
}

async function openQuran({ url = `${PAGE}?surah=2`, storage = {}, fetch = quranApi() } = {}) {
  const env = createBrowser({ url, storage, fetch });
  env.load(...SCRIPTS);
  await env.fire('DOMContentLoaded');
  await env.settle();
  return env;
}
const surahRequests = (env) => env.requests.filter(u => /\/surah\/\d+$/.test(u)).map(u => Number(u.split('/').pop()));

test('stripBismillah removes the prefix the API puts on ayah 1, except in surahs 1 and 9', async () => {
  const env = await openQuran();
  const strip = env.get('stripBismillah');
  const apiAyah = surah2.data.ayahs[0].text;
  assert.ok(apiAyah.trim().split(/\s+/).length > 4, 'fixture ayah carries the Bismillah prefix');
  const stripped = strip(apiAyah, 2);
  assert.equal(stripped.split(/\s+/).length, apiAyah.trim().split(/\s+/).length - 4);
  assert.equal(strip(surah1.data.ayahs[0].text, 1), surah1.data.ayahs[0].text, 'Al-Fatihah 1:1 is the Bismillah itself');
  assert.equal(strip(apiAyah, 9), apiAyah, 'At-Tawbah has no Bismillah to strip');
  assert.equal(strip('الٓمٓ', 2), 'الٓمٓ', 'text without the prefix is untouched');
});

test('the Bismillah appears once on a surah page', async () => {
  const env = await openQuran();
  const html = env.el('verses-container').innerHTML;
  assert.equal((html.match(/bismillah-banner/g) || []).length, 1);
  const firstAyah = html.split('class="arabic-text"')[1].split('</p>')[0].split('>')[1].trim();
  assert.equal(firstAyah.split(/\s+/).length, 1, `ayah 1 of Al-Baqarah is one word once the Bismillah prefix is gone: ${firstAyah}`);
  assert.match(html, /FIXTURE TRANSLATION OF AYAH 1/);
});

test('Quran escapes API text in verses and in the surah list', async () => {
  const hostile = (n, edition) => ({ data: { ...surah2.data, englishName: '<b>x</b>', ayahs: [{ number: 8, numberInSurah: 1, text: edition ? '<img src=x onerror=alert(1)>' : '<script>1</script>' }] } });
  const env = await openQuran({ fetch: async (url) => (/\/surah$/.test(url) ? ok({ data: [{ number: 1, name: '<i>n</i>', englishName: '<u>e</u>' }] }) : ok(hostile(2, /en\./.test(url)))) });
  const html = env.el('verses-container').innerHTML + env.el('surah-select').innerHTML;
  for (const raw of ['<img', '<script>', '<i>n', '<u>e']) assert.ok(!html.includes(raw), raw);
});

test('Quran validates the surah from the URL and from saved state', async () => {
  for (const [url, storage] of [[`${PAGE}?surah=999`, {}], [`${PAGE}?surah=abc`, {}], [PAGE, { quran_surah: '"zzz"' }], [PAGE, { quran_surah: '400' }]]) {
    const env = await openQuran({ url, storage });
    assert.deepEqual(surahRequests(env), [1], `${url} ${JSON.stringify(storage)}`);
  }
  const saved = await openQuran({ url: PAGE, storage: { quran_surah: '2' } });
  assert.deepEqual(surahRequests(saved), [2]);
});

test('when the API is down the reader shows an error for the requested surah, not Al-Fatihah', async () => {
  let down = true;
  const fetch = async (url) => { if (down) throw new TypeError('Failed to fetch'); return quranApi()(url); };
  const env = await openQuran({ url: `${PAGE}?surah=36`, fetch });
  const container = env.el('verses-container');
  const shown = container.rendered();
  assert.ok(!/In the name of Allah|sample data|Al-Fatihah/i.test(shown), shown);
  assert.match(shown, /Surah 36/);
  assert.equal((env.el('surah-select').innerHTML.match(/<option/g) || []).length, 114, 'navigation still lists every surah');
  down = false;
  container.find(c => c.tagName === 'BUTTON').click();
  await env.settle();
  assert.match(container.innerHTML, /verse-card/);
  assert.equal(surahRequests(env).at(-1), 36);
});

test('corrupt bookmark storage does not masquerade as an API failure', async () => {
  for (const value of ['null', '{}', '"x"', '{not json']) {
    const env = await openQuran({ storage: { holibooks_bookmarks: value } });
    assert.match(env.el('verses-container').innerHTML, /verse-card/, `holibooks_bookmarks=${value}`);
  }
});

test('Quran history: first load replaces, navigation pushes, Back reloads from the URL', async () => {
  const env = await openQuran({ url: `${PAGE}?surah=2&verse=1` });
  assert.deepEqual(env.history.map(h => h.kind), ['replace'], 'opening the page must not add a history entry');
  assert.match(env.location.search, /verse=1/);
  env.get('navigateSurah')(-1);
  await env.settle();
  assert.equal(env.history.at(-1).kind, 'push');
  assert.equal(env.location.search, '?surah=1', 'a stale verse parameter is dropped when the surah changes');
  env.location.href = `${PAGE}?surah=2`; // what the browser does on Back
  const pushes = env.history.length;
  await env.fireWindow('popstate');
  await env.settle();
  assert.equal(surahRequests(env).at(-1), 2);
  assert.equal(env.history.length, pushes, 'handling Back must not push another entry');
});

test('a slow earlier surah cannot overwrite a newer one', async () => {
  const waiting = [];
  const fetch = (url) => (/\/surah$/.test(url) ? Promise.resolve(ok(list)) : new Promise(resolve => waiting.push({ url, resolve })));
  const env = createBrowser({ url: `${PAGE}?surah=5`, fetch });
  env.load(...SCRIPTS);
  const ready = env.fire('DOMContentLoaded');
  await env.settle();
  const answer = (n, text) => waiting.filter(w => new RegExp(`/surah/${n}(/|$)`).test(w.url)).forEach(w => w.resolve(ok({ data: { ...surah2.data, number: n, englishName: `S${n}`, ayahs: [{ number: 1, numberInSurah: 1, text }] } })));
  answer(5, 'five'); await ready; await env.settle();
  env.get('loadSurah')(6); env.get('loadSurah')(7);
  await env.settle();
  answer(7, 'seven'); await env.settle();
  answer(6, 'six arrives late'); await env.settle();
  const html = env.el('verses-container').innerHTML;
  assert.match(html, /seven/);
  assert.ok(!html.includes('six arrives late'));
});

test('arrow keys do not change surah while the audio player is open', async () => {
  const env = await openQuran();
  const before = surahRequests(env).length;
  env.window.audioPlayer.playerEl.classList.add('visible');
  await env.fire('keydown', { key: 'ArrowRight', code: 'ArrowRight', target: { tagName: 'BODY' } });
  assert.equal(surahRequests(env).length, before);
  env.window.audioPlayer.playerEl.classList.remove('visible');
  await env.fire('keydown', { key: 'ArrowRight', code: 'ArrowRight', target: { tagName: 'BODY' } });
  assert.equal(surahRequests(env).at(-1), 3);
});

test('Quran ships no bundled translation', async () => {
  const env = await openQuran();
  assert.throws(() => env.get('getFallbackSurah'));
  assert.equal(env.get('typeof BISMILLAH_BANNER'), 'string');
  assert.equal(env.get('BISMILLAH_BANNER'), BISMILLAH);
});
