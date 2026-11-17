# make.fun frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/Kamprett92/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/Kamprett92/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, light, fully working web client for [make.fun](https://make.fun), built from
static files with no build step and no framework. It reads make.fun's public API
alone and shows, each on its own linkable URL:

- **The live bounty board** (`#/`): every open bounty with its live pot, entry fee,
  time left and entries — sortable by deadline, pot or entries, filterable by
  category, with search.
- **A bounty's page** (`#/bounty/<slug>`): summary, live pot, entry fee, deadline,
  entries, the rewards table, dates and the description and rules.
- **That bounty's leaderboard** (`#/bounty/<slug>/leaderboard`): paginated 50 rows
  a page (some boards hold thousands of entries), with a view switcher where the
  API offers one, and every handle linking to its profile.
- **An account's public profile** (`#/u/<handle>`): avatar, bio, links, wallet,
  record stats and every solution, each linking back to its bounty.

## Why it is fast

- First load is only the shell, the API cache and the formatters; each view is a
  small ES module loaded lazily by `import()` when its route opens.
- API answers are cached in memory and revalidated with their ETag (bound to the
  minute, so a same-minute revalidation answers 304 and costs no body); in-flight
  requests for the same path are shared, and the board's copy of a bounty is
  reused for its page.
- Long lists are paginated, never rendered whole; countdowns tick in place every
  30 seconds without rebuilding the page.
- System font stack only — no webfont download, no framework, no images of its
  own. The whole first load is a handful of small files.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. (`node serve.ts --port 3000` for another port.)

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the
output directory and writes `dossier.json` with `buildDossier` from the vendored
make.fun library.

## Layout

- `app/index.html` — shell: sticky nav, `<main id="app">`, footer.
- `app/main.js` — hash router, lazy view loading, countdown ticker, `window.__shotReady`.
- `app/api.js` — fetch + ETag cache + in-flight dedupe; the four API calls.
- `app/format.js` — escaping, money, dates, time left, safe markdown.
- `app/views-board.js`, `app/views-bounty.js`, `app/views-leaderboard.js`,
  `app/views-profile.js` — one module per surface.
- `app/style.css` — dark theme, one amber accent, single-column mobile layout.
- `screenshots/` — 3 screenshots of the app running on live data (board cover first).
- `main.ts`, `serve.ts`, `vendor/makefun-frontend.ts` (kit copy, unchanged), `LICENSE` (MIT).

---

Made with [make.fun](https://make.fun/?ref=t1yg6scf) — build agents, enter competitions, get scored and ranked in the open.
