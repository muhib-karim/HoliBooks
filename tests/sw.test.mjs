import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { readRepoFile, root } from './helpers/browser-env.mjs';

// Runs the real sw.js against a fake CacheStorage and a controllable network.
const ORIGIN = 'https://holibooks.test';

class FakeCache {
  constructor(net) { this.entries = new Map(); this.net = net; }
  async addAll(urls) {
    const fetched = await Promise.all(urls.map(async (u) => {
      const abs = new URL(u, ORIGIN).href;
      const response = await this.net(new Request(abs));
      if (!response.ok) throw new TypeError(`Request failed: ${abs}`);
      return [abs, response];
    }));
    fetched.forEach(([abs, response]) => this.entries.set(abs, response));
  }
  async put(request, response) { this.entries.set(typeof request === 'string' ? new URL(request, ORIGIN).href : request.url, response); }
  async match(request, options = {}) {
    const url = typeof request === 'string' ? new URL(request, ORIGIN).href : request.url;
    if (this.entries.has(url)) return this.entries.get(url).clone();
    if (options.ignoreSearch) {
      for (const [key, value] of this.entries) if (key.split('?')[0] === url.split('?')[0]) return value.clone();
    }
    return undefined;
  }
}

function createWorker({ failing = [] } = {}) {
  const state = { online: true, network: [], skipWaiting: 0, claimed: 0, navigated: 0 };
  // The network serves the repo's own files; anything else is a 404.
  const net = async (request) => {
    const url = new URL(request.url);
    state.network.push(url.href);
    if (!state.online) throw new TypeError('Failed to fetch');
    if (failing.some(f => url.href.includes(f))) return new Response('boom', { status: 500 });
    if (url.origin !== ORIGIN) return new Response(`remote:${url.pathname}`, { status: 200 });
    const file = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
    return existsSync(file) ? new Response(`network:${url.pathname}`, { status: 200 }) : new Response('missing', { status: 404 });
  };
  const stores = new Map();
  const caches = {
    open: async (name) => stores.get(name) || stores.set(name, new FakeCache(net)).get(name),
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (request, options) => { for (const cache of stores.values()) { const hit = await cache.match(request, options); if (hit) return hit; } return undefined; },
  };
  const handlers = {};
  const client = { url: `${ORIGIN}/`, navigate: async () => { state.navigated++; } };
  const self = {
    addEventListener: (type, fn) => { handlers[type] = fn; },
    skipWaiting: async () => { state.skipWaiting++; },
    clients: { matchAll: async () => [client], claim: async () => { state.claimed++; }, openWindow: async () => {} },
    registration: { showNotification: async () => {} },
    location: new URL(ORIGIN),
  };
  const context = { self, caches, clients: self.clients, fetch: net, URL, Request, Response, console: { log() {}, error() {}, warn() {} } };
  vm.createContext(context);
  vm.runInContext(readRepoFile('sw.js'), context, { filename: 'sw.js' });

  const lifecycle = async (type) => { let pending; handlers[type]({ waitUntil: (p) => { pending = p; } }); return pending; };
  return {
    state, stores, caches,
    precache: [...vm.runInContext('PRECACHE_URLS', context)],
    install: () => lifecycle('install'),
    activate: () => lifecycle('activate'),
    /** Send a fetch event; resolves to { intercepted, text, type, status }. */
    async request(target, { mode = 'no-cors', method = 'GET' } = {}) {
      const request = new Request(new URL(target, ORIGIN).href, { method });
      Object.defineProperty(request, 'mode', { value: mode });
      let answer;
      handlers.fetch({ request, respondWith: (p) => { answer = p; }, waitUntil() {} });
      if (answer === undefined) return { intercepted: false };
      const response = await answer;
      assert.ok(response instanceof Response, `respondWith() resolved ${String(response)} for ${target}`);
      return { intercepted: true, type: response.type, status: response.status, text: response.type === 'error' ? '' : await response.text() };
    },
  };
}

const HTML_PAGES = ['index.html', 'offline.html', ...readdirSync(path.join(root, 'religions')).flatMap(dir =>
  readdirSync(path.join(root, 'religions', dir)).filter(f => f.endsWith('.html')).map(f => `religions/${dir}/${f}`))];

