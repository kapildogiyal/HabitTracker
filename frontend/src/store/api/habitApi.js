import { apiSlice } from './apiSlice';

const getHabitId = (habit) => habit?._id ?? habit?.id;

export const habitApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHabits: builder.query({
      query: () => '/habits',
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.habits)) return response.habits;
        return [];
      },
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result
                .map((habit) => getHabitId(habit))
                .filter(Boolean)
                .map((id) => ({ type: 'Habits', id })),
              { type: 'Habits', id: 'LIST' },
            ]
          : [{ type: 'Habits', id: 'LIST' }],
    }),
    createHabit: builder.mutation({
      query: (data) => ({
        url: '/habits',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Habits', id: 'LIST' }],
    }),
    updateHabit: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/habits/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Habits', id }],
    }),
    deleteHabit: builder.mutation({
      query: (id) => ({
        url: `/habits/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Habits', id: 'LIST' }],
    }),
    logHabit: builder.mutation({
      query: (id) => ({
        url: `/habits/${id}/log`,
        method: 'POST',
      }),
      // Optimistic Update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          habitApi.util.updateQueryData('getHabits', undefined, (draft) => {
            if (!Array.isArray(draft)) return;
            const habit = draft.find((h) => getHabitId(h) === id);
            if (habit) {
              habit.completedToday = true;
              habit.currentStreak += 1;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Habits', id },
        { type: 'Analytics', id: 'SUMMARY' },
      ],
    }),
  }),
});

export const {
  useGetHabitsQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useDeleteHabitMutation,
  useLogHabitMutation,
} = habitApi;
