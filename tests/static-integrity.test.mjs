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
const SCRIPTS = ['app.js', 'sw.js', 'js/utils.js', 'js/api-monitor.js', 'js/audio-player.js', 'js/bookmarks.js',
  'js/language-selector.js', 'js/search.js', ...READERS.map(r => `religions/${r}.js`)];
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

test('browser scripts are syntactically valid', () => {
  for (const file of SCRIPTS) {
    assert.doesNotThrow(() => new vm.Script(read(file), { filename: file }), `${file} failed to parse`);
  }
});
