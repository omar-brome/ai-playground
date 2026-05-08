import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { RoleProvider } from './context/RoleContext'
import { BookingProvider } from './context/BookingContext'
import { AuthProvider } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim()
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={<p className="p-6 text-center text-white">Something went wrong. Please refresh the page.</p>}
    >
      <BrowserRouter>
        <LocaleProvider>
          <AuthProvider>
            <RoleProvider>
              <BookingProvider>
                <App />
                <Toaster richColors position="top-center" theme="dark" />
              </BookingProvider>
            </RoleProvider>
          </AuthProvider>
        </LocaleProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
