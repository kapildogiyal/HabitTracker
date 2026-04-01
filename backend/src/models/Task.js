import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // user-defined target duration in minutes
  },
  timerStatus: {
    type: String,
    enum: ['idle', 'running', 'paused'],
    default: 'idle',
  },
  timerLastStarted: {
    type: Date,
  },
  accumulatedTime: {
    type: Number, // in milliseconds
    default: 0,
  },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  xpReward: {
    type: Number,
    default: 10,
  },
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
