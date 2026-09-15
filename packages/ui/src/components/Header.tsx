import type { ReactNode } from 'react'

interface HeaderProps {
  title?: string
  actions?: ReactNode
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function Header({ title, actions, onMenuClick, showMenuButton = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {title && (
            <h1 className="text-xl font-semibold text-white">{title}</h1>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
