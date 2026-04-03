import { apiSlice } from './apiSlice';

const getTaskId = (task) => task?._id ?? task?.id;

export const taskApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (params) => ({
        url: '/tasks',
        params,
      }),
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.tasks)) return response.tasks;
        return [];
      },
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result
                .map((task) => getTaskId(task))
                .filter(Boolean)
                .map((id) => ({ type: 'Tasks', id })),
              { type: 'Tasks', id: 'LIST' },
            ]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),
    createTask: builder.mutation({
      query: (data) => ({
        url: '/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Tasks', id }],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
    }),
    toggleTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}/complete`,
        method: 'PATCH',
      }),
      // Optimistic Update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
            if (!Array.isArray(draft)) return;
            const task = draft.find((t) => getTaskId(t) === id);
            if (task) {
              task.completed = !task.completed;
              task.updatedAt = new Date().toISOString();
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
        { type: 'Tasks', id },
        { type: 'Analytics', id: 'SUMMARY' },
      ],
    }),
    controlTimer: builder.mutation({
      query: ({ id, action }) => ({
        url: `/tasks/${id}/timer`,
        method: 'PATCH',
        body: { action },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useToggleTaskMutation,
  useControlTimerMutation,
} = taskApi;
