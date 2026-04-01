import Mood from '../models/Mood.js';
import { getTodayString } from '../utils/dateUtils.js';

// @desc    Get today's mood
// @route   GET /api/mood/today
export const getTodayMood = async (req, res, next) => {
  try {
    const today = getTodayString();
    const mood = await Mood.findOne({ userId: req.user.id, date: today });
    res.json({ success: true, mood: mood ? mood.mood : null, date: today });
  } catch (error) {
    next(error);
  }
};

// @desc    Save today's mood
// @route   POST /api/mood
export const saveMood = async (req, res, next) => {
  try {
    const { mood } = req.body;
    if (!mood) {
      return res.status(400).json({ success: false, message: 'Mood is required' });
    }

    const today = getTodayString();
    const saved = await Mood.findOneAndUpdate(
      { userId: req.user.id, date: today },
      { userId: req.user.id, date: today, mood },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, mood: saved.mood, date: today });
  } catch (error) {
    next(error);
  }
};
