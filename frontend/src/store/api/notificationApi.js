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
    getVapidPublicKey: builder.query({
      query: () => '/notifications/vapid-public-key',
    }),
  }),
});

export const {
  useSubscribeNotificationsMutation,
  useUnsubscribeNotificationsMutation,
  useLazyGetVapidPublicKeyQuery,
} = notificationApi;
