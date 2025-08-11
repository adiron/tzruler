import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TimeProvider } from './TimeContext.tsx'
import { SettingsProvider } from './SettingsContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <TimeProvider>
        <App />
      </TimeProvider>
    </SettingsProvider>
  </StrictMode>,
)
