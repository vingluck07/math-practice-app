import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppProvider from './AppProvider'
import AppRoutes from './AppRoutes'

// A data router (rather than <BrowserRouter>) so the app can ask before leaving a running session.
const router = createBrowserRouter([{ path: '*', element: <AppRoutes /> }])

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  )
}
