import type { ReactNode } from 'react'
import './Panel.css'

interface PanelProps {
  children: ReactNode
  /** Extra class for page-specific tweaks. */
  className?: string
}

/** A floating white box with centered text, used to frame a page's content. */
export default function Panel({ children, className }: PanelProps) {
  return <section className={className ? `panel ${className}` : 'panel'}>{children}</section>
}
