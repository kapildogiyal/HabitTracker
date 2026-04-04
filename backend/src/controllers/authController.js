import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, username, timezone } = req.body;
    const derivedUsername = username || email?.split('@')[0];
    const user = await User.create({ name, email, password, username: derivedUsername, timezone: timezone || 'UTC', lastActiveAt: new Date() });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email, xp: user.xp, streak: user.streak, level: user.level, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const username = user.username || user.email?.split('@')[0];
    const activityUpdate = { lastActiveAt: new Date() };
    if (!user.username && username) {
      activityUpdate.username = username;
    }
    if (req.body.timezone) {
      activityUpdate.timezone = req.body.timezone;
    }

    User.updateOne({ _id: user._id }, { $set: activityUpdate }).catch((error) => {
      console.error('Failed to update lastActiveAt during login:', error);
    });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, username, email: user.email, xp: user.xp, streak: user.streak, level: user.level, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile/settings
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, username, timezone } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (username !== undefined) updates.username = username;
    if (timezone !== undefined) updates.timezone = timezone;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
};
