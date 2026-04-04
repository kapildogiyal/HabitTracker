import Notification from '../models/Notification.js';
import User from '../models/User.js';
import UserPreferences from '../models/UserPreferences.js';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import Task from '../models/Task.js';
import { combineDateAndTime, toTimeString, getUserTimeStr, addMinutes, addHours, startOfDay, endOfDay } from '../utils/timeUtils.js';
import { createNotification, sendNotificationNow } from './notificationService.js';
import { generatePersonalityMessage } from './aiPersonalityService.js';

const TASK_REMINDER_MINUTES = 15;
const STREAK_PROTECT_HOURS = -2;

// Check if server's current time has passed the target time in the user's local timezone
const shouldRunForTime = (targetTime, timezone, now) => {
  if (!targetTime) return false;
  // Use user's timezone to get HH:MM. If their time just crossed targetTime or is slightly past it,
  // we catch it. We only look exactly at today's match.
  const localTimeStr = getUserTimeStr(now, timezone);
  return localTimeStr >= targetTime; 
};

// Check if notification was sent recently (last 18 hours), preventing duplicate timezone triggers
const hasNotificationToday = async (userId, type, now) => {
  const exists = await Notification.findOne({
    userId,
    type,
    scheduledTime: { $gte: addHours(now, -18) },
  });
  return Boolean(exists);
};

const hasHabitReminderToday = async (userId, habitTitle, now) => {
  const exists = await Notification.findOne({
    userId,
    type: 'habit_reminder',
    title: `Habit Reminder: ${habitTitle}`,
    scheduledTime: { $gte: addHours(now, -18) },
  });
  return Boolean(exists);
};

const enqueueIfMissing = async (query, data) => {
  const existing = await Notification.findOne(query);
  if (existing) return existing;
  return createNotification(data);
};

const isBirthdayToday = (birthday, now, timezone) => {
  if (!birthday) return false;
  const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const date = new Date(birthday);
  return date.getMonth() === userNow.getMonth() && date.getDate() === userNow.getDate();
};

const getMotivation = (prefs) => prefs?.motivationType || [];

const scheduleMorningMotivation = async (user, prefs, now) => {
  if (!prefs?.wakeUpTime || !shouldRunForTime(prefs.wakeUpTime, user.timezone, now)) return;
  if (await hasNotificationToday(user._id, 'morning_motivation', now)) return;

  const message = await generatePersonalityMessage({
    personality: getMotivation(prefs),
    type: 'morning_motivation',
    context: { goal: prefs.goal },
  });

  await createNotification({
    userId: user._id,
    title: 'Morning Motivation',
    message,
    type: 'morning_motivation',
    scheduledTime: now,
  });
};

const scheduleWeeklyReport = async (user, prefs, now) => {
  const userNow = new Date(now.toLocaleString('en-US', { timeZone: user.timezone }));
  if (userNow.getDay() !== 0) return;
  if (!prefs?.wakeUpTime || !shouldRunForTime(prefs.wakeUpTime, user.timezone, now)) return;
  if (await hasNotificationToday(user._id, 'weekly_report', now)) return;

  const message = await generatePersonalityMessage({
    personality: getMotivation(prefs),
    type: 'weekly_report',
    context: { goal: prefs?.goal || [] },
  });

  await createNotification({
    userId: user._id,
    title: 'Weekly Report',
    message,
    type: 'weekly_report',
    scheduledTime: now,
  });
};

const scheduleHabitReminders = async (user, prefs, now) => {
  console.log(`[HabitReminder] Executing check for User ID: ${user._id} | Timezone: ${user.timezone || 'UTC'}`);
  const habits = await Habit.find({ userId: user._id });
  if (!habits.length) {
    console.log(`[HabitReminder] -> No habits found for this user.`);
    return;
  }

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const logs = await HabitLog.find({
    userId: user._id,
    date: { $gte: todayStart, $lte: todayEnd },
    completed: true,
  });
  const completedIds = new Set(logs.map((log) => log.habitId.toString()));

  for (const habit of habits) {
    console.log(`\n[HabitReminder] Checking habit: "${habit.title}"`);
    console.log(`[HabitReminder] -> Configured reminder time: ${habit.reminderTime || 'None'}`);
    
    if (!habit.reminderTime) continue;
    
    const isTime = shouldRunForTime(habit.reminderTime, user.timezone, now);
    console.log(`[HabitReminder] -> shouldRunForTime evaluates to: ${isTime}`);
    
    if (!isTime) continue;
    
    if (completedIds.has(habit._id.toString())) {
      console.log(`[HabitReminder] -> Skipped: Habit already logged as completed today.`);
      continue;
    }
    
    const sentToday = await hasHabitReminderToday(user._id, habit.title, now);
    console.log(`[HabitReminder] -> hasHabitReminderToday evaluates to: ${sentToday}`);
    if (sentToday) {
      console.log(`[HabitReminder] -> Skipped: Push notification already issued in the last 18 hours.`);
      continue;
    }

    console.log(`[HabitReminder] -> SUCCESS: Queueing push notification payload!`);
    
    const message = await generatePersonalityMessage({
      personality: getMotivation(prefs),
      type: 'habit_reminder',
      context: { habitTitle: habit.title },
    });

    await createNotification({
      userId: user._id,
      title: `Habit Reminder: ${habit.title}`,
      message,
      type: 'habit_reminder',
      scheduledTime: now,
    });
  }
};

