import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';

export default function Modal({ isOpen, onClose, title, children }) {
  const { isDark } = useThemeStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={clsx(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md max-h-[90vh] rounded-[2.5rem] shadow-2xl z-50 p-6 sm:p-10 flex flex-col',
              isDark ? 'bg-[#151221] border border-[#2d2545]' : 'bg-white border border-gray-100'
            )}
          >
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h3 className={clsx('text-xl sm:text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                {title}
              </h3>
              <button
                onClick={onClose}
                className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95',
                  isDark ? 'text-gray-400 hover:text-white hover:bg-white/10 shadow-lg shadow-black/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 shadow-sm'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-custom">
               {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
