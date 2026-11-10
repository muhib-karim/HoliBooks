import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, readRepoFile } from './helpers/browser-env.mjs';

const PAGE = 'https://holibooks.test/religions/buddhism/tripitaka.html';
const DATA = 'religions/buddhism/dhammapada-data.js';

function loadData() {
  const env = createBrowser().load(DATA);
  return [...env.window.DHAMMAPADA_VERSES];
}

async function openReader({ url = PAGE, storage = {} } = {}) {
  const env = createBrowser({ url, storage });
  env.load('js/utils.js', DATA, 'religions/buddhism/tripitaka.js');
  await env.fire('DOMContentLoaded');
  await env.settle();
  return env;
}

test('Dhammapada data has all 423 verses, numbered in order', () => {
  const verses = loadData();
  assert.equal(verses.length, 423);
  verses.forEach((v, i) => assert.equal(v.num, i + 1));
});

test('every verse is a full verse with its own Pali and English', () => {
  const verses = loadData();
  for (const v of verses) {
    assert.ok(v.pali.split('\n').length >= 4, `verse ${v.num} has ${v.pali.split('\n').length} Pali lines`);
    assert.ok(v.english.trim().length > 0, `verse ${v.num} has no English`);
    assert.ok(!/vaggo/i.test(v.pali), `verse ${v.num} still carries a chapter colophon`);
  }
  // The bundle this replaces reused 60 Pali lines across 153 "verses".
  assert.equal(new Set(verses.map(v => v.pali)).size, 423, 'no two verses share the same Pali');
  assert.equal(new Set(verses.map(v => v.english)).size, 423, 'no two verses share the same English');
});

test('known verses open with the right Pali', () => {
  const verses = loadData();
  const opening = (n) => verses[n - 1].pali.split('\n')[0];
  assert.match(opening(1), /^Manopubbaṅgamā dhammā/);
  assert.match(opening(5), /^Na hi verena verāni/);
  assert.match(opening(6), /^Pare ca na vijānanti/, 'verse 6 is its own verse, not the tail of verse 5');
  assert.match(opening(100), /^Sahassamapi ce vācā/);
  assert.match(opening(216), /^Taṇhāya jāyatī soko/);
  assert.match(opening(423), /^Pubbenivāsaṁ yo vedi/);
  // Verses 3 and 4 share their first half and differ in the second.
  assert.equal(verses[2].pali.split('\n')[0], verses[3].pali.split('\n')[0]);
  assert.notEqual(verses[2].pali, verses[3].pali);
});

test('the data file states its source and licence', () => {
  const src = readRepoFile(DATA);
  assert.match(src, /SuttaCentral/);
  assert.match(src, /Bhikkhu Sujato/);
  assert.match(src, /CC0/);
  assert.match(src, /bilara-data\/tree\/[0-9a-f]{40}/, 'pinned to an upstream commit');
});

test('the reader shows every verse of a chapter and credits the source', async () => {
  const env = await openReader();
  const html = env.el('verses-container').innerHTML;
  const shown = [...html.matchAll(/id="verse-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(shown, Array.from({ length: 20 }, (_, i) => i + 1), 'chapter 1 is verses 1-20, including 11-20');
  assert.match(html, /Manopubbaṅgamā dhammā,<br>manoseṭṭhā manomayā;/);
  assert.match(html, /Bhikkhu Sujato/);
  assert.match(html, /CC0/);
});

test('?verse= opens the right chapter and marks that verse', async () => {
  const env = await openReader({ url: `${PAGE}?verse=100` });
  assert.equal(env.el('chapter-pali').textContent, 'Sahassa Vagga');
  assert.match(env.el('verses-container').innerHTML, /id="verse-100"/);
  assert.equal(env.el('verse-100').classList.contains('highlighted'), true);
});

test('the reader validates saved state and language mode', async () => {
  for (const saved of ['99', '"abc"', 'null', '{}']) {
    const env = await openReader({ storage: { dhammapada_chapter: saved, dhammapada_language: '"klingon"' } });
    assert.equal(env.el('chapter-pali').textContent, 'Yamaka Vagga', `saved=${saved}`);
    assert.equal(env.el('current-language').textContent, 'Pali + English');
  }
  const english = await openReader({ storage: { dhammapada_language: '"english"' } });
  const html = english.el('verses-container').innerHTML;
  assert.ok(!html.includes('gatha-pali'));
  assert.match(html, /gatha-translation/);
});

test('the reader says so when the data file is missing', async () => {
  const env = createBrowser({ url: PAGE });
  env.load('js/utils.js', 'religions/buddhism/tripitaka.js');
  await env.fire('DOMContentLoaded');
  await env.settle();
  const container = env.el('verses-container');
  assert.match(container.rendered(), /could not be loaded/i);
  assert.ok(!/Cached content/.test(container.rendered()));
});
