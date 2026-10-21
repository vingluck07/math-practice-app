import type { StorageFailure } from '../../services/storageService'
import { useStorageStatus } from '../../app/storageStatusContext'
import { Button } from './Button'
import './StorageWarning.css'

const EXPLANATIONS: Record<StorageFailure | 'default', string> = {
  unavailable:
    "Your browser isn't letting this app save anything (private browsing can cause this).",
  'quota-exceeded': "Your browser's storage is full, so there's no room to save new results.",
  unknown: 'Something stopped the app from saving.',
  default: 'Something stopped the app from saving.',
}

/** A friendly notice shown when progress cannot be saved in this browser. */
export default function StorageWarning() {
  const { hasStorageProblem, storageProblemReason, dismissStorageProblem } = useStorageStatus()
  if (!hasStorageProblem) return null

  return (
    <div className="storage-warning" role="status">
      <p>
        {EXPLANATIONS[storageProblemReason ?? 'default']} We can&apos;t save your progress in this
        browser right now. You can keep practicing, but your results may be lost when you close the
        page.
      </p>
      <Button variant="secondary" onClick={dismissStorageProblem}>
        OK
      </Button>
    </div>
  )
}
