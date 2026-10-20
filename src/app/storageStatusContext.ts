import { createContext, useContext } from 'react'

export interface StorageStatusValue {
  /** True when saving has failed, so the student should see a friendly warning. */
  hasStorageProblem: boolean
  reportStorageProblem: () => void
  dismissStorageProblem: () => void
}

export const StorageStatusContext = createContext<StorageStatusValue>({
  hasStorageProblem: false,
  reportStorageProblem: () => {},
  dismissStorageProblem: () => {},
})

export function useStorageStatus(): StorageStatusValue {
  return useContext(StorageStatusContext)
}
