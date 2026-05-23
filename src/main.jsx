import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ── Register Service Worker (PWA + Offline) ───────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[PWA] Service Worker registered:', reg.scope)

        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60000)

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available — reload to update')
            }
          })
        })
      })
      .catch(err => console.warn('[PWA] Registration failed:', err))
  })
}
