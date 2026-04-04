import PushSubscription from '../models/PushSubscription.js';

// @desc    Save push subscription
// @route   POST /api/notifications/subscribe
export const saveSubscription = async (req, res, next) => {
  try {
    const { endpoint, keys, expirationTime } = req.body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription payload' });
    }

    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId: req.user.id,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        expirationTime: expirationTime || null,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove push subscription
// @route   POST /api/notifications/unsubscribe
export const removeSubscription = async (req, res, next) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint is required' });
    }

    await PushSubscription.deleteOne({ endpoint, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get VAPID public key
// @route   GET /api/notifications/vapid-public-key
export const getPublicKey = (req, res) => {
  res.status(200).json({ 
    success: true, 
    publicKey: process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY 
  });
};
