import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Flame, CheckSquare, Sparkles, Settings, Users, Flag } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/motivation', icon: Sparkles, label: 'AI' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/challenges', icon: Flag, label: 'Challenges' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const { isDark } = useThemeStore();

  return (
    <nav className={clsx(
      'fixed bottom-0 left-0 right-0 h-14 sm:h-16 flex items-center justify-around px-3 sm:px-4 border-t z-40 lg:hidden transition-colors duration-300',
      isDark ? 'bg-[#0f0d1a]/95 border-[#2d2545] backdrop-blur-lg' : 'bg-white/95 border-gray-200 backdrop-blur-lg'
    )}>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center gap-1 flex-1 h-full relative',
              isActive ? 'text-violet-500' : isDark ? 'text-gray-500' : 'text-gray-400'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={clsx('w-4 h-4 sm:w-5 sm:h-5 transition-transform', isActive && 'scale-110')} />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-[1px] left-1/4 right-1/4 h-[2px] bg-violet-500 rounded-full"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
