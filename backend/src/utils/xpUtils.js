import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import Task from '../models/Task.js';
import PerfectDay from '../models/PerfectDay.js';

const toDayString = (date) => new Date(date).toISOString().split('T')[0];

const isSameDay = (left, right) => {
  if (!left || !right) return false;
  return toDayString(left) === toDayString(right);
};

export const applyPerfectDayBonus = async (user, now = new Date()) => {
  if (!user) return false;
  const dateKey = toDayString(now);
  if (user.lastPerfectDayAt && isSameDay(user.lastPerfectDayAt, now)) return false;

  const existing = await PerfectDay.findOne({ userId: user._id, date: dateKey });
  if (existing?.completed) return false;

  const habits = await Habit.find({ userId: user._id, isActive: true }).select('_id');
  const habitIds = habits.map((habit) => habit._id);
  const tasksTotal = await Task.countDocuments({ userId: user._id });
  const tasksRemaining = await Task.countDocuments({ userId: user._id, completed: false });

  const totalItems = habitIds.length + tasksTotal;
  if (totalItems === 0) return false;

  const today = dateKey;
  const completedHabits = habitIds.length
    ? await HabitLog.countDocuments({
        userId: user._id,
        habitId: { $in: habitIds },
        date: today,
        completed: true,
      })
    : 0;

  const habitsComplete = habitIds.length === 0 ? true : completedHabits >= habitIds.length;
  const tasksComplete = tasksRemaining === 0;

  if (!habitsComplete || !tasksComplete) return false;

  user.xp += 20;
  user.lastPerfectDayAt = now;
  await PerfectDay.findOneAndUpdate(
    { userId: user._id, date: dateKey },
    { userId: user._id, date: dateKey, completed: true },
    { upsert: true, new: true }
  );
  return true;
};
