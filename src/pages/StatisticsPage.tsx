import { useState } from 'react'
import { useSettings } from '../app/settingsContext'
import { Button, ButtonLink } from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import DifficultyStatisticsCards from '../components/statistics/DifficultyStatistics'
import MistakeDetails from '../components/statistics/MistakeDetails'
import MistakeOverview from '../components/statistics/MistakeOverview'
import OperationStatisticsCards from '../components/statistics/OperationStatistics'
import RecentSessions from '../components/statistics/RecentSessions'
import StatisticsOverview from '../components/statistics/StatisticsOverview'
import { useStatistics } from '../hooks/useStatistics'
import './StatisticsPage.css'

export default function StatisticsPage() {
  const { statistics, recentSessions, mistakes, patterns, reset } = useStatistics()
  const { settings } = useSettings()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const hasData = statistics.attempted > 0 || recentSessions.length > 0

  return (
    <section>
      <h1>Statistics</h1>

      {!hasData ? (
        <div className="stats-section">
          <EmptyState
            title="No practice yet"
            message="Answer some questions and your progress will show up here."
          >
            <ButtonLink to="/practice/setup" variant="accent">
              Start Practice
            </ButtonLink>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="stats-section">
            <h2>Overall</h2>
            <StatisticsOverview statistics={statistics} />
          </div>

          <div className="stats-section">
            <h2>By Operation</h2>
            <OperationStatisticsCards statistics={statistics} />
          </div>

          <div className="stats-section">
            <h2>By Level</h2>
            <DifficultyStatisticsCards statistics={statistics} />
          </div>

          <div className="stats-section">
            <h2>Mistake Review</h2>
            <MistakeOverview mistakes={mistakes} />
          </div>

          {patterns.length > 0 && (
            <div className="stats-section">
              <h2>Mistake Details</h2>
              <MistakeDetails patterns={patterns} threshold={settings.masteryThreshold} />
            </div>
          )}

          <div className="stats-section">
            <h2>Recent Sessions</h2>
            <RecentSessions sessions={recentSessions} />
          </div>

          <div className="stats-reset">
            <Button variant="secondary" onClick={() => setConfirmingReset(true)}>
              Reset Statistics
            </Button>
          </div>
        </>
      )}

      {confirmingReset && (
        <ConfirmDialog
          title="Reset statistics?"
          message="Are you sure you want to erase all practice history and statistics? Your settings will stay the same."
          confirmLabel="Yes, Erase Everything"
          cancelLabel="Keep My History"
          onConfirm={() => {
            reset()
            setConfirmingReset(false)
          }}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
    </section>
  )
}
