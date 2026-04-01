import mongoose from 'mongoose';

const challengeProgressSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    completedHabits: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

challengeProgressSchema.index({ challengeId: 1, userId: 1 }, { unique: true });

export default mongoose.model('ChallengeProgress', challengeProgressSchema);
