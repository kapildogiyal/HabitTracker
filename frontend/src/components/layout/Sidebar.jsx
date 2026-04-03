import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Flame, CheckSquare,
  Settings, Zap, Users, Flag, Crown
} from 'lucide-react';
import { selectCurrentUser } from '../../store/slices/authSlice';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/challenges', icon: Flag, label: 'Challenges' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { isDark } = useThemeStore();
  const user = useSelector(selectCurrentUser);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={clsx(
        'fixed left-0 top-0 h-screen w-60 flex flex-col z-40 border-r transition-colors duration-300',
        isDark
          ? 'bg-gradient-to-b from-slate-900 via-[#0f172a] to-[#0b1220] border-white/10'
          : 'bg-gradient-to-b from-white via-violet-50/40 to-white border-gray-200'
      )}
    >
      {/* Branding */}
      <div className={clsx('p-5 border-b', isDark ? 'border-white/10' : 'border-gray-200')}>
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20',
            isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'
          )}>
             <Zap className="w-5 h-5 text-violet-500" />
          </div>
          <div className="min-w-0">
            <h1 className={clsx('truncate font-black text-lg tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>
              HabitTrack
            </h1>
            <p className={clsx('truncate text-[10px] font-semibold mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
               Build better routines
            </p>
          </div>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group border',
                isActive
                  ? 'text-white bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-400/20 shadow-lg shadow-violet-500/20'
                  : isDark
                    ? 'text-slate-300 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
                    : 'text-gray-700 border-transparent hover:text-gray-900 hover:bg-violet-50 hover:border-violet-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-white/15'
                    : isDark ? 'bg-white/5 group-hover:bg-white/10' : 'bg-gray-100 group-hover:bg-violet-100'
                )}>
                  <Icon className={clsx('w-4.5 h-4.5 transition-transform duration-200', isActive ? 'scale-105 text-white' : 'group-hover:scale-105')} />
                </div>
                <span className="text-sm font-semibold tracking-wide relative z-10 truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <div className={clsx(
          'rounded-[1.75rem] border p-4',
          isDark ? 'bg-white/5 border-white/10' : 'bg-violet-50 border-violet-100'
        )}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className={clsx('truncate text-sm font-black', isDark ? 'text-white' : 'text-gray-900')}>
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                <Crown className="w-3.5 h-3.5" />
                <span>{user?.level || 'Beginner'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
