import { apiSlice } from './apiSlice';

export const challengeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChallenges: builder.query({
      query: () => '/challenges',
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.challenges)) return response.challenges;
        return [];
      },
      providesTags: ['Challenges'],
    }),
    createChallenge: builder.mutation({
      query: (data) => ({
        url: '/challenges',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Challenges'],
    }),
    joinChallenge: builder.mutation({
      query: (id) => ({
        url: '/challenges/join',
        method: 'POST',
        body: { challengeId: id },
      }),
      invalidatesTags: ['Challenges'],
    }),
    updateChallengeProgress: builder.mutation({
      query: (data) => ({
        url: '/challenges/progress',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Challenges', 'Leaderboard'],
    }),
    getLeaderboard: builder.query({
      query: (id) => `/challenges/${id}/leaderboard`,
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.leaderboard)) return response.leaderboard;
        return [];
      },
      providesTags: (result, error, id) => [{ type: 'Leaderboard', id }],
    }),
  }),
});

export const {
  useGetChallengesQuery,
  useCreateChallengeMutation,
  useJoinChallengeMutation,
  useUpdateChallengeProgressMutation,
  useGetLeaderboardQuery,
} = challengeApi;
