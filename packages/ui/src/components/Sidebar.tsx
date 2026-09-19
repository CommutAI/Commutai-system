import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Menu, X } from 'lucide-react'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SidebarItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  active?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ items, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform bg-gray-900 border-r border-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 p-4">
            <span className="text-xl font-bold text-white">CommutAI</span>
            <button
              onClick={onToggle}
              className="lg:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick()
                  if (window.innerWidth < 1024) onToggle()
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-4 z-30 rounded-lg bg-gray-900 p-2 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  )
}
