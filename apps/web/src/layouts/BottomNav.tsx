import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ScanLine, User, History } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppToast } from '../ui';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <Home size={22} />, matchPaths: ['/'] },
  { path: '/scan', label: 'Scan', icon: <ScanLine size={22} />, matchPaths: ['/scan'] },
  { path: '/history', label: 'History', icon: <History size={22} />, matchPaths: ['/history', '/trip-summary'] },
  { path: '/profile', label: 'Profile', icon: <User size={22} />, matchPaths: ['/profile'] },
];

interface BottomNavProps {
  hidden?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ hidden = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTrip, currentBus } = useApp();

  const [showBlockToast, setShowBlockToast] = React.useState(false);

  if (hidden) return null;

  const isActive = (item: NavItem) =>
    item.matchPaths?.some((p) => location.pathname.startsWith(p)) ?? location.pathname === item.path;

  const handleNavClick = (item: NavItem) => {
    if (item.path === '/scan' && (!currentTrip || !currentBus)) {
      setShowBlockToast(true);
      return;
    }
    navigate(item.path);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 z-50">
      <nav className="bottom-nav-modern" aria-label="Main navigation">
        <div className="bottom-nav-modern__container">
          {navItems.map((item) => {
            const active = isActive(item);
            const isLocked = item.path === '/scan' && (!currentTrip || !currentBus);
            return (
              <button
                key={item.path}
                type="button"
                className={`bottom-nav-modern__item ${active ? 'bottom-nav-modern__item--active' : ''} ${isLocked ? 'bottom-nav-modern__item--locked' : ''}`}
                onClick={(e) => {
                  (e.currentTarget as HTMLElement).blur();
                  handleNavClick(item);
                }}
                aria-current={active ? 'page' : undefined}
                aria-disabled={isLocked}
              >
                {active && (
                  <div
                    className="bottom-nav-modern__indicator"
                  />
                )}
                <span className="bottom-nav-modern__icon" style={{ position: 'relative' }}>
                  {item.icon}
                  {isLocked && (
                    <span style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: 'var(--color-warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '7px',
                    }}>🔒</span>
                  )}
                </span>
                <span className="bottom-nav-modern__label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AppToast
        isOpen={showBlockToast}
        message="Start a trip first before opening the scanner"
        color="warning"
        onDismiss={() => setShowBlockToast(false)}
      />
    </footer>
  );
};

export default BottomNav;
