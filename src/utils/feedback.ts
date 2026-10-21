import type { Rng } from './math'

export type FeedbackKind = 'correct' | 'incorrect'

/** Short, upbeat and never about the child ("you are bad"): only about the answer. */
export const FEEDBACK_MESSAGES: Record<FeedbackKind, readonly string[]> = {
  correct: ['Great job!', 'Nice work!', 'You got it!', 'Awesome!', 'Way to go!', 'Super!'],
  incorrect: [
    'Good try!',
    'Nice effort!',
    'Mistakes help us learn!',
    'You are getting closer!',
    'Keep going, you can do it!',
    'Every try makes you stronger!',
  ],
}

/**
 * Picks an encouraging message at random. Passing the message shown last time
 * (`avoid`) keeps the same one from appearing twice in a row.
 */
export function chooseFeedback(kind: FeedbackKind, rng: Rng = Math.random, avoid?: string): string {
  const pool = FEEDBACK_MESSAGES[kind]
  const choices = pool.length > 1 ? pool.filter((m) => m !== avoid) : pool
  return choices[Math.min(choices.length - 1, Math.floor(rng() * choices.length))]
}

const lastShown: Partial<Record<FeedbackKind, string>> = {}

/** Like `chooseFeedback`, remembering what was shown last so messages vary from question to question. */
export function nextFeedback(kind: FeedbackKind): string {
  const message = chooseFeedback(kind, Math.random, lastShown[kind])
  lastShown[kind] = message
  return message
}
