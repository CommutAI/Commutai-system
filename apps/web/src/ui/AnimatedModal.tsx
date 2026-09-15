import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showClose?: boolean;
  variant?: 'sheet' | 'center';
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  showClose = true,
  variant = 'sheet',
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50"
        />
        
        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className={`bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto ${
              variant === 'sheet' ? 'rounded-b-none' : ''
            }`}
            initial={{ opacity: 0, y: variant === 'sheet' ? 40 : 0, scale: variant === 'center' ? 0.95 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: variant === 'sheet' ? 40 : 0, scale: variant === 'center' ? 0.95 : 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between p-4 border-b">
                {title && <h2 className="text-lg font-semibold">{title}</h2>}
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);

export default AnimatedModal;
