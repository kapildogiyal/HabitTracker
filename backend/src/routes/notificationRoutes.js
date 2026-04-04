import express from 'express';
import { saveSubscription, removeSubscription, getPublicKey } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/vapid-public-key', getPublicKey);
router.post('/subscribe', saveSubscription);
router.post('/unsubscribe', removeSubscription);
router.post('/test-push', async (req, res, next) => {
  try {
    const { sendPushToUser } = await import('../services/notificationService.js');
    const result = await sendPushToUser(req.user.id, {
      title: 'HabitTrack Test',
      message: 'This is a test push notification. If you see this, it works! \uD83D\uDE80',
    });
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

export default router;
