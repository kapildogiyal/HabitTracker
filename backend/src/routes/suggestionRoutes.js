import express from 'express';
import { generateSuggestions } from '../controllers/suggestionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/generate', protect, generateSuggestions);

export default router;
