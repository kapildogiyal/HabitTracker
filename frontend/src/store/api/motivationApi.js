import { apiSlice } from './apiSlice';

export const motivationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMotivation: builder.query({
      query: (params = {}) => ({
        url: '/motivation/generate',
        params: {
          refreshAt: params.refreshAt || Date.now(),
          previousQuote: params.previousQuote || '',
        },
      }),
      providesTags: ['Motivation'],
    }),
    getTodayMood: builder.query({
      query: () => '/mood/today',
      providesTags: ['Mood'],
    }),
    saveMood: builder.mutation({
      query: (mood) => ({
        url: '/mood',
        method: 'POST',
        body: { mood },
      }),
      invalidatesTags: ['Mood'],
    }),
  }),
});

export const {
  useGetMotivationQuery,
  useGetTodayMoodQuery,
  useSaveMoodMutation,
} = motivationApi;
