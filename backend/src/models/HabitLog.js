import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    required: true,
  },
});

habitLogSchema.index({ habitId: 1, date: 1, userId: 1 }, { unique: true });

export default mongoose.model('HabitLog', habitLogSchema);
