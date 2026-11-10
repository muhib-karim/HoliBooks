// Minimal browser stand-in for the offline tests.
//
// The site ships classic <script> files that expect a DOM. This helper loads
// those same files into a node:vm context backed by a small fake DOM, an
// in-memory localStorage, an injectable fetch and a manual clock. It has no
// dependencies, so the suite still runs with plain `node --test`.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../..', import.meta.url));
export const readRepoFile = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
export const fixture = (name) => JSON.parse(readRepoFile(`tests/fixtures/${name}`));

class FakeClassList {
  constructor() { this.names = new Set(); }
  add(...n) { n.forEach(x => this.names.add(x)); }
  remove(...n) { n.forEach(x => this.names.delete(x)); }
  contains(n) { return this.names.has(n); }
  toggle(n, force) {
    const on = force === undefined ? !this.names.has(n) : Boolean(force);
    if (on) this.names.add(n); else this.names.delete(n);
    return on;
  }
}

export class FakeElement {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.classList = new FakeClassList();
    this.html = '';
    this.text = '';
    this.value = '';
    this.disabled = false;
    this.parentNode = null;
  }
  get innerHTML() { return this.html; }
  set innerHTML(v) { this.html = String(v); this.text = ''; this.children = []; }
  get textContent() { return this.text; }
  set textContent(v) { this.text = String(v); this.html = ''; this.children = []; }
  get className() { return [...this.classList.names].join(' '); }
  set className(v) { this.classList = new FakeClassList(); String(v).split(/\s+/).filter(Boolean).forEach(n => this.classList.add(n)); }
  get firstChild() { return this.children[0] || null; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  insertBefore(child) { this.children.unshift(child); child.parentNode = this; return child; }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(c => c !== this); }
  insertAdjacentHTML(position, html) { this.html = position === 'afterbegin' ? html + this.html : this.html + html; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(f => f !== fn); }
  dispatch(type, event = {}) {
    const e = { type, target: this, preventDefault() {}, stopPropagation() {}, ...event };
    return (this.listeners[type] || []).map(fn => fn(e));
  }
  click() { return this.dispatch('click'); }
  focus() {}
  scrollIntoView() {}
  contains() { return true; }
  closest() { return null; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 100, height: 10 }; }
  /** Everything this element would show: its own markup/text plus its children's. */
  rendered() { return this.html + this.text + this.children.map(c => c.rendered()).join(''); }
  /** Only what was written as HTML (innerHTML), i.e. what the browser would parse as markup. */
  markup() { return this.html + this.children.map(c => c.markup()).join(''); }
  /** Depth-first search over elements appended with appendChild. */
  find(predicate) {
    for (const c of this.children) { if (predicate(c)) return c; const hit = c.find(predicate); if (hit) return hit; }
    return null;
  }
}

class FakeAudio extends FakeElement {
  constructor() { super('audio'); this.src = ''; this.currentTime = 0; this.duration = NaN; this.playbackRate = 1; this.defaultPlaybackRate = 1; this.loop = false; this.plays = 0; }
  play() { this.plays++; return Promise.resolve(); }
  pause() {}
}

/**
 * Create a fake browser window.
 * @param {object} [options]
 * @param {string} [options.url] page URL, used for location and query params
 * @param {Record<string,string>} [options.storage] initial raw localStorage contents
 * @param {(url: string, init?: object) => Promise<object>} [options.fetch] fetch stand-in
 */
