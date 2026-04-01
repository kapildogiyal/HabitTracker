import { useLocation } from 'react-router-dom';
import { Sun, Moon, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s your progress.' },
  '/habits': { title: 'Habits', subtitle: 'Track your daily habits and build streaks.' },
  '/tasks': { title: 'Tasks', subtitle: 'Manage and prioritize your to-dos.' },
  '/analytics': { title: 'Analytics', subtitle: 'Visualize your productivity patterns.' },
  '/motivation': { title: 'Motivation', subtitle: 'Daily inspiration to keep you going.' },
  '/friends': { title: 'Friends', subtitle: 'Connect and keep each other accountable.' },
  '/challenges': { title: 'Challenges', subtitle: 'Push each other to stay consistent.' },
  '/settings': { title: 'Settings', subtitle: 'Customize your experience.' },
};

export default function TopBar() {
  const { isDark, toggle } = useThemeStore();
  const { pathname } = useLocation();
  const page = pageTitles[pathname] || { title: 'HabitTrack', subtitle: '' };

  return (
    <header
      className={clsx(
        'h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 border-b transition-colors duration-300 sticky top-0 z-30',
        isDark ? 'bg-[#0f0d1a]/80 border-[#2d2545] backdrop-blur-md' : 'bg-white/80 border-gray-200 backdrop-blur-md'
      )}
    >
      <div>
        <h2 className={clsx('text-base sm:text-lg font-semibold leading-none', isDark ? 'text-white' : 'text-gray-900')}>
          {page.title}
        </h2>
        <p className={clsx('text-[10px] sm:text-xs mt-0.5', isDark ? 'text-gray-500' : 'text-gray-500')}>
          {page.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggle}
          className={clsx(
            'relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors',
            isDark ? 'bg-white/5 text-amber-300 hover:bg-white/10' : 'bg-gray-100 text-indigo-600 hover:bg-gray-200'
          )}
          aria-label="Toggle theme"
        >
          <motion.div
            key={isDark ? 'sun' : 'moon'}
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </motion.div>
        </motion.button>

        {/* Notification Bell */}
        <button
          className={clsx(
            'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors relative',
            isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
