import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sun, Moon, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectCurrentUser } from '../../store/slices/authSlice';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your progress' },
  '/habits': { title: 'Habits', subtitle: 'Daily routines and streaks' },
  '/tasks': { title: 'Tasks', subtitle: 'Plan and complete your work' },
  '/friends': { title: 'Friends', subtitle: 'Stay connected and accountable' },
  '/challenges': { title: 'Challenges', subtitle: 'Shared goals with your circle' },
  '/settings': { title: 'Settings', subtitle: 'Manage your preferences' },
};

export default function TopBar() {
  const { isDark, toggle } = useThemeStore();
  const { pathname } = useLocation();
  const user = useSelector(selectCurrentUser);
  const isDashboard = pathname === '/dashboard';
  const page = pageTitles[pathname] || { title: 'HabitTrack', subtitle: 'Build better routines' };
  const userName = user?.name?.split(' ')?.[0] || 'there';
  const headerTitle = isDashboard ? `Hi, ${userName}` : page.title;
  const headerSubtitle = isDashboard
    ? `Active days: ${user?.streak || 0}`
    : page.subtitle;

  return (
    <header
      className={clsx(
        'h-14 sm:h-20 md:h-24 flex items-center justify-between px-3 sm:px-6 md:px-10 transition-all duration-500 sticky top-0 z-30 border-b backdrop-blur-xl',
        isDark
          ? 'bg-slate-950/70 border-white/10'
          : 'bg-white/80 border-gray-200'
      )}
    >
      <div className="space-y-1">
        <p className={clsx('hidden sm:block text-[10px] font-black uppercase tracking-[0.24em]', isDark ? 'text-violet-300' : 'text-violet-600')}>
           {headerSubtitle}
        </p>
        <h2 className={clsx('max-w-[9rem] truncate text-base sm:max-w-none sm:text-2xl md:text-3xl font-black tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>
          {headerTitle}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <div className={clsx('hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl border', isDark ? 'bg-white/5 border-white/10 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
           <div className="w-2 h-2 rounded-full bg-emerald-500" />
           <span className="text-[11px] font-semibold leading-none">All good</span>
        </div>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={clsx(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center transition-all duration-300 relative group overflow-hidden',
            isDark ? 'bg-white/5 text-amber-400 hover:bg-white/10' : 'bg-gray-100 text-indigo-600 hover:bg-gray-200'
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isDark ? 'sun' : 'moon'}
              initial={{ y: 20, rotate: -20, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              exit={{ y: -20, rotate: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {isDark ? <Sun className="w-5 h-5 fill-amber-400/20" /> : <Moon className="w-5 h-5 fill-indigo-500/20" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className={clsx(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center transition-all relative group',
            isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          <Bell className="w-5 h-5 group-hover:shake transition-transform" />
          <span className={clsx('absolute top-3 right-3 w-2.5 h-2.5 bg-violet-600 rounded-full border-2 shadow-lg shadow-violet-500/50', isDark ? 'border-[#0b0a12]' : 'border-white')} />
        </button>
      </div>
    </header>
  );
}
