import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    goal: {
      type: [String],
      required: [true, 'At least one goal is required'],
      default: [],
    },
    wakeUpTime: {
      type: String,
      required: [true, 'Wake up time is required'],
    },
    sleepTime: {
      type: String,
      required: [true, 'Sleep time is required'],
    },
    motivationType: {
      type: [String],
      required: [true, 'At least one motivation type is required'],
      default: [],
    },
    birthday: {
      type: Date,
      required: [true, 'Birthday is required'],
    },
    selectedHabits: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('UserPreferences', userPreferencesSchema);
