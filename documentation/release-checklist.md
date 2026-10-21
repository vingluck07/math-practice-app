# Release Checklist (Phase 22)

## Privacy review (done)
- No personal information is asked for or stored; there are no accounts.
- No network requests are made (no `fetch`, analytics, fonts or scripts from other sites); a real-browser run saw none, and the Netlify config blocks them (`connect-src 'none'`, same-origin only).
- Practice data lives only in the browser's local storage. The Settings page has a Privacy note, says clearing browser data removes progress, and offers "Clear All Application Data".
- No ads or tracking services.

## Browser testing
| Browser / device | Status |
| --- | --- |
| Chrome (Chromium) desktop | Tested: all routes, direct links and refresh, full session, persistence, no console messages |
| Microsoft Edge | Same engine as Chrome; please open the deployed site once to confirm |
| iPad-sized tablet, portrait and landscape (touch emulation) | Tested, no overflow, full session by tap |
| Phone 390x844 and small phone 320x568 (touch emulation) | Tested, no overflow, full session by tap |
| Firefox | Not run here. Needs a manual check (steps below) |
| Safari (Mac/iPad/iPhone) | Not run here. Needs a manual check (steps below) |

Compatibility review: the app uses only widely supported features (CSS `clamp`, `min`, `:focus-visible`, `overflow-wrap: anywhere`, prefixed `backface-visibility`; the `inert` attribute needs Safari 15.5+ and Firefox 112+; `crypto.randomUUID` has a fallback).

Manual check in Firefox and Safari: open each page (Home, Practice setup, Statistics, Settings), play a 5-question session with the mouse or touch, flip the card, finish, refresh the Statistics page and confirm the totals remain, and look for layout problems or errors in the console.

## Production build (done)
`npm run verify` runs lint, formatting check, all tests and the build. The built site was served locally with the same security headers and a "send every address to index.html" fallback; every route, refresh and deep link worked.

## Deploy (Netlify) and checks after deploying
Steps are in the README. After the first deploy, verify:
- Every route loads directly and after refresh: `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, `/settings`, and an unknown address (shows "Page not found").
- Progress is still there after closing and reopening the tab.
- Layout works on a phone and a tablet.
- The browser console (F12) shows no errors or warnings.
