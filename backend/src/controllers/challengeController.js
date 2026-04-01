import Challenge from '../models/Challenge.js';
import ChallengeProgress from '../models/ChallengeProgress.js';
import User from '../models/User.js';

const mapUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  avatar: user.avatar,
  level: user.level,
  xp: user.xp,
});

const normalizeType = (type) => {
  if (type === '7 day challenge' || type === '7_day' || type === '7') return '7_day';
  if (type === '30 day challenge' || type === '30_day' || type === '30') return '30_day';
  return 'custom';
};

const buildDates = (type, startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  if (type === '7_day') {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  }
  if (type === '30_day') {
    const end = new Date(start);
    end.setDate(end.getDate() + 29);
    return { start, end };
  }
  if (!endDate) return { start, end: null };
  return { start, end: new Date(endDate) };
};

const getParticipantStatus = (challenge, userId) => {
  const row = challenge.participants.find((p) => p.userId.toString() === userId);
  return row?.status || 'pending';
};

// @desc    Create challenge
// @route   POST /api/challenges
export const createChallenge = async (req, res, next) => {
  try {
    const { title, type, startDate, endDate, invitedIds } = req.body;
    const normalizedType = normalizeType(type);
    const { start, end } = buildDates(normalizedType, startDate, endDate);

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'Start and end date are required' });
    }

    const participants = [
      { userId: req.user.id, status: 'accepted' },
      ...(Array.isArray(invitedIds)
        ? invitedIds
            .filter((id) => id && id !== req.user.id)
            .map((id) => ({ userId: id, status: 'pending' }))
        : []),
    ];

    const challenge = await Challenge.create({
      title,
      createdBy: req.user.id,
      participants,
      startDate: start,
      endDate: end,
      type: normalizedType,
    });

    await ChallengeProgress.create({ challengeId: challenge._id, userId: req.user.id });

    res.status(201).json({ success: true, challenge });
  } catch (error) {
    next(error);
  }
};

// @desc    List challenges for user
// @route   GET /api/challenges
export const getChallenges = async (req, res, next) => {
  try {
    const challenges = await Challenge.find({ 'participants.userId': req.user.id }).sort({ startDate: -1 });

    const response = challenges.map((challenge) => ({
      id: challenge._id,
      title: challenge.title,
      createdBy: challenge.createdBy,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      winner: challenge.winner,
      type: challenge.type,
      participantCount: challenge.participants.length,
      status: getParticipantStatus(challenge, req.user.id),
    }));

    res.json({ success: true, challenges: response });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite friend to challenge
// @route   POST /api/challenges/invite
export const inviteFriend = async (req, res, next) => {
  try {
    const { challengeId, friendId } = req.body;
    if (!challengeId || !friendId) {
      return res.status(400).json({ success: false, message: 'Challenge ID and friend ID are required' });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    if (challenge.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the creator can invite friends' });
    }

    const exists = challenge.participants.find((p) => p.userId.toString() === friendId);
    if (exists) {
      return res.status(400).json({ success: false, message: 'User already invited' });
    }

    challenge.participants.push({ userId: friendId, status: 'pending' });
    await challenge.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Join challenge
// @route   POST /api/challenges/join
export const joinChallenge = async (req, res, next) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) return res.status(400).json({ success: false, message: 'Challenge ID is required' });

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const participant = challenge.participants.find((p) => p.userId.toString() === req.user.id);
    if (participant) {
      participant.status = 'accepted';
    } else {
      challenge.participants.push({ userId: req.user.id, status: 'accepted' });
    }

    await challenge.save();

    await ChallengeProgress.findOneAndUpdate(
      { challengeId, userId: req.user.id },
      { challengeId, userId: req.user.id },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Update progress
// @route   POST /api/challenges/progress
export const updateProgress = async (req, res, next) => {
  try {
    const { challengeId, completedHabits, completedTasks, score } = req.body;
    if (!challengeId) return res.status(400).json({ success: false, message: 'Challenge ID is required' });

    const update = {
      completedHabits: Number(completedHabits || 0),
      completedTasks: Number(completedTasks || 0),
    };

    update.score = score !== undefined
      ? Number(score || 0)
      : update.completedHabits + update.completedTasks;

    const progress = await ChallengeProgress.findOneAndUpdate(
      { challengeId, userId: req.user.id },
      update,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/challenges/:id/leaderboard
export const getLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entries = await ChallengeProgress.find({ challengeId: id }).sort({ score: -1, updatedAt: 1 });
    const users = await User.find({ _id: { $in: entries.map((entry) => entry.userId) } });
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    const leaderboard = entries.map((entry, index) => ({
      rank: index + 1,
      score: entry.score,
      completedHabits: entry.completedHabits,
      completedTasks: entry.completedTasks,
      user: mapUser(userMap.get(entry.userId.toString())),
    }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    next(error);
  }
};
