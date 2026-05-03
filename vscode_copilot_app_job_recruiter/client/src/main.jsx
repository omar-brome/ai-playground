import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import useThemeStore from './store/themeStore'

// Initialize theme on app start
useThemeStore.getState().initializeTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
