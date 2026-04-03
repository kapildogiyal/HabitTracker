import { apiSlice } from './apiSlice';

export const onboardingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: ['Onboarding', 'User'],
    }),
  }),
});

export const {
  useGetOnboardingStatusQuery,
  useSubmitOnboardingMutation,
} = onboardingApi;
