import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

// Layout
import Layout from './components/layout/Layout';
import Loader from './components/ui/Loader';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Tasks from './pages/Tasks';
import Analytics from './pages/Analytics';
import Motivation from './pages/Motivation';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Friends from './pages/Friends';
import Challenges from './pages/Challenges';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, onboardingRequired, onboardingChecked } = useAuthStore();
  const { isDark } = useThemeStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!onboardingChecked) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0f0d1a]' : 'bg-gray-50'}`}>
        <Loader />
      </div>
    );
  }
  if (onboardingRequired) return <Navigate to="/onboarding" replace />;
  return <Layout>{children}</Layout>;
};

const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, onboardingRequired, onboardingChecked } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (onboardingChecked && !onboardingRequired) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const { refreshUser, isLoading } = useAuthStore();
  const { apply, isDark } = useThemeStore();

  useEffect(() => {
    apply(); // Apply dark mode class to HTML
    const token = localStorage.getItem('ht_token');
    if (token) refreshUser();
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0f0d1a]' : 'bg-gray-50'}`}>
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
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/motivation" element={<ProtectedRoute><Motivation /></ProtectedRoute>} />
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
