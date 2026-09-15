import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastColor = 'success' | 'danger' | 'warning' | 'info';

interface AppToastProps {
  isOpen: boolean;
  message: string;
  color?: ToastColor;
  duration?: number;
  onDismiss: () => void;
}

const iconMap = {
  success: CheckCircle2,
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorClasses = {
  success: 'bg-green-500',
  danger: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

const AppToast: React.FC<AppToastProps> = ({
  isOpen,
  message,
  color = 'success',
  duration = 2800,
  onDismiss,
}) => {
  const Icon = iconMap[color];

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onDismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] max-w-md">
            <Icon size={20} className={colorClasses[color]} />
            <span className="flex-1 text-sm">{message}</span>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppToast;
