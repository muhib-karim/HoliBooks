import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, routeFetch, fixture } from './helpers/browser-env.mjs';

// First three lines of Ang 1 in the shape api.gurbaninow.com/v2/ang/1 served on 2026-11-10.
// Gurmukhi and transliteration are real; translation strings are placeholders.
const ang1 = fixture('gurbani-ang-1.json');

async function openGurbani({ url = 'https://holibooks.test/religions/sikhism/gurbani.html', storage = {}, fetch } = {}) {
  const env = createBrowser({ url, storage, fetch: fetch || routeFetch({ '/v2/ang/': ang1 }) });
  env.load('js/utils.js', 'religions/sikhism/gurbani.js');
  await env.fire('DOMContentLoaded');
  await env.settle();
  return env;
}

test('Gurbani renders transliteration, translation and writer from the real response shape', async () => {
  const env = await openGurbani();
  const html = env.el('verses-container').innerHTML;
  assert.ok(!html.includes('[object Object]'), 'transliteration object must not be stringified');
  assert.equal((html.match(/class="shabad-card"/g) || []).length, 3);
  assert.match(html, /ik oankaar sat naam/);
  assert.match(html, /FIXTURE ENGLISH TRANSLATION 1/);
  assert.match(html, /ੴ ਸਤਿ ਨਾਮੁ/);
  assert.equal((html.match(/Guru Nanak Dev Ji/g) || []).length, 1, 'writer shown once per run of lines, not on every line');
});

test('Gurbani language modes show only the chosen fields', async () => {
  const env = await openGurbani({ storage: { gurbani_language: '"transliteration"' } });
  const html = env.el('verses-container').innerHTML;
  assert.match(html, /ik oankaar/);
  assert.ok(!html.includes('FIXTURE ENGLISH TRANSLATION'));
  assert.ok(!html.includes('ੴ'));
});

test('Gurbani escapes API text', async () => {
  const hostile = { page: [{ line: { gurmukhi: { unicode: '<script>alert(1)</script>' }, translation: { english: { default: '<img src=x onerror=alert(1)>' } }, transliteration: { english: { text: '<b>x</b>' } }, writer: { english: '<i>w</i>' } } }] };
  const env = await openGurbani({ fetch: routeFetch({ '/v2/ang/': hostile }) });
  const html = env.el('verses-container').innerHTML;
  for (const raw of ['<script>', '<img', '<b>x', '<i>w']) assert.ok(!html.includes(raw), raw);
});

test('Gurbani validates the saved and requested Ang', async () => {
  const bad = await openGurbani({ storage: { gurbani_ang: '"abc"' } });
  assert.ok(bad.requests[0].endsWith('/v2/ang/1'), bad.requests[0]);
  const high = await openGurbani({ storage: { gurbani_ang: '5000' } });
  assert.ok(high.requests[0].endsWith('/v2/ang/1'));
  const linked = await openGurbani({ url: 'https://holibooks.test/religions/sikhism/gurbani.html?page=6', storage: { gurbani_ang: '900' } });
  assert.ok(linked.requests[0].endsWith('/v2/ang/6'));
});

test('Gurbani shows an error with Retry when the API is down, never mislabelled sample pages', async () => {
  let down = true;
  const env = await openGurbani({
    url: 'https://holibooks.test/religions/sikhism/gurbani.html?page=2',
    fetch: async () => { if (down) throw new TypeError('Failed to fetch'); return { ok: true, status: 200, json: async () => ang1 }; },
  });
  const container = env.el('verses-container');
  const shown = container.rendered();
  assert.ok(!/Cached content|Content loading/i.test(shown), shown);
  assert.ok(!container.innerHTML.includes('shabad-card'), 'no bundled lines are shown as if they were Ang 2');
  assert.match(shown, /Ang 2/);
  assert.throws(() => env.get('FALLBACK_ANGS'), 'bundled fallback pages are gone');
  down = false;
  container.find(c => c.tagName === 'BUTTON').click();
  await env.settle();
  assert.match(container.innerHTML, /shabad-card/);
});
