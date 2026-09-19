import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBadge from '../ui/StatusBadge';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  onBack?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  rightAction?: React.ReactNode;
  statusBadge?: { label: string; variant: 'success' | 'danger' | 'warning' | 'primary' };
  transparent?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  backTo,
  onBack,
  rightAction,
  statusBadge,
  transparent = false,
}) => {
  const navigate = useNavigate();

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).blur();
    
    console.log('[PageHeader] Back button clicked, onBack:', !!onBack, 'backTo:', backTo);
    
    if (onBack) {
      // Pass the event to the custom handler
      try {
        onBack(e);
      } catch (error) {
        console.error('Error in onBack handler:', error);
        // Fallback to default navigation
        if (backTo) navigate(backTo);
        else navigate(-1);
      }
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.header
        className={`page-header ${transparent ? 'page-header--transparent' : ''}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="page-header__inner">
          <div className="page-header__left">
            {showBack && (
              <button
                type="button"
                className="page-header__back"
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft size={22} />
              </button>
            )}
            {(title || subtitle) && (
              <div className="page-header__text">
                {title && <h1 className="page-header__title">{title}</h1>}
                {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
              </div>
            )}
            {statusBadge && (
              <StatusBadge variant={statusBadge.variant} dot pulse>
                {statusBadge.label}
              </StatusBadge>
            )}
          </div>
          {rightAction && (
            <div className="page-header__right" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {rightAction}
            </div>
          )}
        </div>
      </motion.header>
  );
};

export default PageHeader;
