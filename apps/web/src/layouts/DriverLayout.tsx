import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navigation, User } from 'lucide-react'
import DriverSidebar, { DriverMobileMenuButton } from '../pages/driver/DriverSidebar'

export default function DriverLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile Header */}
      <header className="lg:hidden glass-card border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DriverMobileMenuButton onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Navigation className="text-orange-400" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">CommutAI Driver</h1>
                <p className="text-white/60 text-xs">Navigation System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block glass-card border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Navigation className="text-orange-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CommutAI Driver</h1>
              <p className="text-white/60 text-sm">Navigation System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/60">
              <User size={20} />
              <span className="text-sm">Driver Portal</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <DriverSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}