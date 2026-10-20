import type { OperationStatistics } from '../../types/statistics'
import { accuracyOf } from '../../services/statisticsService'
import './BreakdownCard.css'

interface BreakdownCardProps {
  title: string
  icon?: string
  counts: OperationStatistics
}

/** Attempted, correct, incorrect and accuracy for one operation or one level. */
export default function BreakdownCard({ title, icon, counts }: BreakdownCardProps) {
  const accuracy = accuracyOf(counts)
  return (
    <article className="breakdown">
      <h3 className="breakdown__title">
        {icon && (
          <span className="breakdown__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </h3>
      <dl className="breakdown__rows">
        <div>
          <dt>Attempted</dt>
          <dd>{counts.attempted}</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>{counts.correct}</dd>
        </div>
        <div>
          <dt>Incorrect</dt>
          <dd>{counts.incorrect}</dd>
        </div>
        <div className="breakdown__accuracy">
          <dt>Accuracy</dt>
          <dd>{accuracy === null ? '—' : `${accuracy}%`}</dd>
        </div>
      </dl>
    </article>
  )
}
