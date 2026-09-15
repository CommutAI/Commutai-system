import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Menu } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  sidebarItems: Array<{
    label: string
    icon?: ReactNode
    onClick: () => void
    active?: boolean
  }>
  title?: string
}

export function Layout({ children, sidebarItems, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar
        items={sidebarItems}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </button>
              {title && (
                <h1 className="text-xl font-semibold text-white">{title}</h1>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
