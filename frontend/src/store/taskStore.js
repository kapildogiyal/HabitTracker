import { create } from 'zustand';
import { tasksAPI } from '../api/endpoints';
import toast from 'react-hot-toast';

const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  filter: 'all', // 'all' | 'todo' | 'inprogress' | 'done'

  setFilter: (filter) => set({ filter }),

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const res = await tasksAPI.getAll();
      set({ tasks: res.data.tasks, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  createTask: async (data) => {
    try {
      const res = await tasksAPI.create(data);
      set((state) => ({ tasks: [res.data.task, ...state.tasks] }));
      toast.success('Task added! 📋');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
      return { success: false };
    }
  },

  updateTask: async (id, data) => {
    try {
      const res = await tasksAPI.update(id, data);
      set((state) => ({
        tasks: state.tasks.map((t) => t._id === id ? res.data.task : t),
      }));
      toast.success('Task updated!');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
      return { success: false };
    }
  },

  deleteTask: async (id) => {
    try {
      await tasksAPI.delete(id);
      set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) }));
      toast.success('Task removed');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  },

  toggleTask: async (id, updateUser) => {
    try {
      const res = await tasksAPI.toggle(id);
      set((state) => ({
        tasks: state.tasks.map((t) => t._id === id ? res.data.task : t),
      }));
      if (updateUser) updateUser(res.data.user);
      const msg = res.data.task.completed ? '🎯 Task done! +20 XP' : 'Task reopened';
      toast.success(msg);
    } catch (err) {
      toast.error('Failed to toggle task');
    }
  },

  controlTimer: async (id, action) => {
    try {
      const res = await tasksAPI.controlTimer(id, action);
      set((state) => ({
        tasks: state.tasks.map((t) => t._id === id ? res.data.task : t),
      }));
    } catch (err) {
      toast.error('Failed to control task timer');
    }
  },

  filteredTasks: () => {
    const { tasks, filter } = get();
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.status === filter);
  },
}));

export default useTaskStore;
