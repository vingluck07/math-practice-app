import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StorageStatusContext } from '../../app/storageStatusContext'
import type { StorageFailure } from '../../services/storageService'
import StorageWarning from './StorageWarning'

function renderWith(reason: StorageFailure | null) {
  render(
    <StorageStatusContext.Provider
      value={{
        hasStorageProblem: true,
        storageProblemReason: reason,
        reportStorageProblem: () => {},
        dismissStorageProblem: () => {},
      }}
    >
      <StorageWarning />
    </StorageStatusContext.Provider>,
  )
}

describe('StorageWarning', () => {
  it('explains a blocked browser', () => {
    renderWith('unavailable')
    expect(screen.getByText(/private browsing/i)).toBeInTheDocument()
  })

  it('explains full storage', () => {
    renderWith('quota-exceeded')
    expect(screen.getByText(/storage is full/i)).toBeInTheDocument()
  })

  it('always says progress cannot be saved', () => {
    renderWith(null)
    expect(screen.getByText(/can't save your progress/i)).toBeInTheDocument()
  })
})