export function createBrowser({ url = 'https://holibooks.test/index.html', storage = {}, fetch = null } = {}) {
  const store = new Map(Object.entries(storage));
  const byId = new Map();
  const bySelector = new Map();
  const lists = new Map();
  const docListeners = {};
  const winListeners = {};
  const timers = new Set();
  const history = [];
  const requests = [];
  const intervals = [];
  let clock = 0;
  let inFlight = 0;   // fetches started and not yet answered
  let activity = 0;   // bumps whenever a fetch starts/ends or a timer fires

  // Like window.location: assigning a relative href resolves against the current page.
  let current = new URL(url);
  const location = {
    get href() { return current.href; },
    set href(value) { current = new URL(String(value), current); },
    get search() { return current.search; },
    get pathname() { return current.pathname; },
    get origin() { return current.origin; },
    get hash() { return current.hash; },
    reloads: 0,
    reload() { this.reloads++; },
    toString() { return current.href; },
  };
  const el = (id) => { if (!byId.has(id)) byId.set(id, new FakeElement('div')); return byId.get(id); };
  const document = {
    readyState: 'complete',
    head: new FakeElement('head'),
    body: new FakeElement('body'),
    documentElement: new FakeElement('html'),
    createElement: (tag) => (tag === 'audio' ? new FakeAudio() : new FakeElement(tag)),
    getElementById: el,
    querySelector: (sel) => { if (!bySelector.has(sel)) bySelector.set(sel, new FakeElement('div')); return bySelector.get(sel); },
    querySelectorAll: (sel) => lists.get(sel) || [],
    addEventListener: (type, fn) => { (docListeners[type] ||= []).push(fn); },
    dispatchEvent: () => true,
  };
  document.documentElement.scrollHeight = 2000;

  const fetchImpl = fetch || (async () => { throw new TypeError('Failed to fetch'); });
  const win = {
    document, location, console: { log() {}, warn() {}, error() {}, info() {} },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    },
    history: {
      pushState: (_s, _t, to) => { history.push({ kind: 'push', url: String(to) }); location.href = String(to); },
      replaceState: (_s, _t, to) => { history.push({ kind: 'replace', url: String(to) }); location.href = String(to); },
    },
    navigator: { onLine: true, clipboard: { writeText: async () => {} } },
    fetch: (input, init) => {
      const u = String(input?.url || input);
      requests.push(u);
      inFlight++; activity++;
      const done = () => { inFlight--; activity++; };
      const result = Promise.resolve().then(() => fetchImpl(u, init));
      result.then(done, done);
      return result;
    },
    setTimeout: (fn, ms = 0) => { const t = { fn, ms, at: clock + ms }; timers.add(t); return t; },
    clearTimeout: (t) => { timers.delete(t); },
    setInterval: (_fn, ms) => { intervals.push(ms); return {}; },
    clearInterval: () => {},
    addEventListener: (type, fn) => { (winListeners[type] ||= []).push(fn); },
    scrollTo() {}, scrollY: 0, innerHeight: 800, innerWidth: 1200, pageYOffset: 0,
    confirm: () => true,
    Audio: FakeAudio,
    IntersectionObserver: class { observe() {} disconnect() {} },
    CustomEvent: class { constructor(type, init) { this.type = type; Object.assign(this, init); } },
    URL, URLSearchParams, AbortController, performance, Blob,
  };
  win.window = win;
  win.self = win;
  vm.createContext(win);

  const flush = () => new Promise(resolve => setImmediate(resolve));
  return {
    window: win, document, el, store, history, requests, intervals, location,
    /** Run page scripts in order, exactly as <script src> tags would. */
    load(...files) { for (const f of files) vm.runInContext(readRepoFile(f), win, { filename: f }); return this; },
    /** Read a top-level const/let/function from the loaded scripts. */
    get(expression) { return vm.runInContext(expression, win); },
    /** Preset what document.querySelectorAll(selector) returns. */
    setAll(selector, elements) { lists.set(selector, elements); },
    /**
     * Fire a document-level event (e.g. DOMContentLoaded, keydown). Handlers are started,
     * short timers are run (retry backoffs), then async handlers are awaited.
     */
    async fire(type, event = {}) {
      const started = (docListeners[type] || []).map(fn => fn({ type, target: document.body, preventDefault() {}, ...event }));
      await this.settle();
      await Promise.all(started);
      await flush();
    },
    async fireWindow(type, event = {}) {
      const started = (winListeners[type] || []).map(fn => fn({ type, ...event }));
      await this.settle();
      await Promise.all(started);
      await flush();
    },
    /**
     * Run until the page is quiet: pending timers shorter than `limit` ms (retry
     * backoffs, UI delays) are fired and in-flight fetches are awaited. A fetch that
     * a test deliberately leaves unanswered does not block: settle() returns once
     * nothing has happened for a few turns of the event loop.
     */
    async settle(limit = 10000) {
      let idle = 0;
      for (let i = 0; i < 5000; i++) {
        const before = activity;
        await flush();
        const due = [...timers].filter(t => t.ms < limit).sort((a, b) => a.at - b.at)[0];
        if (due) { timers.delete(due); clock = Math.max(clock, due.at); activity++; due.fn(); idle = 0; continue; }
        idle = activity === before ? idle + 1 : 0;
        if (idle >= (inFlight === 0 ? 2 : 6)) return;
      }
      throw new Error('settle(): page never became quiet');
    },
    pendingTimers: () => [...timers],
  };
}

/** A fetch stand-in that answers from a { urlSubstring: body | Error | {status} } table. */
export function routeFetch(routes) {
  return async (url) => {
    for (const [needle, value] of Object.entries(routes)) {
      if (!url.includes(needle)) continue;
      const body = typeof value === 'function' ? value(url) : value;
      if (body instanceof Error) throw body;
      if (body && body.__status) return { ok: false, status: body.__status, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => body };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
}
export const httpStatus = (status) => ({ __status: status });
