import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User as UserIcon, Bell, Palette, Smartphone, Share2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { notificationAPI, authAPI } from '../../api/endpoints';
import Loader from '../../components/ui/Loader';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  
  const [form, setForm] = useState({
    username: user?.username || '',
    notifications: user?.settings?.notifications ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

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
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
    };

    checkSubscription();
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      toast.success('Notifications enabled!');
      setForm(f => ({ ...f, notifications: true }));
    } else {
      toast.error('Notification permission denied.');
      setForm(f => ({ ...f, notifications: false }));
    }
  };

  const sendTestNotification = () => {
    if (notificationPermission !== 'granted') return;
    
    new Notification('HabitTrack', {
      body: 'Everything is set up! Your daily roasts are on the way. 🔥',
      icon: '/icon-192.png'
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authAPI.updateProfile({ username: form.username });
      updateUser(res.data.user);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        toast.error('Service worker not supported in this browser');
        return;
      }

      if (notificationPermission !== 'granted') {
        await requestNotificationPermission();
        if (Notification.permission !== 'granted') return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        await notificationAPI.unsubscribe({ endpoint: existing.endpoint });
        await existing.unsubscribe();
        setIsSubscribed(false);
        setForm((prev) => ({ ...prev, notifications: false }));
        toast.success('Push notifications disabled');
        return;
      }

      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error('Missing VAPID public key');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await notificationAPI.subscribe(subscription);
      setIsSubscribed(true);
      setForm((prev) => ({ ...prev, notifications: true }));
      toast.success('Push notifications enabled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update push notifications');
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-20">
      <div>
        <h2 className={clsx('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Settings</h2>
        <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>Manage your account and PWA preferences.</p>
      </div>

      <div className={clsx('rounded-3xl border overflow-hidden', isDark ? 'bg-[#1a1628] border-[#2d2545]' : 'bg-white border-gray-200 shadow-xl shadow-gray-100')}>
        <form onSubmit={handleSave}>
          {/* Profile Section */}
          <div className="p-8 border-b border-inherit">
            <h3 className={clsx('text-lg font-semibold flex items-center gap-2 mb-6', isDark ? 'text-white' : 'text-gray-900')}>
              <UserIcon className="w-5 h-5 text-violet-500" /> Profile
            </h3>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-violet-500/25">
                {form.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="space-y-1">
                <p className={clsx('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>Avatar</p>
                <button type="button" className={clsx('text-xs px-4 py-2 rounded-xl border font-bold transition-all', isDark ? 'border-white/10 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600')}>
                  Change Avatar
                </button>
              </div>
            </div>

            <div className="max-w-md space-y-5">
              <div>
                <label className={clsx('text-xs font-black uppercase tracking-widest block mb-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className={clsx('w-full px-4 py-3 rounded-2xl text-sm border outline-none transition-all', isDark ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-400')}
                />
              </div>
              <div>
                <label className={clsx('text-xs font-black uppercase tracking-widest block mb-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Email (Read-only)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className={clsx('w-full px-4 py-3 rounded-2xl text-sm border outline-none opacity-60 cursor-not-allowed', isDark ? 'bg-black/20 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-gray-900')}
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="p-8 border-b border-inherit space-y-8">
            <h3 className={clsx('text-lg font-semibold flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
              <Palette className="w-5 h-5 text-cyan-500" /> Preferences
            </h3>
            
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className={clsx('font-bold', isDark ? 'text-white' : 'text-gray-900')}>Dark Mode</p>
                <p className={clsx('text-xs mt-0.5 font-medium', isDark ? 'text-gray-500' : 'text-gray-400')}>Seamless theme switching.</p>
              </div>
              <button
                type="button"
                onClick={toggle}
                className={clsx('relative w-12 h-6 rounded-full transition-colors', isDark ? 'bg-violet-500' : 'bg-gray-300')}
              >
                <motion.div
                  className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{ x: isDark ? 24 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between max-w-md">
              <div className="mr-4">
                <p className={clsx('font-bold flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
                  <Bell className={clsx('w-4 h-4', isSubscribed ? 'text-emerald-500' : 'text-gray-400')} /> 
                  Push Notifications
                </p>
                <p className={clsx('text-xs mt-0.5 font-medium', isDark ? 'text-gray-500' : 'text-gray-400')}>
                  {notificationPermission === 'granted' 
                    ? 'Permissions granted! Time to level up.' 
                    : 'Get daily reminders even when the app is closed.'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {notificationPermission === 'granted' && (
                  <button
                    type="button"
                    onClick={sendTestNotification}
                    className="text-[10px] font-black uppercase tracking-widest text-violet-500 hover:text-violet-400 underline underline-offset-4"
                  >
                    Test
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePushToggle}
                  className={clsx('relative w-12 h-6 rounded-full transition-colors', isSubscribed ? 'bg-emerald-500' : isDark ? 'bg-white/10' : 'bg-gray-300')}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: isSubscribed ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* PWA Section */}
          <div className="p-8 space-y-6">
             <h3 className={clsx('text-lg font-semibold flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
                <Smartphone className="w-5 h-5 text-amber-500" /> App Experience
             </h3>
             <div className="flex items-center justify-between max-w-md p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-start gap-3">
                   <div className="p-2 bg-amber-500/10 rounded-xl"><Share2 className="w-4 h-4 text-amber-500" /></div>
                   <div>
                      <p className={clsx('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Installable PWA</p>
                      <p className={clsx('text-[10px] mt-0.5 font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>Use "Add to Home Screen" for a native experience.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Action Footer */}
          <div className={clsx('p-8 flex justify-end', isDark ? 'bg-black/20' : 'bg-gray-50')}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-black shadow-xl shadow-violet-500/25 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest"
            >
              {isSaving ? <Loader /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Updating...' : 'Save Settings'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
