# Accessibility Testing Notes

## Automated (run on every `npm test` and checked in a real browser)

- `src/app/axe.test.tsx` runs the axe checker on every page (home, setup, question front and back, summary, statistics, settings, not found). Colour contrast is skipped there (jsdom cannot compute it) and covered by the token checks in `accessibility.test.tsx`.
- `src/app/keyboardSession.test.tsx` completes a whole session with the keyboard only.
- A real-browser axe run (Chromium, all WCAG 2 A/AA, 2.1 A/AA and best-practice rules, including contrast) was clean at desktop width, 640px (about 200% zoom), 320px (about 400% zoom) and with reduced motion, with no horizontal scrolling.

## Manual (needs a person)

Screen reader check, e.g. NVDA (free) with Chrome on Windows:

1. Press Insert+Space off, then Tab from the top: the first stop should be "Skip to main content".
2. On Set Up Your Practice, each option should read as a checkbox or radio button with its name and state.
3. During a question, each answer should read "Answer 1: 4, toggle button, not pressed". Pressing 1 to 4 selects it.
4. After Flip Card, the answer should be announced ("Answer revealed ...").
5. Each new question and the progress ("Question 2 of 10 ...") should be announced politely.
6. The leave and end-session dialogs should read their title and move focus to the safe button.

Note anything confusing or noisy and report it so it can be fixed.
