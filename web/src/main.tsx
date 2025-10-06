import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { APP_VERSION, BUILD_DATE } from './version'
import { initializeCsrfToken } from './utils/csrf'

// Log app version for debugging
console.log(`Field Force CRM - Version: ${APP_VERSION}`);
console.log(`Build Date: ${BUILD_DATE}`);

// Render app immediately
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialize CSRF token in background (non-blocking)
initializeCsrfToken().catch(error => {
  console.warn('Failed to initialize CSRF token on startup:', error);
  // Token will be fetched on-demand when needed
})
