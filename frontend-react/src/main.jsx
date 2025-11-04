import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ToastProvider from './components/ToastProvider'
import './index.css'

// Apply saved theme settings (simple default) before React mounts so UI loads with correct colors
try {
  const saved = localStorage.getItem('hiday_theme_settings')
  const settings = saved ? JSON.parse(saved) : { mode: 'light', accentColor: 'indigo', fontSize: 'medium', sidebarCollapsed: false }
  const html = document.documentElement
  if (settings.mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    html.setAttribute('data-theme', settings.mode)
  }
  html.setAttribute('data-accent', settings.accentColor)
  html.setAttribute('data-font-size', settings.fontSize)
  html.setAttribute('data-sidebar-collapsed', settings.sidebarCollapsed)
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
