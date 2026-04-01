import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Mood from '../models/Mood.js';
import { startOfDay, endOfDay } from '../utils/timeUtils.js';
import { getTodayString, getLast7Days, getLast30Days } from '../utils/dateUtils.js';

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
// @desc    Get comprehensive analytics dashboard
// @route   GET /api/analytics/summary
export const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Fetch base data
    const [habits, allTasks, allLogs, user, moods] = await Promise.all([
      Habit.find({ userId }),
      Task.find({ userId }),
      HabitLog.find({ userId }),
      User.findById(userId),
      Mood.find({ userId }),
    ]);

    // Helper: format YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];
    const todayStr = formatDate(now);

    // Filter Tasks simply by completion date (assuming updated recently = completedAt)
    // To be accurate, we need a completedAt field on Task. If not present, fallback to updatedAt if completed
    const tasks = allTasks.map(t => ({
      ...t.toObject(),
      completedDate: t.completed ? formatDate(t.updatedAt) : null,
    }));

    // Generate date ranges
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
    });
    
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(); start.setDate(start.getDate() - (28 - (i * 7)));
      const end = new Date(start); end.setDate(end.getDate() + 6);
      return { label: `W${i + 1}`, start, end };
    });

    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
      return { label: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() };
    });

    // --- DAILY STATS ---
    const todayLogs = allLogs.filter(l => formatDate(l.date) === todayStr && l.completed);
    const todayTasks = tasks.filter(t => t.completedDate === todayStr);
    
    const daily = {
      habitRate: habits.length ? Math.round((todayLogs.length / habits.length) * 100) : 0,
      taskRate: tasks.length ? Math.round((todayTasks.length / tasks.length) * 100) : 0,
      xpEarned: todayTasks.reduce((sum, t) => sum + (t.xpReward || 10), 0) + todayLogs.reduce((sum, l) => sum + 10, 0),
    };

    // --- WEEKLY TREND (Last 7 Days) ---
    const weekly = last7Days.map(d => {
      const dStr = formatDate(d);
      const hLogs = allLogs.filter(l => formatDate(l.date) === dStr && l.completed);
      const tLogs = tasks.filter(t => t.completedDate === dStr);
      return {
        name: d.toLocaleString('default', { weekday: 'short' }),
        date: dStr,
        habits: habits.length ? Math.round((hLogs.length / habits.length) * 100) : 0,
        tasks: tasks.length ? Math.round((tLogs.length / tasks.length) * 100) : 0,
        xp: tLogs.reduce((sum, t) => sum + (t.xpReward || 10), 0) + hLogs.length * 10,
      };
    });

    const moodMap = new Map(moods.map(m => [m.date, m.mood]));
    const moodTrend = last7Days.map(d => {
      const dStr = formatDate(d);
      const hLogs = allLogs.filter(l => formatDate(l.date) === dStr && l.completed);
      const tLogs = tasks.filter(t => t.completedDate === dStr);
      const habitRate = habits.length ? Math.round((hLogs.length / habits.length) * 100) : 0;
      const taskRate = tasks.length ? Math.round((tLogs.length / tasks.length) * 100) : 0;
      const productivity = Math.round((habitRate + taskRate) / 2);
      return {
        name: d.toLocaleString('default', { weekday: 'short' }),
        date: dStr,
        mood: moodMap.get(dStr) || null,
        productivity,
      };
    });

    // --- MONTHLY TREND (Last 4 Weeks) ---
    const monthly = last4Weeks.map(w => {
      const hLogs = allLogs.filter(l => l.date >= w.start && l.date <= w.end && l.completed);
      const tLogs = tasks.filter(t => t.completedDate && new Date(t.completedDate) >= w.start && new Date(t.completedDate) <= w.end);
      return {
        name: w.label,
        habits: habits.length ? Math.round((hLogs.length / (habits.length * 7)) * 100) : 0,
        tasks: tasks.length ? Math.round((tLogs.length / (tasks.length || 1)) * 100) : 0, // Approx
        xp: tLogs.reduce((sum, t) => sum + (t.xpReward || 10), 0) + hLogs.length * 10,
      };
    });

    // --- YEARLY TREND (Last 12 Months) ---
    const yearly = last12Months.map(m => {
      const hLogs = allLogs.filter(l => l.date.getMonth() === m.month && l.date.getFullYear() === m.year && l.completed);
      const tLogs = tasks.filter(t => t.completedDate && new Date(t.completedDate).getMonth() === m.month && new Date(t.completedDate).getFullYear() === m.year);
      return {
        name: m.label,
        habits: hLogs.length,
        tasks: tLogs.length,
        xp: tLogs.reduce((sum, t) => sum + (t.xpReward || 10), 0) + hLogs.length * 10,
      };
    });

    const summary = {
      daily,
      weekly,
      monthly,
      yearly,
      streaks: {
        current: habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0),
        longest: habits.reduce((max, h) => Math.max(max, h.longestStreak || 0), 0),
      },
      moodTrend,
      user: {
        xp: user.xp,
        level: user.level,
        nextLevelXp: user.level * 100,
        currentProgress: (user.xp % 100),
      },
    };

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

const formatDate = (date) => date.toISOString().split('T')[0];

// @desc    Get calendar heatmap data
// @route   GET /api/analytics/heatmap
export const getHeatmap = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const monthParam = (req.query.month || '').trim();
    const now = new Date();
    const [year, month] = monthParam.split('-').map((value) => Number(value));

    const targetYear = Number.isFinite(year) ? year : now.getFullYear();
    const targetMonth = Number.isFinite(month) ? month - 1 : now.getMonth();

    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const [habits, allTasks, allLogs] = await Promise.all([
      Habit.find({ userId, isActive: true }),
      Task.find({ userId }),
      HabitLog.find({ userId, date: { $gte: monthStart, $lte: monthEnd } }),
    ]);

    const habitCount = habits.length;
    const taskCount = allTasks.length;

    const tasks = allTasks.map((task) => ({
      ...task.toObject(),
      completedDate: task.completedAt
        ? formatDate(new Date(task.completedAt))
        : task.completed
          ? formatDate(new Date(task.updatedAt))
          : null,
    }));

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(targetYear, targetMonth, i + 1);
      const dateKey = formatDate(date);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const habitCompleted = allLogs.filter(
        (log) => log.completed && log.date >= dayStart && log.date <= dayEnd
      ).length;
      const taskCompleted = tasks.filter((task) => task.completedDate === dateKey).length;

      return {
        date: dateKey,
        habitCount: habitCompleted,
        habitRate: habitCount ? Math.round((habitCompleted / habitCount) * 100) : 0,
        taskCount: taskCompleted,
        taskRate: taskCount ? Math.round((taskCompleted / taskCount) * 100) : 0,
      };
    });

    res.json({
      success: true,
      month: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`,
      days,
      totals: { habitCount, taskCount },
    });
  } catch (error) {
    next(error);
  }
};
