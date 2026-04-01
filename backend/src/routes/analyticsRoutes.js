import express from 'express';
import { getSummary, getHeatmap } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/summary', getSummary);
router.get('/heatmap', getHeatmap);

export default router;
