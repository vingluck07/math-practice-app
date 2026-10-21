import { useMemo, useState } from 'react'
import type { MistakePattern } from '../../types/mistake'
import { formatAnswerText } from '../../utils/math'
import { Button } from '../common/Button'
import EmptyState from '../common/EmptyState'
import './MistakeStatistics.css'

interface MistakeDetailsProps {
  /** Every saved mistake, in the order to show them. */
  patterns: MistakePattern[]
  /** Correct similar questions needed to master a mistake. */
  threshold: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Each mistake with its miss count, mastery progress and last miss. Active and mastered are shown separately. */
export default function MistakeDetails({ patterns, threshold }: MistakeDetailsProps) {
  const [view, setView] = useState<'active' | 'mastered'>('active')
  const active = useMemo(() => patterns.filter((p) => !p.mastered), [patterns])
  const mastered = useMemo(() => patterns.filter((p) => p.mastered), [patterns])
  const shown = view === 'active' ? active : mastered

  if (patterns.length === 0) return null

  return (
    <>
      <div className="mistakes__tabs" role="group" aria-label="Which mistakes to show">
        <Button
          variant={view === 'active' ? 'primary' : 'secondary'}
          aria-pressed={view === 'active'}
          onClick={() => setView('active')}
        >
          Active ({active.length})
        </Button>
        <Button
          variant={view === 'mastered' ? 'primary' : 'secondary'}
          aria-pressed={view === 'mastered'}
          onClick={() => setView('mastered')}
        >
          Mastered ({mastered.length})
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={view === 'active' ? 'No active mistakes' : 'Nothing mastered yet'}
          message={
            view === 'active'
              ? 'Great job! Every mistake you have had is mastered.'
              : `Answer ${threshold} similar questions correctly to master a mistake.`
          }
        />
      ) : (
        <ul
          className="mistakes__list"
          aria-label={`${view === 'active' ? 'Active' : 'Mastered'} mistakes`}
        >
          {shown.map((p) => {
            const progress = Math.min(p.similarCorrectCount, threshold)
            return (
              <li key={p.id} className="mistake">
                <p className="mistake__fact">
                  {formatAnswerText(p.operation, p.firstOperand, p.secondOperand, p.correctAnswer)}
                </p>
                <p className="mistake__meta">
                  Missed {p.incorrectCount} {p.incorrectCount === 1 ? 'time' : 'times'} · last on{' '}
                  <time dateTime={p.lastIncorrectAt}>{formatDate(p.lastIncorrectAt)}</time>
                </p>
                <p className="mistake__progress">
                  <progress
                    value={p.mastered ? threshold : progress}
                    max={threshold}
                    aria-label={`Mastery progress for ${p.firstOperand} ${p.operation} ${p.secondOperand}`}
                  />
                  <span>
                    {p.mastered
                      ? 'Mastered'
                      : `${progress} of ${threshold} similar questions correct`}
                  </span>
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
