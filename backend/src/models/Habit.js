import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Habit title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  daysOfWeek: {
    type: [Number], // 0=Sunday, 1=Monday, ... 6=Saturday
    default: [],
  },
  icon: {
    type: String,
    default: '⭐',
  },
  target: {
    type: Number,
    default: 1, // Number of times per day/frequency
  },
  color: {
    type: String,
    default: 'violet',
  },
  reminderTime: {
    type: String, // HH:mm format
  },
  xpPerCompletion: {
    type: Number,
    default: 5,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  totalCompletions: {
    type: Number,
    default: 0,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model('Habit', habitSchema);
