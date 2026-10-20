import type { AppStatistics } from '../../types/statistics'
import { DIFFICULTY_OPTIONS } from '../../utils/practiceConfig'
import BreakdownCard from './BreakdownCard'

/** One card per difficulty level. */
export default function DifficultyStatisticsCards({ statistics }: { statistics: AppStatistics }) {
  return (
    <div className="breakdown-grid breakdown-grid--four">
      {DIFFICULTY_OPTIONS.map((d) => (
        <BreakdownCard
          key={d.value}
          title={`Level ${d.value}: ${d.label}`}
          counts={statistics.byDifficulty[d.value]}
        />
      ))}
    </div>
  )
}
