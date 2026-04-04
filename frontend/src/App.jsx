import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectIsAuthenticated,
  selectOnboardingRequired,
  selectOnboardingChecked,
  setOnboarding,
  logout,
} from './store/slices/authSlice';
import { useGetMeQuery, useGetOnboardingStatusQuery } from './store/api/authApi';
import useThemeStore from './store/themeStore';
import usePWAStore from './store/pwaStore';

// Layout
import Layout from './components/layout/Layout';
import Loader from './components/ui/Loader';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Friends from './pages/Friends';
import Challenges from './pages/Challenges';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const onboardingRequired = useSelector(selectOnboardingRequired);
  const onboardingChecked = useSelector(selectOnboardingChecked);
  const { isDark } = useThemeStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (!onboardingChecked) {
    return (
      <div className={`min-h-[100dvh] flex items-center justify-center ${isDark ? 'bg-[#0a0910]' : 'bg-gray-50'}`}>
        <Loader />
      </div>
    );
  }
  
  if (onboardingRequired) return <Navigate to="/onboarding" replace />;
  return <Layout>{children}</Layout>;
};

const OnboardingRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const onboardingRequired = useSelector(selectOnboardingRequired);
  const onboardingChecked = useSelector(selectOnboardingChecked);
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (onboardingChecked && !onboardingRequired) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { apply, isDark } = useThemeStore();
  const setDeferredPrompt = usePWAStore((state) => state.setDeferredPrompt);

  // RTK Query hooks for initial data sync
  const { isError: meError, isLoading: meLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  
  const { data: onboardingData, isLoading: onboardingLoading } = useGetOnboardingStatusQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    apply(); // Apply dark mode class to HTML
  }, [apply]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setDeferredPrompt]);

  useEffect(() => {
    if (onboardingData) {
      dispatch(setOnboarding(onboardingData.required));
    }
  }, [onboardingData, dispatch]);

  useEffect(() => {
    if (meError) {
      dispatch(logout());
    }
  }, [meError, dispatch]);

  if (isAuthenticated && (meLoading || onboardingLoading)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0910]' : 'bg-gray-50'}`}>
        <Loader />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? '#1a1628' : '#fff',
            color: isDark ? '#fff' : '#111',
            border: `1px solid ${isDark ? '#2d2545' : '#e5e7eb'}`,
            borderRadius: '1rem',
            padding: '1rem 1.5rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '11px',
          }
        }}
      />
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/motivation" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
