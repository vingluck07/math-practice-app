import { BrowserRouter } from 'react-router-dom'
import AppProvider from './AppProvider'
import AppRoutes from './AppRoutes'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
