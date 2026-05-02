import DashboardLayout from '../components/layout/DashboardLayout'

function Settings() {
  return (
    <DashboardLayout>
      <div className="rounded-3xl border border-border bg-bg-card p-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-3">Settings</h1>
        <p className="text-text-secondary">Manage your account preferences, notifications, and integrations.</p>
      </div>
    </DashboardLayout>
  )
}

export default Settings