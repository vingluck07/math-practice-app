import { memo } from 'react'
import './StatTile.css'

interface StatTileProps {
  label: string
  value: string | number
}

/** One big number with a label. Render inside a `<dl>`. */
export default memo(function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="stat">
      <dt className="stat__label">{label}</dt>
      <dd className="stat__value">{value}</dd>
    </div>
  )
})
