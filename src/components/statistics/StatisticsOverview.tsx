import type { AppStatistics } from '../../types/statistics'
import { accuracyOf } from '../../services/statisticsService'
import StatTile from '../common/StatTile'

export default function StatisticsOverview({ statistics }: { statistics: AppStatistics }) {
  const accuracy = accuracyOf(statistics)
  return (
    <dl className="stat-grid" aria-label="Overall statistics">
      <StatTile label="Questions" value={statistics.attempted} />
      <StatTile label="Correct" value={statistics.correct} />
      <StatTile label="Incorrect" value={statistics.incorrect} />
      <StatTile label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} />
    </dl>
  )
}
