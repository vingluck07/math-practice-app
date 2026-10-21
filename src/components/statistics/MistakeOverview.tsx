import type { MistakeStatistics } from '../../services/mistakeStatistics'
import { formatAnswerText } from '../../utils/math'
import { OPERATION_OPTIONS } from '../../utils/practiceConfig'
import EmptyState from '../common/EmptyState'
import StatTile from '../common/StatTile'
import './MistakeStatistics.css'

const labelOf = (operation: string) => OPERATION_OPTIONS.find((o) => o.value === operation)?.label

/** Counts of active and mastered mistakes, review progress, and what is missed most. */
export default function MistakeOverview({ mistakes }: { mistakes: MistakeStatistics }) {
  const { mostMissedOperations: top, frequentlyMissed } = mistakes

  if (frequentlyMissed.length === 0) {
    return (
      <EmptyState
        title="No mistakes yet"
        message="When you miss a question it is saved here so you can practice it later."
      />
    )
  }

  return (
    <>
      <dl className="stat-grid" aria-label="Mistake review statistics">
        <StatTile label="Active mistakes" value={mistakes.activeCount} />
        <StatTile label="Mastered" value={mistakes.masteredCount} />
        <StatTile label="Review questions" value={mistakes.reviewAttempted} />
        <StatTile label="Review correct" value={mistakes.reviewCorrect} />
      </dl>

      {top && (
        <p className="mistakes__top">
          Most missed operation:{' '}
          <strong>{top.operations.map((o) => labelOf(o)).join(' and ')}</strong>{' '}
          {top.operations.length > 1 ? `(tied, ${top.misses} each)` : `(${top.misses} misses)`}
        </p>
      )}

      <h3 className="mistakes__subheading">Facts you miss most</h3>
      <ol className="mistakes__facts" aria-label="Most missed facts">
        {frequentlyMissed.map((p) => (
          <li key={p.id}>
            <span className="mistakes__fact">
              {formatAnswerText(p.operation, p.firstOperand, p.secondOperand, p.correctAnswer)}
            </span>
            <span className="mistakes__count">
              missed {p.incorrectCount} {p.incorrectCount === 1 ? 'time' : 'times'}
            </span>
          </li>
        ))}
      </ol>
    </>
  )
}
