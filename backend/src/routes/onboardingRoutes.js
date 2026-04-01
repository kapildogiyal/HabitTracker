import express from 'express';
import { getOnboardingStatus, saveOnboarding } from '../controllers/onboardingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/status', getOnboardingStatus);
router.post('/submit', saveOnboarding);

export default router;
