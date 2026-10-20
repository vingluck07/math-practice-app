import { useStorageStatus } from '../../app/storageStatusContext'
import { Button } from './Button'
import './StorageWarning.css'

/** A friendly notice shown when progress cannot be saved in this browser. */
export default function StorageWarning() {
  const { hasStorageProblem, dismissStorageProblem } = useStorageStatus()
  if (!hasStorageProblem) return null

  return (
    <div className="storage-warning" role="status">
      <p>
        We can&apos;t save your progress in this browser right now. You can keep practicing, but
        your results may be lost when you close the page.
      </p>
      <Button variant="secondary" onClick={dismissStorageProblem}>
        OK
      </Button>
    </div>
  )
}
