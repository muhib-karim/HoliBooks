import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, FakeElement } from './helpers/browser-env.mjs';

// F2: the recent-searches list used to build an inline onclick handler string
// (`onclick="globalSearch.removeFromHistory(0); ..."`). Markup must never carry
// behaviour: activation has to come from listeners/delegation, which also keeps
// working if the global is renamed and needs no eval of page-supplied strings.
//
// The shared fake DOM does not parse innerHTML into child elements, so the
// tests below derive the elements from the rendered markup. Only the structural
// bits the code under test touches are reproduced (tag, class, data-index); the
// listeners are then attached by the real search.js code, unmodified.

const HISTORY_KEY = 'holibooks_search_history';
const QUERIES = ['love', 'peace', 'mercy'];

/** Turn the tags in a rendered markup string into FakeElements. */
function elementsFromMarkup(html) {
  return (html.match(/<[a-z][^>]*>/gi) || []).map((tag) => {
    const el = new FakeElement(tag.match(/^<\s*([a-z0-9-]+)/i)[1]);
    const className = tag.match(/\bclass="([^"]*)"/);
    if (className) el.className = className[1];
    const index = tag.match(/\bdata-index="(\d+)"/);
    if (index) el.dataset.index = index[1];
    return el;
  });
}

/**
 * Make `container.querySelectorAll` answer from its current innerHTML, the way
 * a browser would after assigning it. Returns the element list for `selector`.
 */
function parseInto(container) {
  let cache = { html: null, elements: [] };
  container.querySelectorAll = (selector) => {
    if (cache.html !== container.innerHTML) {
      cache = { html: container.innerHTML, elements: elementsFromMarkup(container.innerHTML) };
    }
    const wanted = selector.trim().replace(/^\./, '');
    return cache.elements.filter(el => el.classList.contains(wanted));
  };
  return () => container.querySelectorAll('.search-recent-item');
}

function openRecentSearches(queries = QUERIES) {
  const env = createBrowser({ storage: { [HISTORY_KEY]: JSON.stringify(queries) } })
    .load('js/utils.js', 'js/search.js');
  const search = env.window.globalSearch;
  const list = env.el('search-recent-list');
  const items = parseInto(list);
  search.open();
  return { env, search, list, items };
}

test('recent searches render no inline event-handler attributes', () => {
  const { list, items } = openRecentSearches();
  const markup = list.innerHTML;

  assert.ok(items().length === QUERIES.length, 'every recent search is rendered');
  assert.match(markup, /class="search-recent-remove"/, 'the remove control is rendered');

  // No on* attribute anywhere in the rendered recent-search markup.
  for (const tag of markup.match(/<[^>]*>/g) || []) {
    assert.ok(!/\son[a-z]+\s*=/i.test(tag), `inline handler attribute in ${tag.trim()}`);
  }
  assert.ok(!/\sonclick\s*=/i.test(markup), 'no inline onclick in the recent list');
  assert.ok(!/globalSearch\.removeFromHistory\(/.test(markup), 'no global call serialised into markup');
  assert.ok(!/javascript:/i.test(markup), 'no javascript: URL in the recent list');
});

test('clicking a recent search still fills the input and searches', () => {
  const { search, items } = openRecentSearches();
  const [first] = items();
  assert.ok((first.listeners.click || []).length > 0, 'the item has a click listener');
  first.click();
  assert.equal(search.input.value, QUERIES[0]);
  assert.match(search.resultsList.innerHTML, /search-result-item/, 'the chosen query ran a search');
});

test('removing a recent search works through listeners, not an inline handler', () => {
  const { env, search, list } = openRecentSearches();
  const removes = () => list.querySelectorAll('.search-recent-remove');
  assert.equal(removes().length, QUERIES.length);

  // Remove the middle entry: a wrong index (e.g. always 0) would keep it.
  const middle = removes()[1];
  assert.ok((middle.listeners.click || []).length > 0 ||
    (list.listeners.click || []).length > 0, 'remove is wired by a listener or delegation');

  middle.click();
  assert.deepEqual([...search.recentSearches], ['love', 'mercy'], 'exactly the clicked entry is gone');
  assert.deepEqual([...search.searchHistory], ['love', 'mercy'], 'history no longer holds it');
  assert.ok(!list.innerHTML.includes(QUERIES[1]), 'the removed query is no longer rendered');
  assert.deepEqual(JSON.parse(env.store.get(HISTORY_KEY)), ['love', 'mercy'], 'the removal was persisted');

  // The re-rendered list is still wired: remove the first of the two left.
  removes()[0].click();
  assert.deepEqual([...search.recentSearches], ['mercy']);
});
