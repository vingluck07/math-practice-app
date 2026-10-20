import { useEffect, useId, useRef } from 'react'
import { Button } from './Button'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** A simple modal question. Render it only while it should be visible. */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const dialog = useRef<HTMLDivElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)

  // Focus the safe choice, and return focus to where it was when the dialog closes.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    cancelButton.current?.focus()
    return () => previous?.focus?.()
  }, [])

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      onCancel()
    } else if (event.key === 'Tab') {
      // Keep keyboard focus inside the dialog.
      const buttons = dialog.current?.querySelectorAll<HTMLElement>('button') ?? []
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }

  return (
    <div className="dialog-backdrop" onKeyDown={handleKeyDown}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialog}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{message}</p>
        <div className="dialog__actions">
          <Button variant="accent" ref={cancelButton} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="secondary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