/** Same-origin CSS/JS/JSON URLs the pages request, as absolute paths with their query strings. */
function assetsRequestedByPages() {
  const wanted = new Set();
  for (const page of HTML_PAGES) {
    for (const [, ref] of readRepoFile(page).matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
      if (/^(https?:|mailto:|data:|#|\/\/)/.test(ref) || !/\.(css|js|json)(\?|$)/.test(ref)) continue;
      wanted.add(ref.startsWith('/') ? ref : '/' + path.posix.normalize(path.posix.join(path.posix.dirname(page), ref)));
    }
  }
  return [...wanted].sort();
}

test('every asset a page requests is precached under exactly that URL', () => {
  const { precache } = createWorker();
  const missing = assetsRequestedByPages().filter(url => !precache.includes(url));
  assert.deepEqual(missing, [], 'pages ask for versioned URLs; a bare path in the precache never matches');
  for (const page of HTML_PAGES) assert.ok(precache.includes('/' + page), `/${page} is precached`);
  assert.ok(precache.includes('/'));
});

test('every precached path exists and nothing dead is precached', () => {
  const { precache } = createWorker();
  const absent = precache.filter(u => u !== '/' && !existsSync(path.join(root, u.split('?')[0])));
  assert.deepEqual(absent, []);
  assert.equal(new Set(precache).size, precache.length, 'no duplicates');
  for (const legacy of ['/app.js', '/style.css']) assert.ok(!precache.includes(legacy), `${legacy} is not used by any page`);
});

test('after one visit the app shell works offline', async () => {
  const worker = createWorker();
  await worker.install();
  await worker.activate();
  worker.state.online = false;

  const home = await worker.request('/', { mode: 'navigate' });
  assert.equal(home.text, 'network:/', 'the precached home page is served for /');
  const deepLink = await worker.request('/religions/islam/quran.html?surah=2', { mode: 'navigate' });
  assert.equal(deepLink.text, 'network:/religions/islam/quran.html', 'a query string must not hide the precached page');
  for (const asset of assetsRequestedByPages()) {
    const hit = await worker.request(asset);
    assert.equal(hit.text, `network:${asset.split('?')[0]}`, `${asset} is available offline`);
  }
  const unknownPage = await worker.request('/no-such-page', { mode: 'navigate' });
  assert.equal(unknownPage.text, 'network:/offline.html', 'unknown pages fall back to offline.html');
  const unknownAsset = await worker.request('/css/not-cached.css');
  assert.equal(unknownAsset.type, 'error', 'a miss is a network error, never an undefined response');
});

test('install fails when the precache cannot be completed', async () => {
  const worker = createWorker({ failing: ['/css/global.css'] });
  await assert.rejects(worker.install());
  assert.equal(worker.state.skipWaiting, 0, 'a half-cached worker must not take over');
});

test('online navigations come from the network, so new deployments are seen', async () => {
  const worker = createWorker();
  await worker.install();
  worker.state.network.length = 0;
  const page = await worker.request('/religions/hinduism/gita.html?chapter=2', { mode: 'navigate' });
  assert.equal(page.text, 'network:/religions/hinduism/gita.html');
  assert.deepEqual(worker.state.network, [`${ORIGIN}/religions/hinduism/gita.html?chapter=2`]);
});

test('API responses are network-first with a cache fallback', async () => {
  const worker = createWorker();
  await worker.install();
  const url = 'https://api.alquran.cloud/v1/surah/1';
  assert.equal((await worker.request(url, { mode: 'cors' })).text, 'remote:/v1/surah/1');
  worker.state.online = false;
  assert.equal((await worker.request(url, { mode: 'cors' })).text, 'remote:/v1/surah/1', 'served from cache when offline');
  assert.equal((await worker.request('https://api.alquran.cloud/v1/surah/2', { mode: 'cors' })).type, 'error');
});

test('requests the worker should not handle pass straight through', async () => {
  const worker = createWorker();
  await worker.install();
  for (const [target, options] of [
    ['https://fonts.googleapis.com/css2?family=Inter', {}],
    ['https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3', {}],
    ['https://vedicscriptures.github.io/slok/1/1/', { mode: 'cors' }], // the Gita reader keeps its own compact cache
    ['/index.html', { method: 'POST' }],
  ]) assert.equal((await worker.request(target, options)).intercepted, false, target);
});

test('activation clears old caches and does not force-reload open tabs', async () => {
  const worker = createWorker();
  await (await worker.caches.open('holibooks-static-v2-0-0')).put('/old', new Response('old'));
  await worker.install();
  await worker.activate();
  const names = await worker.caches.keys();
  assert.ok(!names.includes('holibooks-static-v2-0-0'), `old cache still present: ${names}`);
  assert.equal(worker.state.claimed, 1);
  assert.equal(worker.state.navigated, 0, 'client.navigate() would discard reading position and stop audio');
});
