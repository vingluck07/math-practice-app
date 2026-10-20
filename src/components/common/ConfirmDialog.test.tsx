import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from './ConfirmDialog'

function setup() {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      title="End this session?"
      message="You will see how you did."
      confirmLabel="Yes, end it"
      cancelLabel="Keep going"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('is a labelled modal dialog with focus on the safe choice', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'End this session?' })).toHaveAttribute(
      'aria-modal',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Keep going' })).toHaveFocus()
  })

  it('confirms and cancels', async () => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = setup()
    await user.click(screen.getByRole('button', { name: 'Yes, end it' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Keep going' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('cancels with the Escape key', async () => {
    const user = userEvent.setup()
    const { onCancel } = setup()
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('keeps Tab focus inside the dialog', async () => {
    const user = userEvent.setup()
    setup()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Yes, end it' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Keep going' })).toHaveFocus()
  })
})
