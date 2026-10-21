import { createContext, useContext } from 'react'
import type { StorageFailure } from '../services/storageService'

export interface StorageStatusValue {
  /** True when saving has failed, so the student should see a friendly warning. */
  hasStorageProblem: boolean
  /** Why saving failed, when known (used to pick a clear explanation). */
  storageProblemReason: StorageFailure | null
  reportStorageProblem: (reason?: StorageFailure) => void
  dismissStorageProblem: () => void
}

export const StorageStatusContext = createContext<StorageStatusValue>({
  hasStorageProblem: false,
  storageProblemReason: null,
  reportStorageProblem: () => {},
  dismissStorageProblem: () => {},
})

export function useStorageStatus(): StorageStatusValue {
  return useContext(StorageStatusContext)
}
