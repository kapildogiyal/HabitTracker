import { apiSlice } from './apiSlice';

export const moodApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
  useGetTodayMoodQuery,
  useSaveMoodMutation,
} = moodApi;
