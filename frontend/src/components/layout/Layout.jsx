import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import useThemeStore from '../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function Layout({ children }) {
  const { isDark } = useThemeStore();

  return (
    <div className={clsx(
      'min-h-screen flex flex-col lg:flex-row transition-colors duration-700',
      isDark ? 'bg-surface-dark' : 'bg-gray-50'
    )}>
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] ambient-glow opacity-30 dark:opacity-20 animate-float" />
        <div className="absolute top-[40%] -right-[10%] ambient-glow opacity-20 dark:opacity-10" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)' }} />
      </div>

      {/* Sidebar for Desktop */}
      <div className="hidden lg:block relative z-30">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col relative z-10 lg:ml-64 mb-16 lg:mb-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 lg:p-10">
          <AnimatePresence mode="wait">
             <motion.div
               key={window.location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3, ease: 'easeOut' }}
             >
               {children}
             </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <div className="relative z-30">
        <BottomNav />
      </div>
    </div>
  );
}
