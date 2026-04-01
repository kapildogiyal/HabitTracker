import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, onboardingAPI } from '../api/endpoints';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      onboardingRequired: false,
      onboardingChecked: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authAPI.login({ email, password });
          const { token, user } = res.data;
          localStorage.setItem('ht_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          await get().checkOnboarding();
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || 'Login failed' };
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const res = await authAPI.register({ name, email, password });
          const { token, user } = res.data;
          localStorage.setItem('ht_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          await get().checkOnboarding();
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || 'Registration failed' };
        }
      },

      logout: () => {
        localStorage.removeItem('ht_token');
        set({ user: null, token: null, isAuthenticated: false, onboardingRequired: false, onboardingChecked: false });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      refreshUser: async () => {
        try {
          const res = await authAPI.getMe();
          set({ user: res.data.user });
          await get().checkOnboarding();
        } catch {
          get().logout();
        }
      },

      checkOnboarding: async () => {
        try {
          const res = await onboardingAPI.getStatus();
          set({ onboardingRequired: res.data.required, onboardingChecked: true });
        } catch {
          set({ onboardingRequired: false, onboardingChecked: true });
        }
      },

      setOnboardingRequired: (value) => set({ onboardingRequired: value, onboardingChecked: true }),
    }),
    {
      name: 'ht-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
