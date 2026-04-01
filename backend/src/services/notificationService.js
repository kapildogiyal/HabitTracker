import webpush from 'web-push';
import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js';

let webPushReady = false;

export const configureWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    webPushReady = true;
  }
};

export const createNotification = async ({ userId, title, message, type, scheduledTime }) => {
  return Notification.create({
    userId,
    title,
    message,
    type,
    scheduledTime,
  });
};

export const sendPushToUser = async (userId, payload) => {
  if (!webPushReady) return { sent: 0, failed: 0 };
  const subscriptions = await PushSubscription.find({ userId });
  if (!subscriptions.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      sent += 1;
    } catch (error) {
      failed += 1;
      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: subscription._id });
      }
    }
  }

  return { sent, failed };
};

export const sendNotificationNow = async (notification) => {
  const payload = {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    scheduledTime: notification.scheduledTime,
  };

  await sendPushToUser(notification.userId, payload);

  notification.sent = true;
  await notification.save();

  return notification;
};
