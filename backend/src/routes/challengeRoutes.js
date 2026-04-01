import express from 'express';
import {
  createChallenge,
  getChallenges,
  inviteFriend,
  joinChallenge,
  updateProgress,
  getLeaderboard,
} from '../controllers/challengeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getChallenges);
router.post('/', createChallenge);
router.post('/invite', inviteFriend);
router.post('/join', joinChallenge);
router.post('/progress', updateProgress);
router.get('/:id/leaderboard', getLeaderboard);

export default router;
