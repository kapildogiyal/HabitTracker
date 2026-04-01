import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import User from '../models/User.js';
import { getTodayString, calculateStreak } from '../utils/dateUtils.js';
import { applyPerfectDayBonus } from '../utils/xpUtils.js';

// @desc    Get all habits
// @route   GET /api/habits
export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user.id, isActive: true }).sort({ createdAt: -1 });
    const today = getTodayString();

    // Attach today's completion status
    const habitIds = habits.map((h) => h._id);
    const todayLogs = await HabitLog.find({ habitId: { $in: habitIds }, userId: req.user.id, date: today });
    const logMap = new Map(todayLogs.map(l => [l.habitId.toString(), l]));

    const habitsWithStatus = habits.map((h) => {
      const log = logMap.get(h._id.toString());
      return {
        ...h.toObject(),
        completedToday: log ? log.completed : false,
        progressToday: log ? log.progress : 0,
      };
    });

    res.json({ success: true, habits: habitsWithStatus });
  } catch (error) {
    next(error);
  }
};

// @desc    Create habit
// @route   POST /api/habits
export const createHabit = async (req, res, next) => {
  try {
    const habit = await Habit.create({ ...req.body, userId: req.user.id, isActive: true });
    await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() });
    res.status(201).json({ success: true, habit: { ...habit.toObject(), completedToday: false } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update habit
// @route   PUT /api/habits/:id
export const updateHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() });
    res.json({ success: true, habit });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete habit
// @route   DELETE /api/habits/:id
export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() });
    res.json({ success: true, message: 'Habit deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Log/unlog habit completion for today
// @route   POST /api/habits/:id/log
export const logHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    const today = getTodayString();
    let log = await HabitLog.findOne({ habitId: habit._id, userId: req.user.id, date: today });
    const { progress } = req.body || {};

    let xpDelta = 0;

    if (!log) {
      log = await HabitLog.create({ habitId: habit._id, userId: req.user.id, date: today, progress: 0, completed: false });
    }

    const wasCompleted = log.completed;

    // Update progress
    if (progress !== undefined) {
      log.progress = progress;
    } else {
      // Legacy toggle behavior
      if (log.completed || log.progress >= habit.target) {
         log.progress = 0;
      } else {
         // Default single increment if target > 1, else full completion
         log.progress = habit.target === 1 ? 1 : log.progress + 1;
      }
    }

    log.completed = log.progress >= habit.target;
    
    let isDeleted = false;
    if (log.progress <= 0) {
       await log.deleteOne();
       isDeleted = true;
    } else {
       await log.save();
    }

    // Award XP only on full completion toggle
    if (log.completed && !wasCompleted) {
       habit.totalCompletions += 1;
       xpDelta = habit.xpPerCompletion;
    } else if (!log.completed && wasCompleted) {
       habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);
       xpDelta = -habit.xpPerCompletion;
    }

    // Recalculate streak
    const logs = await HabitLog.find({ habitId: habit._id, userId: req.user.id }).sort({ date: -1 });
    const streak = calculateStreak(logs.map((l) => l.date));
    habit.currentStreak = streak;
    if (streak > habit.longestStreak) habit.longestStreak = streak;
    await habit.save();

    // Update user XP
    const user = await User.findById(req.user.id);
    const STREAK_BONUS = 20;

    if (xpDelta > 0) {
      // Award base completion points
      user.xp += xpDelta;
      
      // Check for streak bonus: if current streak increased compared to before saving the habit
      // Actually, let's just award bonus if streak >= 2 and it's a new completion for today
      if (habit.currentStreak >= 2 && !wasCompleted) {
        user.xp += STREAK_BONUS;
        xpDelta += STREAK_BONUS; // Just for reporting if needed
      }
    } else if (xpDelta < 0) {
      // Deduct points if uncompleted (optional but keeps balanced)
      user.xp = Math.max(0, user.xp + xpDelta);
    }

    const perfectDayAwarded = await applyPerfectDayBonus(user);
    user.lastActiveAt = new Date();
    if (xpDelta !== 0 || perfectDayAwarded) {
      user.updateLevel();
    }
    await user.save();

    res.json({
      success: true,
      completedToday: !isDeleted && log.completed,
      progressToday: isDeleted ? 0 : log.progress,
      habit: { ...habit.toObject(), completedToday: !isDeleted && log.completed, progressToday: isDeleted ? 0 : log.progress },
      user: { xp: user.xp, level: user.level },
    });
  } catch (error) {
    next(error);
  }
};
