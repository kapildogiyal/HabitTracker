import { apiSlice } from './apiSlice';

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSummary: builder.query({
      query: () => '/analytics/summary',
      providesTags: (result) => [{ type: 'Analytics', id: 'SUMMARY' }],
    }),
    getHeatmap: builder.query({
      query: (month) => ({
        url: '/analytics/heatmap',
        params: { month },
      }),
      providesTags: (result, error, month) => [{ type: 'Analytics', id: `HEATMAP-${month}` }],
    }),
  }),
});

export const { useGetSummaryQuery, useGetHeatmapQuery } = analyticsApi;
