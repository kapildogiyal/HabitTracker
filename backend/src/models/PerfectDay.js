import mongoose from 'mongoose';

const perfectDaySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

perfectDaySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('PerfectDay', perfectDaySchema);
