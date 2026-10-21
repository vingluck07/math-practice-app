import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './components/common/ErrorBoundary'
import App from './app/App'
import { preloadPages } from './app/lazyPages'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Once the first page is showing, quietly fetch the other pages so they open instantly.
window.setTimeout(() => void preloadPages().catch(() => {}), 1500)
