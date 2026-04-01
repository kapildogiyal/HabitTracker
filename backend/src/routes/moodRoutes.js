import express from 'express';
import { getTodayMood, saveMood } from '../controllers/moodController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/today', getTodayMood);
router.post('/', saveMood);

export default router;
