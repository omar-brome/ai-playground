import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Button } from '../components/ui'

function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)

  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-border bg-bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-text-primary mb-3">Settings</h1>
          <p className="text-text-secondary mb-8">Manage your account preferences, notifications, and integrations.</p>

          <div className="space-y-8">
            <section className="rounded-3xl border border-border bg-bg-primary p-6">
              <h2 className="text-lg font-semibold text-text-primary">Account preferences</h2>
              <p className="mt-3 text-text-secondary">Control how the recruiter app behaves and what notifications you receive.</p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-3xl bg-bg-secondary p-4">
                  <div>
                    <p className="text-sm text-text-muted">Notification emails</p>
                    <p className="mt-1 text-text-secondary">Receive updates when new candidates match your search.</p>
                  </div>
                  <Button variant={notificationsEnabled ? 'secondary' : 'outline'} size="sm" onClick={() => setNotificationsEnabled((value) => !value)}>
                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-bg-secondary p-4">
                  <div>
                    <p className="text-sm text-text-muted">Dark mode</p>
                    <p className="mt-1 text-text-secondary">Switch the app theme for evening usage.</p>
                  </div>
                  <Button variant={darkMode ? 'secondary' : 'outline'} size="sm" onClick={() => setDarkMode((value) => !value)}>
                    {darkMode ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-bg-primary p-6">
              <h2 className="text-lg font-semibold text-text-primary">Integrations</h2>
              <p className="mt-3 text-text-secondary">Connect your search results and candidate data with external tools.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-bg-secondary p-4">
                  <p className="text-sm text-text-muted">LinkedIn Sync</p>
                  <p className="mt-2 text-text-primary">Link your search settings to external candidate sources.</p>
                </div>
                <div className="rounded-3xl border border-border bg-bg-secondary p-4">
                  <p className="text-sm text-text-muted">ATS export</p>
                  <p className="mt-2 text-text-primary">Export saved candidates for hiring team review.</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-bg-card p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Quick settings</h2>
          <div className="space-y-4">
            <div className="rounded-3xl bg-bg-primary p-4">
              <p className="text-text-secondary">Update your account details and notification preferences in one place.</p>
            </div>
            <div className="rounded-3xl bg-bg-primary p-4">
              <p className="text-sm text-text-muted">Need help?</p>
              <p className="mt-2 text-text-secondary">Contact your recruiter support team or view onboarding documentation.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Settings