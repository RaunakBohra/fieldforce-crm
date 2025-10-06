import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { APP_VERSION, BUILD_DATE } from './version'

// Log app version for debugging
console.log(`Field Force CRM - Version: ${APP_VERSION}`);
console.log(`Build Date: ${BUILD_DATE}`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
