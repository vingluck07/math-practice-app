import { memo } from 'react'
import './ProgressBar.css'

interface ProgressBarProps {
  completed: number
  total: number
}

/** Shows how many questions of a fixed-length session are done. */
export default memo(function ProgressBar({ completed, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label="Session progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      aria-valuetext={`${completed} of ${total} questions done`}
    >
      <div className="progress__fill" style={{ width: `${percent}%` }} />
    </div>
  )
})
