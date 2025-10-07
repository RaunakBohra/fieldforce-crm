import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { APP_VERSION, BUILD_DATE } from './version'
import { initializeCsrfToken } from './utils/csrf'
// import { registerSW } from 'virtual:pwa-register'

// Log app version for debugging
console.log(`Field Force CRM - Version: ${APP_VERSION}`);
console.log(`Build Date: ${BUILD_DATE}`);

// Register Service Worker for PWA
// const updateSW = registerSW({
//   onNeedRefresh() {
//     if (confirm('New version available! Reload to update?')) {
//       updateSW(true);
//     }
//   },
//   onOfflineReady() {
//     console.log('App ready to work offline!');
//   },
// });

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
