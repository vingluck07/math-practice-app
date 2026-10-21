import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import PracticePage from '../pages/PracticePage'
import PracticeSetupPage from '../pages/PracticeSetupPage'
import SessionSummaryPage from '../pages/SessionSummaryPage'
import { SettingsPage, StatisticsPage } from './lazyPages'

function Loading() {
  return (
    <p role="status" className="loading">
      Loading…
    </p>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice/setup" element={<PracticeSetupPage />} />
        <Route path="/practice/session" element={<PracticePage />} />
        <Route path="/practice/summary" element={<SessionSummaryPage />} />
        <Route
          path="/statistics"
          element={
            <Suspense fallback={<Loading />}>
              <StatisticsPage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<Loading />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
