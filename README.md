<p align="center">
  <img src="docs/banner.svg" alt="HoliBooks: six sacred texts in one distraction-free reader" width="100%">
</p>

<p align="center"><b>Six sacred texts. One distraction-free reader.</b></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/muhib-karim/HoliBooks" alt="License: MIT"></a>
  <img src="https://img.shields.io/github/languages/top/muhib-karim/HoliBooks" alt="Top language">
  <a href="https://github.com/muhib-karim/HoliBooks/actions/workflows/ci.yml"><img src="https://github.com/muhib-karim/HoliBooks/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

# HoliBooks

HoliBooks is a browser reader for the **Quran, Bible, Bhagavad Gita, Torah, Guru Granth Sahib and Dhammapada**. It is a static site built with plain HTML, CSS and JavaScript (no framework, no build step). Five of the readers load text from public scripture APIs. The Dhammapada reader uses data embedded in the page.

The deployment target configured in `package.json` is [holibooks.vercel.app](https://holibooks.vercel.app/). A dated browser check on 11 October 2026 loaded the homepage and Al-Faatiha in the Quran reader. This README does not claim the site is still up after that date.

[Report an issue](https://github.com/muhib-karim/HoliBooks/issues) · [MIT license](LICENSE)

## Screenshot

![HoliBooks homepage, captured 11 October 2026](docs/assets/homepage-20261011.png)

*Homepage captured 11 October 2026. The "100+ Languages" badge shown in the page is an unverified coverage figure. This README does not make that claim.*

## Features

What the code implements:

- **Six readers**, one page each under `religions/<tradition>/`:

  | Reader | Data source (from the code) |
  |--------|-----------------------------|
  | Quran | [AlQuran Cloud API](https://api.alquran.cloud/v1); verse audio from `cdn.islamic.network` |
  | Bible | `wldeh/bible-api` served via jsDelivr |
  | Torah | `wldeh/bible-api` served via jsDelivr |
  | Bhagavad Gita | `vedicscriptures.github.io` |
  | Guru Granth Sahib | GurbaniNow API (`api.gurbaninow.com/v2`) |
  | Dhammapada | Embedded in `tripitaka.js` |

- **Translation / language selection** where the upstream source offers it (`js/language-selector.js`). Coverage differs by text and provider.
- **Audio player** component (`js/audio-player.js`) used by the Quran reader.
- **Bookmarks** saved in `localStorage` (`js/bookmarks.js`).
- **Global search** that opens with `Ctrl+K` / `Cmd+K` (`js/search.js`).
- **PWA shell**: a web app manifest, plus a service worker (`sw.js`) that precaches the reader pages and shared assets, with an `offline.html` fallback.
- **Dark/light theme** stored in `localStorage` (`js/utils.js`).
- **API status indicator** on the homepage (`js/api-monitor.js`).
- **Hardened local preview server** (`serve.js`). It binds to `127.0.0.1` only, accepts only GET/HEAD and rejects path traversal, malformed URLs and symlink escapes.

## Quick start

You need Node.js 18 or newer. The preview server and the tests use only Node built-ins, so there is no `npm install` step.

```bash
git clone https://github.com/muhib-karim/HoliBooks.git
cd HoliBooks
npm run dev            # serves http://127.0.0.1:3000
```

Set `PORT` to use another port, e.g. `PORT=8080 npm run dev`. Open the pages over HTTP rather than `file://`, because browsers may block API requests from `file://` origins. The readers need network access to reach the upstream APIs.

## Usage

| Command | What it does |
|---------|--------------|
| `npm run dev` / `npm start` | Start the local static preview server |
| `npm test` | Run the offline test suite (no network, no secrets) |
| `npm run test:server` | Run only the local-server tests |
| `npm run test:apis` | Optional live smoke check of the Quran, Bible, Gita and Gurbani APIs. Exits non-zero on any failure |
| `npm run deploy` | Deploy to Vercel. Needs the Vercel CLI and the owner's account |

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    Home[index.html<br/>homepage + API status] --> Readers
    subgraph Readers[religions/*]
      Q[Quran]
      B[Bible]
      T[Torah]
      G[Gita]
      S[Gurbani]
      D[Dhammapada<br/>embedded data]
    end
    Shared[js/ shared modules<br/>utils · search · bookmarks<br/>audio-player · language-selector] --> Readers
    SW[sw.js service worker] -. precache / offline.html .- Readers
    LS[(localStorage<br/>theme · bookmarks)] --- Shared
  end
  Q --> AQ[AlQuran Cloud API + audio CDN]
  B & T --> JD[wldeh/bible-api via jsDelivr]
  G --> VS[vedicscriptures.github.io]
  S --> GN[GurbaniNow API]
  Dev[serve.js<br/>local preview only] -. serves static files .-> Browser
```

- The app is static. All reader logic runs in the browser, and each reader page loads the shared `js/` scripts and then its own script.
- `serve.js` exists only for local development. Production hosting is a static host (Vercel).
- `test-apis.js` is an importable module and also a CLI. Its request function can be injected, so the offline tests can run it against fake responses.

## Testing

```bash
npm test
```

The offline suite has **11 tests** in 3 files, run with the built-in `node:test` runner:

| File | Covers |
|------|--------|
| `tests/server.test.mjs` | Starts `serve.js` on a random port. Checks HTML serving, query strings, 404s, malformed and traversal paths (400), POST (405) and HEAD |
| `tests/api-smoke.test.mjs` | The API smoke checker against fake responses: success, HTTP errors, empty bodies, network errors and a wall-clock timeout on a response that never finishes |
| `tests/static-integrity.test.mjs` | Every local `href`/`src` in the 8 HTML pages resolves to a file, every service-worker precache path exists, the manifest's icons, screenshots and shortcuts exist, all six readers are linked from the homepage, and every browser script parses |

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml), "Local server checks") runs `node --check` on the Node scripts and then the full offline suite on Node 18, 20 and 22.

These tests do **not** cover reader behaviour in a real browser, the upstream APIs, audio playback or offline use. `npm run test:apis` is the separate network check, and it is kept out of CI so that third-party downtime does not fail the build.

## Project structure

```
index.html            Homepage linking to the six readers
offline.html          Service-worker offline fallback
manifest.json, sw.js  PWA manifest and service worker
css/                  Global styles and animations
js/                   Shared browser modules (utils, search, bookmarks, audio, language, API monitor)
religions/<name>/     One reader per tradition: .html + .css + .js
serve.js              Local-only static preview server
test-apis.js          Optional live API smoke check (CLI + module)
tests/                Offline node:test suite
docs/                 README banner and screenshots
```

Legacy files from earlier versions (`app.js`, `style.css`, `quran_arabic.json`, `extract_pdf.py`, `EntireQuranonOnePage.pdf`) remain in the repo. Of these, only `app.js` and `style.css` are referenced (by the service-worker precache list).

## Limitations

- Language coverage differs by text and upstream provider, so no single language count is claimed.
- Network availability, API policies, CORS and upstream changes can break reading or audio.
- The service worker precaches the app shell. That does not guarantee every text or translation is available offline, so check the content you need before relying on it offline.
- Text, translation and audio rights belong to their sources. The MIT license covers only this code.
- HoliBooks is a reading tool. It is not an authoritative edition, so verify editions and translations against their sources.

## Contributing

When reporting an issue, include the reader URL, browser, selected text and language. Run `npm test` before opening a PR. Changes to reader behaviour should come with browser evidence and a note on which upstream source is affected.

## License

The application code is released under the [MIT License](LICENSE). Check each upstream text or translation source for its own terms.
