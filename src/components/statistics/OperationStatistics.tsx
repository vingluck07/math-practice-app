import type { AppStatistics } from '../../types/statistics'
import { OPERATION_OPTIONS } from '../../utils/practiceConfig'
import BreakdownCard from './BreakdownCard'

/** One card per operation. */
export default function OperationStatisticsCards({ statistics }: { statistics: AppStatistics }) {
  return (
    <div className="breakdown-grid">
      {OPERATION_OPTIONS.map((o) => (
        <BreakdownCard
          key={o.value}
          title={o.label}
          icon={o.symbol}
          counts={statistics.byOperation[o.value]}
        />
      ))}
    </div>
  )
}
