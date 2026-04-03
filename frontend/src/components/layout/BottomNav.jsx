import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Flame, CheckSquare, Settings, Users, Flag } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/challenges', icon: Flag, label: 'Goals' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const { isDark } = useThemeStore();

  return (
    <nav className={clsx(
      'fixed bottom-0 left-0 right-0 h-[4.75rem] sm:h-24 flex items-center justify-around px-1 sm:px-4 border-t z-40 lg:hidden transition-all duration-500 pb-[env(safe-area-inset-bottom)]',
      isDark ? 'bg-[#0f0d1a]/80 border-white/5 backdrop-blur-2xl' : 'bg-white/80 border-gray-100 backdrop-blur-2xl'
    )}>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center gap-1.5 flex-1 h-full relative transition-all duration-300',
              isActive ? 'text-violet-500' : isDark ? 'text-gray-500' : 'text-gray-400'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={clsx(
                'w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-300',
                isActive ? 'bg-violet-500/10' : 'group-hover:bg-white/5'
              )}>
                 <Icon className={clsx('w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-300', isActive && 'scale-110 shadow-glow')} />
              </div>
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.08em]">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute bottom-3 sm:bottom-4 w-1 h-1 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
