import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, selectIsAuthenticated } from '../../store/slices/authSlice';
import { useLoginMutation, useRegisterMutation } from '../../store/api/authApi';
import useThemeStore from '../../store/themeStore';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { isDark } = useThemeStore();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  const isLoading = isLoggingIn || isRegistering;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let result;
      if (isLogin) {
        result = await login({ email: formData.email, password: formData.password }).unwrap();
      } else {
        result = await register({ 
          name: formData.name, 
          email: formData.email, 
          password: formData.password 
        }).unwrap();
      }

      if (result.token) {
        dispatch(setCredentials({ 
          user: result.user, 
          token: result.token 
        }));
        toast.success(isLogin ? 'Welcome back!' : 'Account created. Welcome!');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err?.data?.message || 'Sign in failed. Please check your email and password.');
      toast.error('Sign in failed');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className={clsx('min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden', isDark ? 'bg-[#0a0910]' : 'bg-gray-50')}>
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={clsx(
          'w-full max-w-md p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative z-10 glass-card group',
          isDark ? 'shadow-black/50' : 'shadow-violet-500/10'
        )}
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex w-20 h-20 rounded-[2rem] bg-gradient-main items-center justify-center mb-6 shadow-xl shadow-violet-500/30"
          >
            <Flame className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className={clsx('text-3xl font-black tracking-tight mb-3', isDark ? 'text-white' : 'text-gray-900')}>
            HabitTrack <span className="text-violet-500">v2</span>
          </h1>
          <p className={clsx('text-xs font-black uppercase tracking-[0.3em] opacity-40', isDark ? 'text-gray-400' : 'text-gray-500')}>
            {isLogin ? 'Sign in' : 'Create account'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-rose-500/10 text-rose-500 p-4 rounded-[1.5rem] mb-8 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border border-rose-500/20"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="overflow-hidden"
              >
                <div className="relative group/input">
                  <UserIcon className={clsx('absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors', isDark ? 'text-gray-500 group-focus-within/input:text-violet-500' : 'text-gray-400 group-focus-within/input:text-violet-500')} />
                  <input
                    type="text"
                    required={!isLogin}
                    placeholder="Your name"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className={clsx(
                      'w-full pl-14 pr-6 py-4.5 rounded-2xl text-sm font-bold border outline-none transition-all',
                      isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500 focus:bg-white/10' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-violet-500 focus:bg-white'
                    )}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group/input">
            <Mail className={clsx('absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors', isDark ? 'text-gray-500 group-focus-within/input:text-violet-500' : 'text-gray-400 group-focus-within/input:text-violet-500')} />
            <input
              type="email"
              required
              placeholder="Email address"
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
              className={clsx(
                'w-full pl-14 pr-6 py-4.5 rounded-2xl text-sm font-bold border outline-none transition-all',
                isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500 focus:bg-white/10' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-violet-500 focus:bg-white'
              )}
            />
          </div>

          <div className="relative group/input">
            <Lock className={clsx('absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors', isDark ? 'text-gray-500 group-focus-within/input:text-violet-500' : 'text-gray-400 group-focus-within/input:text-violet-500')} />
            <input
              type="password"
              required
              placeholder="Password"
              value={formData.password}
              onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
              className={clsx(
                'w-full pl-14 pr-6 py-4.5 rounded-2xl text-sm font-bold border outline-none transition-all',
                isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500 focus:bg-white/10' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-violet-500 focus:bg-white'
              )}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-5 mt-10 relative overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-shimmer" />
            <span className="relative z-10">
               {isLoading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </span>
          </motion.button>
        </form>

        <div className="mt-10 text-center">
          <p className={clsx('text-[11px] font-black uppercase tracking-[0.2em]', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={toggleMode}
              className="ml-3 font-black text-violet-500 hover:text-violet-400 hover:underline transition-all"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
