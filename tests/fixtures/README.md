# Test fixtures

Trimmed recordings of real API responses (taken 2026-11-10), kept so the
offline tests exercise the response shapes the readers actually receive.

Scripture source text is kept where it is in the public domain (Sanskrit,
Gurmukhi, Arabic, the King James Version).
**Every other translation string has been replaced with a placeholder such
as `FIXTURE ENGLISH TRANSLATION 1`.** Do not paste translations into this
directory; if a test needs a translator's field, give it obviously
synthetic text.

| File | Endpoint | Notes |
|------|----------|-------|
| `alquran-surah-1.json`, `alquran-surah-2.json` | `api.alquran.cloud/v1/surah/{n}` | First two ayahs, Arabic |
| `alquran-surah-2-en.sahih.json` | `api.alquran.cloud/v1/surah/2/en.sahih` | Shape only; ayah text is placeholder |
| `gita-slok-12-1.json` | `vedicscriptures.github.io/slok/12/1/` | `slok` and `transliteration` are real; `purohit.et` is a placeholder |
| `gurbani-ang-1.json` | `api.gurbaninow.com/v2/ang/1` | First three lines; translations are placeholders |
| `wldeh-kjv-genesis-1.json` | `cdn.jsdelivr.net/gh/wldeh/bible-api/.../genesis/chapters/1.json` | Verses 1-3, each present twice as upstream serves them |
