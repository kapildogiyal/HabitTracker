import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('ht_user')) || null,
  isAuthenticated: !!localStorage.getItem('ht_token'),
  onboardingRequired: false,
  onboardingChecked: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      if (token) localStorage.setItem('ht_token', token);
      localStorage.setItem('ht_user', JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.onboardingRequired = false;
      state.onboardingChecked = false;
      localStorage.removeItem('ht_token');
      localStorage.removeItem('ht_user');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('ht_user', JSON.stringify(state.user));
    },
    setOnboarding: (state, action) => {
      state.onboardingRequired = action.payload;
      state.onboardingChecked = true;
    },
  },
});

export const { setCredentials, logout, updateUser, setOnboarding } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectOnboardingRequired = (state) => state.auth.onboardingRequired;
export const selectOnboardingChecked = (state) => state.auth.onboardingChecked;
