import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  const { login, register, isLoading, isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    let res;
    if (isLogin) {
      res = await login(formData.email, formData.password);
    } else {
      res = await register(formData.name, formData.email, formData.password); // Updated to use name instead of username to match new schema
    }

    if (!res.success) {
      setError(res.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className={clsx('min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden', isDark ? 'bg-[#0f0d1a]' : 'bg-gray-50')}>
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
          'w-full max-w-md p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 border',
          isDark ? 'bg-[#1a1628]/80 backdrop-blur-xl border-white/5 shadow-black/50' : 'bg-white/80 backdrop-blur-xl border-gray-200 shadow-xl'
        )}
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className={clsx('text-2xl font-bold tracking-tight mb-2', isDark ? 'text-white' : 'text-gray-900')}>
            Welcome to HabitTrack
          </h1>
          <p className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
            {isLogin ? 'Log in to continue your journey.' : 'Create an account to level up your life.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 text-rose-500 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 border border-rose-500/20"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <UserIcon className={clsx('absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5', isDark ? 'text-gray-500' : 'text-gray-400')} />
                  <input
                    type="text"
                    required={!isLogin}
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className={clsx(
                      'w-full pl-12 pr-4 py-3.5 rounded-xl text-sm border outline-none transition-all',
                      isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:bg-white'
                    )}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className={clsx('absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5', isDark ? 'text-gray-500' : 'text-gray-400')} />
            <input
              type="email"
              required
              placeholder="Email address"
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
              className={clsx(
                'w-full pl-12 pr-4 py-3.5 rounded-xl text-sm border outline-none transition-all',
                isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:bg-white'
              )}
            />
          </div>

          <div className="relative">
            <Lock className={clsx('absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5', isDark ? 'text-gray-500' : 'text-gray-400')} />
            <input
              type="password"
              required
              placeholder="Password"
              value={formData.password}
              onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
              className={clsx(
                'w-full pl-12 pr-4 py-3.5 rounded-xl text-sm border outline-none transition-all',
                isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:bg-white'
              )}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/25 mt-6 disabled:opacity-75"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={toggleMode}
              className="ml-2 font-semibold text-violet-500 hover:text-violet-400 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
