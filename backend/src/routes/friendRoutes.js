import express from 'express';
import {
  searchUsers,
  getFriends,
  getRequests,
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
} from '../controllers/friendController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/list', getFriends);
router.get('/requests', getRequests);
router.post('/request', sendRequest);
router.post('/accept', acceptRequest);
router.post('/reject', rejectRequest);
router.post('/remove', removeFriend);

export default router;
