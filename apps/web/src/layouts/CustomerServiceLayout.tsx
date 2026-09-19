import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Ticket,
  History,
  Menu,
  X,
  LogOut,
  RefreshCw,
  BarChart3,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@commutai/auth';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '.', icon: LayoutDashboard },
  { name: 'QR Cards', href: 'qr-cards', icon: CreditCard },
  { name: 'Temporary QR Cards', href: 'temporary-qr-cards', icon: Ticket },
  { name: 'Reload Card', href: 'reload-card', icon: RefreshCw },
  { name: 'Passengers', href: 'passengers', icon: Users },
  { name: 'Transactions', href: 'transactions', icon: History },
  { name: 'Reports', href: 'reports', icon: BarChart3 },
];

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (value: boolean) => void }) => {
  const location = useLocation();

  const isItemActive = (path: string) => {
    if (path === '.') {
      return location.pathname === '/customer-service' || location.pathname === '/customer-service/';
    }
    return location.pathname === `/customer-service/${path}`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`glass-sidebar fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {isOpen && (
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="CommutAI Logo"
                className="w-10 h-10"
              />
              <span className="text-white font-bold text-xl">CommutAI</span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:text-orange-400 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {isOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="glass-card h-16 flex items-center justify-end px-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-white font-medium">{user?.staff.full_name ?? 'Staff'}</p>
          <p className="text-white/60 text-sm capitalize">{user?.staff.role ?? 'cs_desk'}</p>
        </div>
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
          <User className="text-white" size={20} />
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="p-2 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'} p-6`}>
        <Header />
        <Outlet />
      </main>
    </div>
  );
}
