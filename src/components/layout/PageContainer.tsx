import type { ReactNode } from 'react'
import './PageContainer.css'

interface PageContainerProps {
  children: ReactNode
  /** Narrow container for focused pages (e.g. the practice card). */
  narrow?: boolean
}

export default function PageContainer({ children, narrow = false }: PageContainerProps) {
  return (
    <div className={narrow ? 'page-container page-container--narrow' : 'page-container'}>
      {children}
    </div>
  )
}
