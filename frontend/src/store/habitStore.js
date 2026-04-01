import { create } from 'zustand';
import { habitsAPI } from '../api/endpoints';
import toast from 'react-hot-toast';

const useHabitStore = create((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await habitsAPI.getAll();
      set({ habits: res.data.habits, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load habits', isLoading: false });
    }
  },

  createHabit: async (data) => {
    try {
      const res = await habitsAPI.create(data);
      set((state) => ({ habits: [res.data.habit, ...state.habits] }));
      toast.success('Habit created! 🎉');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create habit');
      return { success: false };
    }
  },

  updateHabit: async (id, data) => {
    try {
      const res = await habitsAPI.update(id, data);
      set((state) => ({
        habits: state.habits.map((h) => h._id === id ? { ...res.data.habit, completedToday: h.completedToday } : h),
      }));
      toast.success('Habit updated!');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update habit');
      return { success: false };
    }
  },

  deleteHabit: async (id) => {
    try {
      await habitsAPI.delete(id);
      set((state) => ({ habits: state.habits.filter((h) => h._id !== id) }));
      toast.success('Habit removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete habit');
    }
  },

  logHabit: async (id, updateUser, progress = undefined) => {
    try {
      const payload = progress !== undefined ? { progress } : {};
      const res = await habitsAPI.log(id, payload);
      set((state) => ({
        habits: state.habits.map((h) =>
          h._id === id ? { ...res.data.habit, completedToday: res.data.completedToday, progressToday: res.data.progressToday } : h
        ),
      }));
      if (updateUser && res.data.user) updateUser(res.data.user);
      const msg = res.data.completedToday ? '✅ Habit completed! +10 XP' : 'Progress logged!';
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log habit');
    }
  },
}));

export default useHabitStore;
