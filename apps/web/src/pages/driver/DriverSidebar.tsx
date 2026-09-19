import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Navigation, MapPin, Users, 
  Bell, Clock, User, LogOut, Menu, X,
  AlertTriangle
} from 'lucide-react';
import EmergencyButton from './EmergencyButton';

interface DriverSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { 
    path: '/driver/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Overview and status'
  },
  { 
    path: '/driver/current-trip', 
    label: 'Current Trip', 
    icon: Navigation,
    description: 'Manage active trip'
  },
  { 
    path: '/driver/navigation', 
    label: 'Route', 
    icon: MapPin,
    description: 'GPS navigation'
  },
  { 
    path: '/driver/occupancy', 
    label: 'Occupancy', 
    icon: Users,
    description: 'Passenger count'
  },
  { 
    path: '/driver/notifications', 
    label: 'Notifications', 
    icon: Bell,
    description: 'Alerts and messages'
  },
  { 
    path: '/driver/trip-history', 
    label: 'Trip History', 
    icon: Clock,
    description: 'Past trips'
  },
  { 
    path: '/driver/profile', 
    label: 'Profile', 
    icon: User,
    description: 'Account settings'
  }
];

export default function DriverSidebar({ isOpen, onClose }: DriverSidebarProps) {
  const location = useLocation();
  const [showEmergency, setShowEmergency] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@commutai/supabase');
      await supabase.auth.signOut();
      window.location.href = '/driver/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">CommutAI</h1>
                <p className="text-white/60 text-sm">Driver Portal</p>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="text-white" size={20} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg transition-all
                    ${isActive(item.path)
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Emergency Section */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => setShowEmergency(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-red-600/30 flex items-center justify-center gap-3 mb-4"
            >
              <AlertTriangle size={24} className="animate-pulse" />
              🚨 EMERGENCY
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <EmergencyButton standalone={true} />
          </div>
        </div>
      )}
    </>
  );
}

// Mobile Menu Button Component
export function DriverMobileMenuButton({ onToggle }: { onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      aria-label="Toggle menu"
    >
      <Menu className="text-white" size={24} />
    </button>
  );
}