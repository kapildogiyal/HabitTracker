import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sun, Moon, Bell, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { selectCurrentUser } from '../../store/slices/authSlice';
import useThemeStore from '../../store/themeStore';
import { 
  useGetFriendRequestsQuery, 
  useAcceptFriendRequestMutation, 
  useRejectFriendRequestMutation 
} from '../../store/api/friendApi';
import toast from 'react-hot-toast';
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
  
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  
  const { data: requestsData } = useGetFriendRequestsQuery(undefined, { pollingInterval: 60000 });
  const [acceptRequest] = useAcceptFriendRequestMutation();
  const [rejectRequest] = useRejectFriendRequestMutation();
  
  const incoming = requestsData?.incoming || [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccept = async (id) => {
    try {
      await acceptRequest(id).unwrap();
      toast.success('Friend request accepted');
    } catch {
      toast.error('Could not accept request.');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequest(id).unwrap();
      toast.success('Friend request rejected');
    } catch {
      toast.error('Could not reject request.');
    }
  };

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
      <div className="space-y-1 flex-1 min-w-0 pr-2">
        <p className={clsx('hidden sm:block text-[10px] font-black uppercase tracking-[0.24em]', isDark ? 'text-violet-300' : 'text-violet-600')}>
           {headerSubtitle}
        </p>
        <h2 className={clsx('truncate text-base sm:text-2xl md:text-3xl font-black tracking-tight leading-none', isDark ? 'text-white' : 'text-gray-900')}>
          {headerTitle}
        </h2>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 shrink-0">
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
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className={clsx(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center transition-all relative group',
              isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            <Bell className="w-5 h-5 group-hover:shake transition-transform" />
            {incoming.length > 0 && (
              <span className={clsx('absolute top-3 right-3 w-2.5 h-2.5 bg-violet-600 rounded-full border-2 shadow-lg shadow-violet-500/50', isDark ? 'border-[#0b0a12]' : 'border-white')} />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  'absolute right-0 mt-3 w-72 sm:w-80 rounded-2xl border shadow-premium overflow-hidden origin-top-right',
                  isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'
                )}
              >
                <div className={clsx('px-4 py-3 border-b', isDark ? 'border-white/10' : 'border-gray-100')}>
                  <h3 className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-300' : 'text-gray-600')}>Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {incoming.length === 0 ? (
                    <div className="p-6 text-center opacity-50">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">No new notifications</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
                      {incoming.map((request) => (
                        <div key={request.requestId} className={clsx('p-4 transition-colors', isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-violet-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={clsx('text-sm font-black truncate', isDark ? 'text-white' : 'text-gray-900')}>{request.user?.name}</p>
                              <p className="text-[10px] font-bold opacity-60">Wants to add you as a friend</p>
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  type="button"
                                  onClick={() => handleAccept(request.requestId)}
                                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black transition-colors hover:bg-emerald-500/20"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(request.requestId)}
                                  className="flex-1 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black transition-colors hover:bg-rose-500/20"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
