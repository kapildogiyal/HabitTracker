import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dailyScore: {
    type: Number,
    default: 0,
  },
  weeklyScore: {
    type: Number,
    default: 0,
  },
  monthlyScore: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Score', scoreSchema);
