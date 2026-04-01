import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Flame, CheckSquare, BarChart3,
  Sparkles, Settings, LogOut, Zap, Trophy, Users, Flag
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/motivation', icon: Sparkles, label: 'Motivation' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/challenges', icon: Flag, label: 'Challenges' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const colorMap = {
  violet: 'from-violet-500 to-indigo-500',
  indigo: 'from-indigo-500 to-blue-500',
  cyan: 'from-cyan-500 to-blue-500',
  emerald: 'from-emerald-500 to-teal-500',
  rose: 'from-rose-500 to-pink-500',
  amber: 'from-amber-500 to-orange-500',
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();

  const xp = user?.xp || 0;
  const level = user?.level || 'Beginner';

  // Dynamic XP Progress calculation based on Rank Thresholds
  const getXPProgress = () => {
    if (level === 'Beginner') return Math.min((xp / 100) * 100, 100);
    if (level === 'Consistent') return Math.min(((xp - 100) / 200) * 100, 100);
    if (level === 'Focused') return Math.min(((xp - 300) / 300) * 100, 100);
    return 100; // Discipline Master is max rank
  };

  const getNextXP = () => {
    if (level === 'Beginner') return '100 XP';
    if (level === 'Consistent') return '300 XP';
    if (level === 'Focused') return '600 XP';
    return 'MAX';
  };

  const xpProgress = getXPProgress();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={clsx(
        'fixed left-0 top-0 h-screen w-64 flex flex-col z-40 border-r transition-colors duration-300',
        isDark
          ? 'bg-[#0f0d1a] border-[#2d2545]'
          : 'bg-white border-gray-200'
      )}
    >
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={clsx('font-bold text-lg leading-none', isDark ? 'text-white' : 'text-gray-900')}>
              HabitTrack
            </h1>
            <p className={clsx('text-xs', isDark ? 'text-violet-400' : 'text-violet-600')}>
              Level up your life
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-5 h-5 shrink-0', isActive ? 'text-white' : '')} />
                <span className="text-sm font-medium">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 -z-10"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile + XP */}
      <div className={clsx('p-4 border-t', isDark ? 'border-[#2d2545]' : 'border-gray-200')}>
        {/* XP Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-white' : 'text-gray-900')}>
                {level}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-violet-400" />
              <span className={clsx('text-[10px] font-bold', isDark ? 'text-gray-500' : 'text-gray-400')}>
                {xp} / {getNextXP()}
              </span>
            </div>
          </div>
          <div className={clsx('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400"
            />
          </div>
        </div>

        {/* User info + logout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                {user?.name || 'User'}
              </p>
              <p className={clsx('text-xs truncate', isDark ? 'text-gray-500' : 'text-gray-400')}>
                {xp} XP total
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              isDark ? 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'
            )}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
