import DashboardLayout from '../components/layout/DashboardLayout'
import { Button } from '../components/ui'

const stats = [
  { label: 'Candidate matches', value: '1,248' },
  { label: 'Chats initiated', value: '286' },
  { label: 'Profiles saved', value: '92' },
  { label: 'Weekly reach', value: '3.4k' },
]

function Dashboard() {
  return (
    <DashboardLayout>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-3xl border border-border bg-bg-card p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-text-muted">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-text-primary">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-border bg-bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-text-muted">Overview</p>
              <h2 className="mt-3 text-2xl font-semibold text-text-primary">Recent activity</h2>
            </div>
            <Button variant="secondary" size="sm">
              View report
            </Button>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-bg-primary p-5">
              <p className="text-sm text-text-muted">AI candidate search</p>
              <p className="mt-3 text-lg font-semibold text-text-primary">Improve search quality with targeted filters.</p>
            </div>
            <div className="rounded-3xl bg-bg-primary p-5">
              <p className="text-sm text-text-muted">Message templates</p>
              <p className="mt-3 text-lg font-semibold text-text-primary">Use smarter outreach copy for faster replies.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-bg-card p-6">
          <h3 className="text-base font-semibold text-text-primary">Quick actions</h3>
          <div className="mt-5 space-y-3">
            <Button fullWidth>Start new search</Button>
            <Button variant="outline" fullWidth>Open chat</Button>
            <Button variant="ghost" fullWidth>View saved candidates</Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}

export default Dashboard