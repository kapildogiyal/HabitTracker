import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  xp: {
    type: Number,
    default: 0,
  },
  streak: {
    type: Number,
    default: 0,
  },
  level: {
    type: String,
    default: 'Beginner', // Beginner | Consistent | Focused | Discipline Master
  },
  badges: [{
    id: String,
    name: String,
    icon: String,
    unlockedAt: { type: Date, default: Date.now },
  }],
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  lastPerfectDayAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Update level string based on XP
userSchema.methods.updateLevel = function () {
  if (this.xp >= 600) this.level = 'Discipline Master';
  else if (this.xp >= 300) this.level = 'Focused';
  else if (this.xp >= 100) this.level = 'Consistent';
  else this.level = 'Beginner';
};

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
