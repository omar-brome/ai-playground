import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { RoleProvider } from './context/RoleContext'
import { BookingProvider } from './context/BookingContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <BookingProvider>
          <App />
        </BookingProvider>
      </RoleProvider>
    </BrowserRouter>
  </StrictMode>,
)
