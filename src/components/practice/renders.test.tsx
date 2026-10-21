import { describe, expect, it } from 'vitest'
import StatTile from '../common/StatTile'
import BreakdownCard from '../statistics/BreakdownCard'
import AnswerChoice from './AnswerChoice'
import ProgressBar from './ProgressBar'

const MEMO = Symbol.for('react.memo')

/** These small display pieces are memoized so they are skipped when their props are unchanged. */
describe('memoized components', () => {
  it.each([
    ['AnswerChoice', AnswerChoice],
    ['ProgressBar', ProgressBar],
    ['StatTile', StatTile],
    ['BreakdownCard', BreakdownCard],
  ])('%s is memoized', (_name, component) => {
    expect((component as unknown as { $$typeof: symbol }).$$typeof).toBe(MEMO)
  })
})
