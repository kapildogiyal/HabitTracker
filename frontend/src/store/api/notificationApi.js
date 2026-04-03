import { apiSlice } from './apiSlice';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    subscribeNotifications: builder.mutation({
      query: (subscription) => ({
        url: '/notifications/subscribe',
        method: 'POST',
        body: subscription,
      }),
    }),
    unsubscribeNotifications: builder.mutation({
      query: (data) => ({
        url: '/notifications/unsubscribe',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useSubscribeNotificationsMutation,
  useUnsubscribeNotificationsMutation,
} = notificationApi;
