import type { ReactNode } from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  title: string
  message: string
  /** Optional call to action, such as a button. */
  children?: ReactNode
}

/** Friendly placeholder shown when there is nothing to display yet. */
export default function EmptyState({ title, message, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__message">{message}</p>
      {children}
    </div>
  )
}
