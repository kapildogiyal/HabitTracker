import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User as UserIcon, Bell, Palette, Shield, Zap, Globe, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetMeQuery, useUpdateProfileMutation } from '../../store/api/authApi';
import { useSubscribeNotificationsMutation, useUnsubscribeNotificationsMutation } from '../../store/api/notificationApi';
import { logout } from '../../store/slices/authSlice';
import useThemeStore from '../../store/themeStore';
import usePWAStore from '../../store/pwaStore';
import Loader from '../../components/ui/Loader';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: user, isLoading: isLoadingUser } = useGetMeQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [subscribe] = useSubscribeNotificationsMutation();
  const [unsubscribe] = useUnsubscribeNotificationsMutation();
  const { isDark, toggle } = useThemeStore();
  const { isInstallable, deferredPrompt, clearDeferredPrompt } = usePWAStore();
  
  const [form, setForm] = useState({
    username: null,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const usernameValue = form.username ?? user?.username ?? '';

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(Boolean(subscription));
        }
      } catch (err) {
        console.error('Failed to check push subscription', err);
      }
    };

    checkSubscription();
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    return permission;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ username: usernameValue }).unwrap();
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error?.data?.message || 'Could not save profile.');
    }
  };

  const handlePushToggle = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        toast.error('Push notifications are not supported here.');
        return;
      }

      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
          toast.error('Notification permission was blocked.');
          return;
      }

      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        try {
          // Manual fallback for development mode if virtual:pwa-register failed
          registration = await navigator.serviceWorker.register(
            import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js', 
            { type: import.meta.env.DEV ? 'module' : 'classic' }
          );
          registration = await navigator.serviceWorker.ready;
        } catch (e) {
          console.error("SW Registration failed:", e);
        }
      }

      if (!registration) {
        toast.error('Error: Service Worker could not be registered. Check console.');
        return;
      }

      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        await unsubscribe({ endpoint: existing.endpoint }).unwrap();
        await existing.unsubscribe();
        setIsSubscribed(false);
        toast.success('Notifications turned off');
        return;
      }

      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error('Notification key is missing.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await subscribe(subscription).unwrap();
      setIsSubscribed(true);
      toast.success('Notifications turned on');
    } catch (error) {
      toast.error('Could not update notifications.');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      clearDeferredPrompt();
    }
  };

  if (isLoadingUser) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8 sm:space-y-12 p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-12 sm:pb-20 mesh-gradient rounded-[2rem] sm:rounded-[4rem]">
      {/* Header */}
      <div className="space-y-2 px-4 text-center sm:text-left">
           <p className={clsx('text-[10px] font-black uppercase tracking-[0.4em]', isDark ? 'text-indigo-400' : 'text-indigo-600')}>Your account</p>
           <h2 className={clsx('text-4xl sm:text-5xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Settings</h2>
           <p className={clsx('text-sm lg:text-base font-bold opacity-50', isDark ? 'text-gray-300' : 'text-gray-600')}>
              Update your profile, theme, and notifications.
           </p>
      </div>

      <div className={clsx('rounded-[2rem] sm:rounded-[3.5rem] border overflow-hidden glass-card transition-all', isDark ? 'bg-white/[0.02]' : 'bg-white')}>
        <form onSubmit={handleSave}>
          <div className="grid md:grid-cols-[1fr_2fr] divide-y md:divide-y-0 md:divide-x divide-white/5">
             {/* Profile Preview */}
             <div className="p-5 sm:p-10 flex flex-col items-center gap-6 sm:gap-8 justify-center bg-black/5">
                <div className="relative group">
                   <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[1.6rem] sm:rounded-[2.8rem] bg-gradient-main flex items-center justify-center text-3xl sm:text-4xl font-black text-white shadow-2xl shadow-violet-500/30">
                     {form.username?.[0]?.toUpperCase() || 'O'}
                   </div>
                   <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-cyan-500 border-4 border-[#0b0a12] flex items-center justify-center shadow-lg">
                      <Zap className="w-5 h-5 text-white" />
                   </div>
                </div>
                <div className="text-center">
                   <p className={clsx('text-lg font-black', isDark ? 'text-white' : 'text-gray-900')}>{user?.name}</p>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">@{user?.username}</p>
                </div>
             </div>

             {/* Form Content */}
             <div className="p-5 sm:p-10 md:p-12 space-y-8 sm:space-y-12">
                {/* Identity */}
                <section className="space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                         <UserIcon className="w-4 h-4 text-violet-500" />
                      </div>
                      <h3 className={clsx('text-sm font-black uppercase tracking-widest', isDark ? 'text-gray-300' : 'text-gray-700')}>Profile</h3>
                   </div>
                   
                   <div className="grid gap-6">
                      <div className="space-y-3">
                         <label className="app-label ml-4">Username</label>
                         <input
                           type="text"
                           value={usernameValue}
                           onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                           className="app-input"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="app-label ml-4">Email</label>
                         <div className={clsx('w-full px-8 py-4 rounded-[2rem] text-sm font-black border-2 opacity-40 flex items-center gap-3', isDark ? 'bg-black/20 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-gray-600')}>
                            <Shield className="w-4 h-4" />
                            {user?.email}
                         </div>
                      </div>
                   </div>
                </section>

                {/* Environment */}
                <section className="space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                         <Palette className="w-4 h-4 text-cyan-500" />
                      </div>
                      <h3 className={clsx('text-sm font-black uppercase tracking-widest', isDark ? 'text-gray-300' : 'text-gray-700')}>Theme</h3>
                   </div>

                   <div className="flex items-center justify-between p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white/5 border border-white/5">
                      <div>
                         <p className={clsx('text-sm font-black', isDark ? 'text-white' : 'text-gray-900')}>Dark mode</p>
                         <p className="text-[10px] opacity-40 font-bold">Use dark colors for low light.</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggle}
                        className={clsx('relative w-14 h-8 rounded-full transition-all p-1', isDark ? 'bg-violet-600' : 'bg-gray-300')}
                      >
                         <motion.div
                           animate={{ x: isDark ? 24 : 0 }}
                           className="w-6 h-6 rounded-full bg-white shadow-lg"
                         />
                      </button>
                   </div>
                </section>

                {/* Terminal Broadcast */}
                <section className="space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                         <Bell className="w-4 h-4 text-amber-500" />
                      </div>
                      <h3 className={clsx('text-sm font-black uppercase tracking-widest', isDark ? 'text-gray-300' : 'text-gray-700')}>Notifications</h3>
                   </div>

                   <div className="flex items-center justify-between p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white/5 border border-white/5">
                      <div>
                         <p className={clsx('text-sm font-black', isDark ? 'text-white' : 'text-gray-900')}>Push notifications</p>
                         <p className="text-[10px] opacity-40 font-bold">Get reminders and motivation updates.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePushToggle}
                        className={clsx('relative w-14 h-8 rounded-full transition-all p-1', isSubscribed ? 'bg-emerald-500' : 'bg-gray-300')}
                      >
                         <motion.div
                           animate={{ x: isSubscribed ? 24 : 0 }}
                           className="w-6 h-6 rounded-full bg-white shadow-lg"
                         />
                      </button>
                   </div>
                </section>

                {/* Intelligence Port */}
                {isInstallable && (
                   <section className="space-y-6">
                      <div onClick={handleInstall} className="p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-4 sm:gap-6 cursor-pointer hover:bg-indigo-500/20 transition-colors">
                         <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Globe className="w-7 h-7 text-white" />
                         </div>
                         <div>
                            <p className={clsx('text-sm font-black', isDark ? 'text-white' : 'text-gray-900')}>Install this app</p>
                            <p className="text-[10px] opacity-50 font-bold">Add HabitTrack to your home screen.</p>
                         </div>
                      </div>
                   </section>
                )}
             </div>
          </div>

          {/* Actions */}
          <div className="p-4 sm:p-8 sm:px-12 border-t border-white/5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 bg-black/20">
             <motion.button
               whileHover={{ scale: 1.03 }}
               whileTap={{ scale: 0.97 }}
               type="button"
               onClick={handleLogout}
               className="btn-danger"
             >
               <LogOut className="w-4 h-4" /> Log out
             </motion.button>
             <motion.button
               whileHover={{ scale: 1.05, y: -2 }}
               whileTap={{ scale: 0.95 }}
               type="submit"
               disabled={isUpdating}
               className="btn-primary w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5"
             >
               {isUpdating ? 'Saving...' : <><Save className="w-4 h-4" /> Save changes</>}
             </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
