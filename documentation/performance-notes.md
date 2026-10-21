# Performance Notes (Phase 21)

## Rendering
- Small display pieces (`AnswerChoice`, `ProgressBar`, `StatTile`, `BreakdownCard`) are memoized; the question card keeps its handlers stable so picking an answer only redraws the buttons that changed.
- Statistics are computed once when the page opens (not on every render); the active/mastered mistake lists are memoized.
- Questions are generated only in session start-up and in event handlers, never while rendering.
- Settings and storage-status context values are memoized, so a storage warning does not redraw the practice page.

## Large histories
- Caps: 5,000 attempts, 100 sessions, 500 mistake patterns. A full set of attempts with real IDs is about 1.5 million characters, well under the roughly 5 million a browser allows (tested in `largeHistory.test.ts`; Settings shows the amount used).
- Older attempt details are dropped first, but the running totals (`statistics`) keep counting everything, so overall, operation and level statistics are never lost.
- The statistics page shows only the 10 most recent sessions.
- Loading and saving 5,000 attempts takes a few milliseconds.

## Loading
- Main bundle: 364 KB (114 KB gzipped), mostly React and React Router. Statistics (9 KB) and Settings (3 KB) are separate chunks, fetched in the background 1.5 s after the first page appears.
- Only the Latin part of the Fredoka font is bundled (30 KB instead of about 43 KB), and the unused font package was removed. There are no images beyond a small SVG icon.
- Measured in Chromium with 6x CPU slowdown and a 1.6 Mbps / 150 ms connection: home page ready in about 1.4 s (0.2 s unthrottled); statistics with 5,000 saved attempts opens in under 0.7 s; no console warnings or errors.
