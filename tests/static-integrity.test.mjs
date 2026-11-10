import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// Offline checks that the static site is internally consistent: every local
// asset a page, the service worker or the PWA manifest points at must exist.
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const READERS = ['islam/quran', 'christianity/bible', 'hinduism/gita', 'judaism/torah', 'sikhism/gurbani', 'buddhism/tripitaka'];
const PAGES = ['index.html', 'offline.html', ...READERS.map(r => `religions/${r}.html`)];
const SCRIPTS = ['sw.js', 'js/utils.js', 'js/api-monitor.js', 'js/audio-player.js', 'js/bookmarks.js',
  'js/language-selector.js', 'js/search.js', 'religions/buddhism/dhammapada-data.js', ...READERS.map(r => `religions/${r}.js`)];
const isExternal = (u) => /^(https?:|mailto:|tel:|data:|javascript:|blob:|\/\/|\$\{)/.test(u);
const resolveLocal = (fromFile, ref) => {
  const clean = ref.split(/[?#]/)[0];
  return clean.startsWith('/') ? path.join(root, clean) : path.join(root, path.dirname(fromFile), clean);
};

test('each religion has a reader page, script and stylesheet', () => {
  for (const r of READERS) for (const ext of ['html', 'js', 'css']) {
    assert.ok(existsSync(path.join(root, `religions/${r}.${ext}`)), `missing religions/${r}.${ext}`);
  }
});

test('homepage links to all six readers', () => {
  const html = read('index.html');
  for (const r of READERS) assert.match(html, new RegExp(`religions/${r}\\.html`), `index.html does not link ${r}`);
});

test('local href/src references in HTML pages resolve to files', () => {
  const missing = [];
  for (const page of PAGES) {
    for (const [, ref] of read(page).matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
      if (ref.startsWith('#') || isExternal(ref)) continue;
      if (!existsSync(resolveLocal(page, ref))) missing.push(`${page} -> ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('service worker precache list only contains existing files', () => {
  const sw = read('sw.js');
  const paths = [...sw.matchAll(/^\s*'(\/[^']*)',?\s*$/gm)].map(m => m[1]);
  assert.ok(paths.length >= 10, `expected a precache list, found ${paths.length} entries`);
  const missing = paths.filter(p => p !== '/' && !existsSync(resolveLocal('sw.js', p)));
  assert.deepEqual(missing, []);
  assert.ok(paths.includes('/offline.html'), 'offline fallback page is not precached');
});

test('PWA manifest is valid JSON and its assets exist', () => {
  const manifest = JSON.parse(read('manifest.json'));
  for (const key of ['name', 'short_name', 'start_url', 'display']) assert.ok(manifest[key], `manifest.${key} missing`);
  const refs = [
    ...(manifest.icons || []).map(i => i.src),
    ...(manifest.screenshots || []).map(s => s.src),
    ...(manifest.shortcuts || []).flatMap(s => [s.url, ...(s.icons || []).map(i => i.src)]),
  ];
  const missing = refs.filter(ref => !existsSync(resolveLocal('manifest.json', ref)));
  assert.deepEqual(missing, []);
});

/** Width and height from a PNG file's IHDR chunk. */
function pngSize(rel) {
  const bytes = readFileSync(path.join(root, rel));
  assert.equal(bytes.toString('latin1', 1, 4), 'PNG', `${rel} is not a PNG`);
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

test('PWA manifest has installable icons whose declared sizes are true', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const pngIcons = manifest.icons.filter(i => i.type === 'image/png');
  for (const size of ['192x192', '512x512']) {
    assert.ok(pngIcons.some(i => i.sizes === size && (i.purpose || 'any').includes('any')), `a ${size} PNG icon is required to install the app`);
  }
  assert.ok(manifest.icons.some(i => (i.purpose || '').includes('maskable')), 'a maskable icon is declared');
  const images = [...pngIcons, ...manifest.screenshots, ...manifest.shortcuts.flatMap(s => s.icons || [])].filter(i => /\.png$/.test(i.src));
  for (const image of images) assert.equal(pngSize(image.src), image.sizes, `${image.src} is declared as ${image.sizes}`);
  assert.equal(manifest.share_target, undefined, 'no share target without a handler for shared content');
});

test('one version string is used everywhere', () => {
  const version = JSON.parse(read('package.json')).version;
  assert.equal(read('VERSION').trim(), version, 'VERSION file');
  assert.ok(JSON.parse(read('manifest.json')).name.includes(version), 'manifest name');
  const sw = read('sw.js');
  assert.ok(sw.includes(`holibooks-static-v${version}'`) && sw.includes(`holibooks-dynamic-v${version}'`), 'service worker cache names');
  const stale = [];
  for (const file of [...PAGES, 'sw.js']) {
    for (const [, v] of read(file).matchAll(/\?v=([0-9][0-9.]*)/g)) if (v !== version) stale.push(`${file}: ?v=${v}`);
  }
  assert.deepEqual(stale, [], 'cache-busting query strings');
});

test('browser scripts are syntactically valid', () => {
  for (const file of SCRIPTS) {
    assert.doesNotThrow(() => new vm.Script(read(file), { filename: file }), `${file} failed to parse`);
  }
});
