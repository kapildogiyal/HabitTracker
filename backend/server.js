import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import habitRoutes from './src/routes/habitRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import motivationRoutes from './src/routes/motivationRoutes.js';
import onboardingRoutes from './src/routes/onboardingRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import friendRoutes from './src/routes/friendRoutes.js';
import challengeRoutes from './src/routes/challengeRoutes.js';
import moodRoutes from './src/routes/moodRoutes.js';
import suggestionRoutes from './src/routes/suggestionRoutes.js';
import { configureWebPush } from './src/services/notificationService.js';
import { startNotificationScheduler } from './src/services/notificationScheduler.js';
import cron from 'node-cron';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🚀 HabitTrack API is running!', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/motivation', motivationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/suggestions', suggestionRoutes);

// Notifications
configureWebPush();
startNotificationScheduler(cron);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});

export default app;
