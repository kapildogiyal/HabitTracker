import express from 'express';
import { generateMotivation } from '../controllers/motivationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/generate', protect, generateMotivation);

export default router;
