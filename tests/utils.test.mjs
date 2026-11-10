import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, routeFetch, httpStatus, FakeElement } from './helpers/browser-env.mjs';

const load = (options) => createBrowser(options).load('js/utils.js');

test('escapeHTML neutralises markup and tolerates non-strings', () => {
  const { escapeHTML } = load().window.HoliBooks;
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHTML("Tom & 'Jerry'"), 'Tom &amp; &#39;Jerry&#39;');
  assert.equal(escapeHTML(null), '');
  assert.equal(escapeHTML(undefined), '');
  assert.equal(escapeHTML(42), '42');
});

test('clampInt accepts in-range integers and falls back otherwise', () => {
  const { clampInt } = load().window.HoliBooks;
  assert.equal(clampInt('7', 1, 114, 1), 7);
  assert.equal(clampInt(114, 1, 114, 1), 114);
  for (const bad of ['abc', '999', 0, -3, null, undefined, {}, '1.5', NaN]) assert.equal(clampInt(bad, 1, 114, 1), 1, `value ${String(bad)}`);
});

test('dedupeVerses keeps the first copy of each verse number', () => {
  const { dedupeVerses } = load().window.HoliBooks;
  const out = dedupeVerses([{ verse: '1', text: 'a' }, { verse: '1', text: 'a' }, { verse: '2', text: 'b' }, { verse: 2, text: 'b' }]);
  assert.deepEqual(out.map(v => v.text), ['a', 'b']);
  assert.equal(dedupeVerses(null).length, 0);
  assert.equal(dedupeVerses([{ text: 'no number' }, { text: 'also none' }]).length, 2);
});

test('latestOnly marks only the newest request as current', () => {
  const guard = load().window.HoliBooks.latestOnly();
  const first = guard.next();
  const second = guard.next();
  assert.equal(guard.isCurrent(first), false);
  assert.equal(guard.isCurrent(second), true);
});

test('showError escapes the message and wires Retry to the callback itself', () => {
  const env = load();
  const container = new FakeElement('div');
  let retried = 0;
  const local = 'only visible through the closure';
  env.window.HoliBooks.showError(container, 'Failed <b>badly</b>', () => { retried += local.length > 0 ? 1 : 0; });
  assert.ok(!container.markup().includes('<b>badly</b>'), 'message must not be inserted as markup');
  assert.ok(container.rendered().includes('Failed <b>badly</b>'), 'message is shown as text');
  assert.ok(!container.rendered().includes('retried'), 'callback source must not be serialised into the page');
  assert.ok(!/onclick=/.test(container.markup()), 'no inline onclick handler');
  const button = container.find(c => c.tagName === 'BUTTON');
  assert.ok(button, 'a retry button is rendered');
  button.click();
  assert.equal(retried, 1);
  const noRetry = new FakeElement('div');
  env.window.HoliBooks.showError(noRetry, 'Nope');
  assert.equal(noRetry.find(c => c.tagName === 'BUTTON'), null);
});

test('utils.js loads when localStorage throws (blocked storage)', () => {
  const env = createBrowser();
  env.window.localStorage.getItem = () => { throw new Error('SecurityError'); };
  env.window.localStorage.setItem = () => { throw new Error('SecurityError'); };
  env.load('js/utils.js');
  const { theme, storage } = env.window.HoliBooks;
  assert.equal(theme.current, 'dark');
  assert.doesNotThrow(() => theme.toggle());
  assert.equal(storage.get('anything', 'fallback'), 'fallback');
});

test('storage.get returns the default for corrupt JSON', () => {
  const env = load({ storage: { broken: '{not json', fine: '{"a":1}' } });
  assert.equal(env.window.HoliBooks.storage.get('broken', 'd'), 'd');
  assert.deepEqual({ ...env.window.HoliBooks.storage.get('fine') }, { a: 1 });
});

test('fetchWithRetry does not retry a 404 but does retry a network failure', async () => {
  let calls = 0;
  const notFound = load({ fetch: async () => { calls++; return { ok: false, status: 404, json: async () => ({}) }; } });
  const p1 = notFound.window.HoliBooks.fetchWithRetry('https://api.test/x', {}, 3).catch(e => e);
  await notFound.settle();
  const err = await p1;
  assert.equal(err.status, 404);
  assert.equal(calls, 1, 'a 4xx must fail immediately');

  let attempts = 0;
  const flaky = load({ fetch: async () => { attempts++; if (attempts < 2) throw new TypeError('Failed to fetch'); return { ok: true, status: 200, json: async () => ({ ok: 1 }) }; } });
  const p2 = flaky.window.HoliBooks.fetchWithRetry('https://api.test/y', {}, 3);
  await flaky.settle();
  assert.deepEqual({ ...(await p2) }, { ok: 1 });
  assert.equal(attempts, 2);
});

test('fetchJSON always clears its timeout timer', async () => {
  const env = load({ fetch: routeFetch({ '/bad': httpStatus(500), '/good': { fine: true }, '/down': new TypeError('Failed to fetch') }) });
  await env.window.HoliBooks.fetchJSON('https://api.test/good');
  await env.window.HoliBooks.fetchJSON('https://api.test/bad').catch(() => {});
  await env.window.HoliBooks.fetchJSON('https://api.test/down').catch(() => {});
  assert.equal(env.pendingTimers().length, 0, 'abort timers must not outlive the request');
});
