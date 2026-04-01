import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import UserPreferences from '../models/UserPreferences.js';
import { createNotification, sendNotificationNow } from '../services/notificationService.js';
import { generatePersonalityMessage } from '../services/aiPersonalityService.js';
import { applyPerfectDayBonus } from '../utils/xpUtils.js';

// @desc    Get all tasks
// @route   GET /api/tasks
export const getTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, userId: req.user.id });
    await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() });
    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() });
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle task completion
// @route   PATCH /api/tasks/:id/complete
export const toggleTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const wasCompleted = task.completed;
    task.completed = !wasCompleted;
    task.status = task.completed ? 'done' : 'todo';
    task.completedAt = task.completed ? new Date() : null;
    await task.save();

    // Award / deduct XP
    const user = await User.findById(req.user.id);
    if (task.completed) {
      user.xp += task.xpReward;
    } else {
      user.xp = Math.max(0, user.xp - task.xpReward);
    }
    const perfectDayAwarded = await applyPerfectDayBonus(user);
    user.lastActiveAt = new Date();
    if (task.xpReward !== 0 || perfectDayAwarded) {
      user.updateLevel();
    }
    await user.save();

    if (task.completed) {
      const remaining = await Task.countDocuments({ userId: req.user.id, completed: false });
      if (remaining === 0) {
        const alreadySent = await Notification.findOne({
          userId: req.user.id,
          type: 'completion_celebration',
          scheduledTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        });

        if (!alreadySent) {
          const prefs = await UserPreferences.findOne({ userId: req.user.id });
          const message = await generatePersonalityMessage({
            personality: prefs?.motivationType,
            type: 'completion_celebration',
            context: { completedAt: new Date() },
          });
          const notification = await createNotification({
            userId: req.user.id,
            title: 'All Tasks Completed',
            message,
            type: 'completion_celebration',
            scheduledTime: new Date(),
          });
          await sendNotificationNow(notification);
        }
      }
    }

    res.json({
      success: true,
      task,
      user: { xp: user.xp, level: user.level },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Control task timer
// @route   PATCH /api/tasks/:id/timer
export const controlTimer = async (req, res, next) => {
  try {
    const { action } = req.body; // 'start', 'pause', 'stop'
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const now = new Date();

    if (action === 'start' && task.timerStatus !== 'running') {
      task.timerStatus = 'running';
      task.timerLastStarted = now;
      if (task.status === 'todo') task.status = 'inprogress';
    } else if ((action === 'pause' || action === 'stop') && task.timerStatus === 'running') {
      const elapsed = now.getTime() - new Date(task.timerLastStarted).getTime();
      task.accumulatedTime += elapsed;
      task.timerStatus = action === 'pause' ? 'paused' : 'idle';
      task.timerLastStarted = null;
    } else if (action === 'stop' && task.timerStatus === 'paused') {
      task.timerStatus = 'idle';
    }

    await task.save();
    await User.findByIdAndUpdate(req.user.id, { lastActiveAt: new Date() });
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};
