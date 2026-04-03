import Notification from '../models/Notification.js';
import User from '../models/User.js';
import UserPreferences from '../models/UserPreferences.js';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import Task from '../models/Task.js';
import { combineDateAndTime, toTimeString, addMinutes, addHours, startOfDay, endOfDay } from '../utils/timeUtils.js';
import { createNotification, sendNotificationNow } from './notificationService.js';
import { generatePersonalityMessage } from './aiPersonalityService.js';

const TASK_REMINDER_MINUTES = 15;
const STREAK_PROTECT_HOURS = -2;

const shouldRunForTime = (targetTime, now) => {
  if (!targetTime) return false;
  return targetTime === toTimeString(now);
};

const hasNotificationToday = async (userId, type, now) => {
  const exists = await Notification.findOne({
    userId,
    type,
    scheduledTime: { $gte: startOfDay(now), $lte: endOfDay(now) },
  });
  return Boolean(exists);
};

const enqueueIfMissing = async (query, data) => {
  const existing = await Notification.findOne(query);
  if (existing) return existing;
  return createNotification(data);
};

const isBirthdayToday = (birthday, now) => {
  if (!birthday) return false;
  const date = new Date(birthday);
  return date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

const scheduleMorningMotivation = async (prefs, now) => {
  if (!shouldRunForTime(prefs.wakeUpTime, now)) return;
  if (await hasNotificationToday(prefs.userId, 'morning_motivation', now)) return;

  const message = await generatePersonalityMessage({
    personality: prefs.motivationType,
    type: 'morning_motivation',
    context: { goal: prefs.goal },
  });

  await createNotification({
    userId: prefs.userId,
    title: 'Morning Motivation',
    message,
    type: 'morning_motivation',
    scheduledTime: now,
  });
};

const scheduleWeeklyReport = async (prefs, now) => {
  if (now.getDay() !== 0) return;
  if (!shouldRunForTime(prefs.wakeUpTime, now)) return;
  if (await hasNotificationToday(prefs.userId, 'weekly_report', now)) return;

  const message = await generatePersonalityMessage({
    personality: prefs.motivationType,
    type: 'weekly_report',
    context: { goal: prefs.goal },
  });

  await createNotification({
    userId: prefs.userId,
    title: 'Weekly Report',
    message,
    type: 'weekly_report',
    scheduledTime: now,
  });
};

const scheduleHabitReminders = async (prefs, now) => {
  const habits = await Habit.find({ userId: prefs.userId });
  if (!habits.length) return;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const logs = await HabitLog.find({
    userId: prefs.userId,
    date: { $gte: todayStart, $lte: todayEnd },
    completed: true,
  });
  const completedIds = new Set(logs.map((log) => log.habitId.toString()));

  for (const habit of habits) {
    if (!habit.reminderTime) continue;
    if (!shouldRunForTime(habit.reminderTime, now)) continue;
    if (completedIds.has(habit._id.toString())) continue;

    const message = await generatePersonalityMessage({
      personality: prefs.motivationType,
      type: 'habit_reminder',
      context: { habitTitle: habit.title },
    });

    const scheduledTime = now;
    await enqueueIfMissing(
      {
        userId: prefs.userId,
        type: 'habit_reminder',
        title: `Habit Reminder: ${habit.title}`,
        scheduledTime,
      },
      {
        userId: prefs.userId,
        title: `Habit Reminder: ${habit.title}`,
        message,
        type: 'habit_reminder',
        scheduledTime,
      }
    );
  }
};

const scheduleTaskReminders = async (prefs, now) => {
  const windowEnd = addMinutes(now, TASK_REMINDER_MINUTES);
  const tasks = await Task.find({
    userId: prefs.userId,
    startTime: { $gte: now, $lte: windowEnd },
    completed: false,
  });

  for (const task of tasks) {
    const message = await generatePersonalityMessage({
      personality: prefs.motivationType,
      type: 'task_reminder',
      context: { taskTitle: task.title, startTime: task.startTime },
    });
    const scheduledTime = addMinutes(task.startTime, -TASK_REMINDER_MINUTES);
    await enqueueIfMissing(
      {
        userId: prefs.userId,
        type: 'task_reminder',
        title: `Task Reminder: ${task.title}`,
        scheduledTime,
      },
      {
        userId: prefs.userId,
        title: `Task Reminder: ${task.title}`,
        message,
        type: 'task_reminder',
        scheduledTime,
      }
    );
  }

  if (!shouldRunForTime(prefs.wakeUpTime, now)) return;

  const dueTodayTasks = await Task.find({
    userId: prefs.userId,
    dueDate: { $gte: startOfDay(now), $lte: endOfDay(now) },
    completed: false,
  });

  if (!dueTodayTasks.length) return;

  if (await hasNotificationToday(prefs.userId, 'today_task_summary', now)) return;

  const message = await generatePersonalityMessage({
    personality: prefs.motivationType,
    type: 'today_task_summary',
    context: {
      taskCount: dueTodayTasks.length,
      taskTitles: dueTodayTasks.slice(0, 3).map((task) => task.title),
    },
  });

  await createNotification({
    userId: prefs.userId,
    title: `Today's Tasks (${dueTodayTasks.length})`,
    message,
    type: 'today_task_summary',
    scheduledTime: now,
  });
};

const scheduleInactiveUser = async (prefs, now) => {
  const user = await User.findById(prefs.userId);
  if (!user?.lastActiveAt) return;

  const twoDaysAgo = addHours(now, -48);
  if (user.lastActiveAt > twoDaysAgo) return;

  const recent = await Notification.findOne({
    userId: prefs.userId,
    type: 'inactive_user',
    scheduledTime: { $gte: addHours(now, -24) },
  });
  if (recent) return;

  const message = await generatePersonalityMessage({
    personality: prefs.motivationType,
    type: 'inactive_user',
    context: { lastActiveAt: user.lastActiveAt },
  });

  await createNotification({
    userId: prefs.userId,
    title: 'We miss you',
    message,
    type: 'inactive_user',
    scheduledTime: now,
  });
};

const scheduleStreakProtection = async (prefs, now) => {
  const sleepTime = combineDateAndTime(now, prefs.sleepTime);
  const reminderTime = sleepTime ? addHours(sleepTime, STREAK_PROTECT_HOURS) : null;
  if (!reminderTime || !shouldRunForTime(toTimeString(reminderTime), now)) return;

  const habits = await Habit.find({ userId: prefs.userId });
  if (!habits.length) return;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(addHours(now, -24));
  const yesterdayEnd = endOfDay(addHours(now, -24));

  const todayLogs = await HabitLog.find({
    userId: prefs.userId,
    date: { $gte: todayStart, $lte: todayEnd },
    completed: true,
  });
  const yesterdayLogs = await HabitLog.find({
    userId: prefs.userId,
    date: { $gte: yesterdayStart, $lte: yesterdayEnd },
    completed: true,
  });

  const todayCompleted = new Set(todayLogs.map((log) => log.habitId.toString()));
  const yesterdayCompleted = new Set(yesterdayLogs.map((log) => log.habitId.toString()));

  const needsProtection = habits.some((habit) =>
    yesterdayCompleted.has(habit._id.toString()) && !todayCompleted.has(habit._id.toString())
  );

  if (!needsProtection) return;
  if (await hasNotificationToday(prefs.userId, 'streak_protection', now)) return;

  const message = await generatePersonalityMessage({
    personality: prefs.motivationType,
    type: 'streak_protection',
    context: { goal: prefs.goal },
  });

  await createNotification({
    userId: prefs.userId,
    title: 'Streak Protection',
    message,
    type: 'streak_protection',
    scheduledTime: now,
  });
};

const scheduleBirthdayReminder = async (prefs, now) => {
  if (!prefs.birthday) return;
  if (!isBirthdayToday(prefs.birthday, now)) return;
  if (prefs.wakeUpTime && !shouldRunForTime(prefs.wakeUpTime, now)) return;
  if (await hasNotificationToday(prefs.userId, 'birthday', now)) return;

  const scheduledTime = now;
  await createNotification({
    userId: prefs.userId,
    title: 'Happy Birthday',
    message: 'Happy Birthday! \uD83C\uDF89',
    type: 'birthday',
    scheduledTime,
  });
};

export const scheduleNotifications = async (now = new Date()) => {
  const prefsList = await UserPreferences.find({});

  for (const prefs of prefsList) {
    await scheduleMorningMotivation(prefs, now);
    await scheduleWeeklyReport(prefs, now);
    await scheduleHabitReminders(prefs, now);
    await scheduleTaskReminders(prefs, now);
    await scheduleInactiveUser(prefs, now);
    await scheduleStreakProtection(prefs, now);
    await scheduleBirthdayReminder(prefs, now);
  }
};

export const processDueNotifications = async (now = new Date()) => {
  const due = await Notification.find({ sent: false, scheduledTime: { $lte: now } }).limit(200);

  for (const notification of due) {
    await sendNotificationNow(notification);
  }
};

export const startNotificationScheduler = (cron) => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      await scheduleNotifications(now);
      await processDueNotifications(now);
    } catch (error) {
      console.error('Notification scheduler error:', error);
    }
  });
};
