import Navbar from './Navbar'
import Sidebar from './Sidebar'

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Navbar />
      <div className="mx-auto flex max-w-[1480px] gap-6 px-6 py-8">
        <Sidebar />
        <main className="flex-1 space-y-8">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout