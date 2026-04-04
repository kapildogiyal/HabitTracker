import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: { 
          ...credentials, 
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
        },
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: { 
          ...userData, 
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
        },
      }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: { 
          ...data, 
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
        },
      }),
      invalidatesTags: ['User'],
    }),
    getOnboardingStatus: builder.query({
      query: () => '/onboarding/status',
      providesTags: ['Onboarding'],
    }),
    submitOnboarding: builder.mutation({
      query: (data) => ({
        url: '/onboarding/submit',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useGetOnboardingStatusQuery,
  useSubmitOnboardingMutation,
} = authApi;
