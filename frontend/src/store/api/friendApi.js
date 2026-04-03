import { apiSlice } from './apiSlice';

export const friendApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFriends: builder.query({
      query: () => '/friends/list',
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.friends)) return response.friends;
        return [];
      },
      providesTags: ['Friends'],
    }),
    getFriendRequests: builder.query({
      query: () => '/friends/requests',
      transformResponse: (response) => ({
        incoming: Array.isArray(response?.incoming) ? response.incoming : [],
        outgoing: Array.isArray(response?.outgoing) ? response.outgoing : [],
      }),
      providesTags: ['Friends'],
    }),
    searchFriends: builder.query({
      query: (query) => `/friends/search?query=${encodeURIComponent(query)}`,
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.users)) return response.users;
        return [];
      },
    }),
    sendFriendRequest: builder.mutation({
      query: (friendId) => ({
        url: '/friends/request',
        method: 'POST',
        body: { friendId },
      }),
      invalidatesTags: ['Friends'],
    }),
    acceptFriendRequest: builder.mutation({
      query: (requestId) => ({
        url: '/friends/accept',
        method: 'POST',
        body: { requestId },
      }),
      invalidatesTags: ['Friends'],
    }),
    rejectFriendRequest: builder.mutation({
      query: (requestId) => ({
        url: '/friends/reject',
        method: 'POST',
        body: { requestId },
      }),
      invalidatesTags: ['Friends'],
    }),
    removeFriend: builder.mutation({
      query: (friendId) => ({
        url: '/friends/remove',
        method: 'POST',
        body: { friendId },
      }),
      invalidatesTags: ['Friends'],
    }),
  }),
});

export const {
  useGetFriendsQuery,
  useGetFriendRequestsQuery,
  useSearchFriendsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useRemoveFriendMutation,
} = friendApi;
