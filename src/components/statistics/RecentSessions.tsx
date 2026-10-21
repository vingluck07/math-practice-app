import type { SessionSummary } from '../../services/statisticsService'
import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../../utils/practiceConfig'
import EmptyState from '../common/EmptyState'
import './RecentSessions.css'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** The newest sessions first, one card each (so they stack nicely on small screens). */
export default function RecentSessions({ sessions }: { sessions: SessionSummary[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        message="Finish a practice session and it will show up here."
      />
    )
  }

  return (
    <ol className="sessions" aria-label="Recent sessions">
      {sessions.map((s) => {
        const operations = OPERATION_OPTIONS.filter((o) => s.operations.includes(o.value))
          .map((o) => o.label)
          .join(', ')
        const level = DIFFICULTY_OPTIONS.find((d) => d.value === s.difficulty)
        return (
          <li key={s.id} className="session">
            <div className="session__header">
              <time dateTime={s.startedAt} className="session__date">
                {formatDate(s.startedAt)}
              </time>
              <span className="session__accuracy">
                {s.accuracy === null ? '—' : `${s.accuracy}%`} accuracy
              </span>
            </div>
            <p className="session__what">
              {s.isReview
                ? `Mistake review · ${operations}`
                : `${operations} · Level ${s.difficulty} (${level?.label})`}
            </p>
            <p className="session__counts">
              {s.attempted} {s.attempted === 1 ? 'question' : 'questions'} · {s.correct} correct ·{' '}
              {s.incorrect} incorrect
            </p>
          </li>
        )
      })}
    </ol>
  )
}
