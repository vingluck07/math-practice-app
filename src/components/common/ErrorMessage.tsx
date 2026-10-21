import type { ReactNode } from 'react'
import './ErrorMessage.css'

interface ErrorMessageProps {
  title: string
  /** Plain-language explanation (never a stack trace or technical detail). */
  message: string
  /** Buttons or links offering a safe way forward. */
  children?: ReactNode
}

/** A friendly, reusable "something went wrong" block. */
export default function ErrorMessage({ title, message, children }: ErrorMessageProps) {
  return (
    <section className="error-message">
      <h1>{title}</h1>
      <p>{message}</p>
      {children && <div className="error-message__actions">{children}</div>}
    </section>
  )
}
