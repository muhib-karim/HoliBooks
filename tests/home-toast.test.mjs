import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createBrowser, readRepoFile } from './helpers/browser-env.mjs';

// The homepage keeps its toast code in an inline <script>, not in js/*.js.
// Run index.html's inline scripts the way the browser does, after the shared
// scripts, so the test exercises the real showToast the page ships.
function loadHomepage() {
  const html = readRepoFile('index.html');
  const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[0].slice(0, match[0].indexOf('>'))))
    .map(match => match[1]);

  const env = createBrowser().load('js/utils.js');
  for (const source of inlineScripts) vm.runInContext(source, env.window, { filename: 'index.html' });
  return env;
}

test('homepage showToast renders a hostile message as text, never as markup', () => {
  const env = loadHomepage();
  const hostile = '<img src=x onerror=alert(1)>';

  env.window.showToast(hostile, 'error');

  const container = env.el('toast-container');
  const markup = container.markup();
  assert.ok(markup.length > 0, 'showToast appends a toast to #toast-container');
  assert.ok(!markup.includes('<img'), `toast markup contains a live tag: ${markup}`);
  // Only real tags matter: the escaped text still spells "onerror=" but has no
  // '<' to open a tag with, so scan the tags the browser would actually parse.
  for (const tag of markup.match(/<[^>]*>/g) || []) {
    assert.ok(!/\son[a-z]+\s*=/i.test(tag), `toast tag carries an event handler: ${tag}`);
  }
  assert.ok(markup.includes(env.window.HoliBooks.escapeHTML(hostile)), 'the message is shown escaped');
});
