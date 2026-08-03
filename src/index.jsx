import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SchoolConfigProvider } from './contexts/SchoolConfigContext'
import { NotificationProvider } from './context/NotificationContext'
import './index.css'

document.documentElement.classList.remove('dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <AuthProvider>
          <SchoolConfigProvider>
            <App />
          </SchoolConfigProvider>
        </AuthProvider>
      </NotificationProvider>
    </HashRouter>
  </ThemeProvider>
)

requestAnimationFrame(() => {
  window.dispatchEvent(new Event('app-ready'))
})