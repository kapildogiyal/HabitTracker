import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('ht_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Handle unauthorized - clear token and redirect
    localStorage.removeItem('ht_token');
    localStorage.removeItem('ht_user');
    window.location.href = '/login';
  }
  
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Habits', 'Tasks', 'User', 'Analytics', 'Motivation', 'Mood', 'Challenges', 'Leaderboard', 'Friends', 'Onboarding'],
  endpoints: () => ({}),
});
