import type { ReactNode } from 'react'
import './ChoiceCard.css'

interface ChoiceCardProps {
  /** `checkbox` for pick-many groups, `radio` for pick-one groups. */
  type: 'checkbox' | 'radio'
  name: string
  checked: boolean
  onChange: () => void
  label: string
  description?: string
  /** Decorative symbol shown beside the label. */
  icon?: ReactNode
}

/** A large, tappable option built on a native checkbox or radio input. */
export default function ChoiceCard({
  type,
  name,
  checked,
  onChange,
  label,
  description,
  icon,
}: ChoiceCardProps) {
  return (
    <label className="choice">
      <input
        className="choice__input"
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <span className="choice__body">
        {icon !== undefined && (
          <span className="choice__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="choice__text">
          <span className="choice__label">{label}</span>
          {description && <span className="choice__description">{description}</span>}
        </span>
        <span className="choice__check" aria-hidden="true">
          ✓
        </span>
      </span>
    </label>
  )
}
