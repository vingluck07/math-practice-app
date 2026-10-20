import { Route, Routes } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import PracticePage from '../pages/PracticePage'
import PracticeSetupPage from '../pages/PracticeSetupPage'
import SessionSummaryPage from '../pages/SessionSummaryPage'
import SettingsPage from '../pages/SettingsPage'
import StatisticsPage from '../pages/StatisticsPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice/setup" element={<PracticeSetupPage />} />
        <Route path="/practice/session" element={<PracticePage />} />
        <Route path="/practice/summary" element={<SessionSummaryPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