const scheduleTaskReminders = async (user, prefs, now) => {
  const windowEnd = addMinutes(now, TASK_REMINDER_MINUTES);
  
  // Task absolute times are strictly timezone independent!
  const tasks = await Task.find({
    userId: user._id,
    startTime: { $gte: now, $lte: windowEnd },
    completed: false,
  });

  for (const task of tasks) {
    const scheduledTime = addMinutes(task.startTime, -TASK_REMINDER_MINUTES);
    
    // Check if task notification already generated within the last 1 hour
    const existing = await Notification.findOne({
      userId: user._id,
      type: 'task_reminder',
      title: `Task Reminder: ${task.title}`,
      scheduledTime: { $gte: addMinutes(now, -60) }
    });
    
    if (existing) continue;

    const message = await generatePersonalityMessage({
      personality: getMotivation(prefs),
      type: 'task_reminder',
      context: { taskTitle: task.title, startTime: task.startTime },
    });
    
    await createNotification({
      userId: user._id,
      title: `Task Reminder: ${task.title}`,
      message,
      type: 'task_reminder',
      scheduledTime,
    });
  }

  if (prefs?.wakeUpTime && shouldRunForTime(prefs.wakeUpTime, user.timezone, now)) {
    const dueTodayTasks = await Task.find({
      userId: user._id,
      dueDate: { $gte: startOfDay(now), $lte: endOfDay(now) },
      completed: false,
    });

    if (dueTodayTasks.length > 0 && !(await hasNotificationToday(user._id, 'today_task_summary', now))) {
      const message = await generatePersonalityMessage({
        personality: getMotivation(prefs),
        type: 'today_task_summary',
        context: {
          taskCount: dueTodayTasks.length,
          taskTitles: dueTodayTasks.slice(0, 3).map((task) => task.title),
        },
      });

      await createNotification({
        userId: user._id,
        title: `Today's Tasks (${dueTodayTasks.length})`,
        message,
        type: 'today_task_summary',
        scheduledTime: now,
      });
    }
  }
};

const scheduleInactiveUser = async (user, prefs, now) => {
  if (!user?.lastActiveAt) return;

  const twoDaysAgo = addHours(now, -48);
  if (user.lastActiveAt > twoDaysAgo) return;

  const recent = await Notification.findOne({
    userId: user._id,
    type: 'inactive_user',
    scheduledTime: { $gte: addHours(now, -24) },
  });
  if (recent) return;

  const message = await generatePersonalityMessage({
    personality: getMotivation(prefs),
    type: 'inactive_user',
    context: { lastActiveAt: user.lastActiveAt },
  });

  await createNotification({
    userId: user._id,
    title: 'We miss you',
    message,
    type: 'inactive_user',
    scheduledTime: now,
  });
};

const scheduleStreakProtection = async (user, prefs, now) => {
  if (!prefs?.sleepTime) return;
  const sleepTime = combineDateAndTime(now, prefs.sleepTime);
  const reminderTime = sleepTime ? addHours(sleepTime, STREAK_PROTECT_HOURS) : null;
  if (!reminderTime || !shouldRunForTime(toTimeString(reminderTime), user.timezone, now)) return;

  const habits = await Habit.find({ userId: user._id });
  if (!habits.length) return;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(addHours(now, -24));
  const yesterdayEnd = endOfDay(addHours(now, -24));

  const todayLogs = await HabitLog.find({
    userId: user._id,
    date: { $gte: todayStart, $lte: todayEnd },
    completed: true,
  });
  const yesterdayLogs = await HabitLog.find({
    userId: user._id,
    date: { $gte: yesterdayStart, $lte: yesterdayEnd },
    completed: true,
  });

  const todayCompleted = new Set(todayLogs.map((log) => log.habitId.toString()));
  const yesterdayCompleted = new Set(yesterdayLogs.map((log) => log.habitId.toString()));

  const needsProtection = habits.some((habit) =>
    yesterdayCompleted.has(habit._id.toString()) && !todayCompleted.has(habit._id.toString())
  );

  if (!needsProtection) return;
  if (await hasNotificationToday(user._id, 'streak_protection', now)) return;

  const message = await generatePersonalityMessage({
    personality: getMotivation(prefs),
    type: 'streak_protection',
    context: { goal: prefs.goal },
  });

  await createNotification({
    userId: user._id,
    title: 'Streak Protection',
    message,
    type: 'streak_protection',
    scheduledTime: now,
  });
};

const scheduleBirthdayReminder = async (user, prefs, now) => {
  if (!prefs?.birthday) return;
  if (!isBirthdayToday(prefs.birthday, now, user.timezone)) return;
  if (prefs.wakeUpTime && !shouldRunForTime(prefs.wakeUpTime, user.timezone, now)) return;
  if (await hasNotificationToday(user._id, 'birthday', now)) return;

  const scheduledTime = now;
  await createNotification({
    userId: user._id,
    title: 'Happy Birthday',
    message: 'Happy Birthday! \uD83C\uDF89',
    type: 'birthday',
    scheduledTime,
  });
};

export const scheduleNotifications = async (now = new Date()) => {
  const users = await User.find({});
  
  for (const user of users) {
    const prefs = await UserPreferences.findOne({ userId: user._id });
    
    await scheduleMorningMotivation(user, prefs, now);
    await scheduleWeeklyReport(user, prefs, now);
    await scheduleHabitReminders(user, prefs, now);
    await scheduleTaskReminders(user, prefs, now);
    await scheduleInactiveUser(user, prefs, now);
    await scheduleStreakProtection(user, prefs, now);
    await scheduleBirthdayReminder(user, prefs, now);
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
