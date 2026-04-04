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
      'min-h-[100dvh] w-full flex flex-col lg:flex-row transition-colors duration-700 overflow-x-hidden',
      isDark ? 'bg-[#0b1220]' : 'bg-gray-50'
    )}>
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block relative z-30 w-60 shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col relative z-10 mb-[calc(5rem+env(safe-area-inset-bottom))] lg:mb-0">
        <TopBar />
        <main className="flex-1 p-2 sm:p-4 md:p-8 lg:p-10">
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
