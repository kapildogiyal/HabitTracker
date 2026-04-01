import mongoose from 'mongoose';

const motivationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quote: {
    type: String,
    required: true,
  },
  author: {
    type: String,
  },
  authorImage: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Motivation', motivationSchema);
