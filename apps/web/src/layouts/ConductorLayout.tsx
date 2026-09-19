import { Outlet } from 'react-router-dom'
import InteractiveBackground from './InteractiveBackground'
import BottomNav from './BottomNav'

import '../theme/variables.css'
import '../styles/modern-transport.css'

export default function ConductorLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <InteractiveBackground />
      <div className="relative z-10">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
