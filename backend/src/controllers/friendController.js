import Friend from '../models/Friend.js';
import User from '../models/User.js';

const mapUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  level: user.level,
  xp: user.xp,
});

// @desc    Search users by username or email
// @route   GET /api/friends/search
export const searchUsers = async (req, res, next) => {
  try {
    const query = (req.query.query || '').trim();
    if (!query) return res.json({ success: true, users: [] });

    const regex = new RegExp(query, 'i');
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [{ username: regex }, { email: regex }],
    }).limit(12);

    res.json({ success: true, users: users.map(mapUser) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get friends list
// @route   GET /api/friends/list
export const getFriends = async (req, res, next) => {
  try {
    const records = await Friend.find({
      status: 'accepted',
      $or: [{ userId: req.user.id }, { friendId: req.user.id }],
    });

    const friendIds = records.map((record) =>
      record.userId.toString() === req.user.id ? record.friendId : record.userId
    );

    const friends = await User.find({ _id: { $in: friendIds } });

    res.json({ success: true, friends: friends.map(mapUser) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get friend requests
// @route   GET /api/friends/requests
export const getRequests = async (req, res, next) => {
  try {
    const incoming = await Friend.find({ friendId: req.user.id, status: 'pending' });
    const outgoing = await Friend.find({ userId: req.user.id, status: 'pending' });

    const incomingUsers = await User.find({ _id: { $in: incoming.map((r) => r.userId) } });
    const outgoingUsers = await User.find({ _id: { $in: outgoing.map((r) => r.friendId) } });
    const incomingMap = new Map(incomingUsers.map((user) => [user._id.toString(), user]));
    const outgoingMap = new Map(outgoingUsers.map((user) => [user._id.toString(), user]));

    res.json({
      success: true,
      incoming: incoming
        .map((reqRow) => {
          const user = incomingMap.get(reqRow.userId.toString());
          if (!user) return null;
          return { requestId: reqRow._id, user: mapUser(user) };
        })
        .filter(Boolean),
      outgoing: outgoing
        .map((reqRow) => {
          const user = outgoingMap.get(reqRow.friendId.toString());
          if (!user) return null;
          return { requestId: reqRow._id, user: mapUser(user) };
        })
        .filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send friend request
// @route   POST /api/friends/request
export const sendRequest = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ success: false, message: 'Friend ID is required' });
    if (friendId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself' });
    }

    const existing = await Friend.findOne({
      $or: [
        { userId: req.user.id, friendId },
        { userId: friendId, friendId: req.user.id },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Already friends' });
      }
      if (existing.friendId.toString() === req.user.id) {
        return res.status(400).json({ success: false, message: 'Request already received' });
      }
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    const request = await Friend.create({ userId: req.user.id, friendId, status: 'pending' });
    res.status(201).json({ success: true, requestId: request._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept friend request
// @route   POST /api/friends/accept
export const acceptRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ success: false, message: 'Request ID is required' });

    const request = await Friend.findOne({ _id: requestId, friendId: req.user.id, status: 'pending' });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'accepted';
    await request.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject friend request
// @route   POST /api/friends/reject
export const rejectRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ success: false, message: 'Request ID is required' });

    const request = await Friend.findOneAndDelete({ _id: requestId, friendId: req.user.id, status: 'pending' });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove friend
// @route   POST /api/friends/remove
export const removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ success: false, message: 'Friend ID is required' });

    await Friend.findOneAndDelete({
      status: 'accepted',
      $or: [
        { userId: req.user.id, friendId },
        { userId: friendId, friendId: req.user.id },
      ],
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
