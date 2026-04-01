import { GoogleGenerativeAI } from '@google/generative-ai';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import HabitLog from '../models/HabitLog.js';
import { getTodayString } from '../utils/dateUtils.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// @desc    Generate AI motivation
// @route   GET /api/motivation/generate
export const generateMotivation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = getTodayString();
    
    // Fetch user context
    const [user, habits, tasks, todayLogs] = await Promise.all([
       User.findById(userId),
       Habit.find({ userId, isActive: true }),
       Task.find({ userId }),
       HabitLog.find({ userId, date: today })
    ]);

    const habitCompletions = todayLogs.filter(l => l.completed).length;
    const taskCompletions = tasks.filter(t => t.completed && t.updatedAt >= new Date(new Date().setHours(0,0,0,0))).length;
    
    const skippedHabits = habits.filter(h => {
       const log = todayLogs.find(l => l.habitId.toString() === h._id.toString());
       return !log || !log.completed;
    }).map(h => h.title);

    const context = {
      name: user.name,
      level: user.level,
      xp: user.xp,
      habitsCount: habits.length,
      habitCompletions,
      taskCompletions,
      skippedHabits,
      streak: user.streak || 0
    };

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.json({
         success: true,
         quote: "The only way to do great work is to love what you do.",
         author: "Steve Jobs",
         funnyReminder: "Your habits are missing you more than your ex does. Get back to work!",
         suggestion: "Try breaking your biggest task into 5-minute chunks to get started.",
         isFallback: true
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a high-energy, witty, and slightly sarcastic productivity coach for a habit tracker app.
      Based on the following user progress for today:
      - Name: ${context.name}
      - Level: ${context.level} (Beginner, Consistent, Focused, Discipline Master)
      - Today's Habit Completions: ${context.habitCompletions}/${context.habitsCount}
      - Today's Task Completions: ${context.taskCompletions}
      - Skipped habits: ${context.skippedHabits.join(', ') || 'None'}
      - Overall Streak: ${context.streak}

      Provide a response in strict JSON format with the following fields:
      - quote: A powerful, short motivational quote.
      - author: The author of the quote.
      - funnyReminder: A witty, slightly roast-y, or funny reminder about their progress or skipped habits.
      - suggestion: One smart, actionable productivity hack based on their current state.

      JSON Response:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from markdown if present
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const motivation = JSON.parse(cleanJson);

    res.json({
      success: true,
      ...motivation,
      isFallback: false
    });

  } catch (error) {
    console.error('Gemini Motivation Error:', error);
    res.json({
       success: true,
       quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
       author: "Winston Churchill",
       funnyReminder: "I tried to generate a funny roast but I'm having a mid-life crisis. Just do your habits, okay?",
       suggestion: "Consistency is better than intensity. Just show up.",
       isFallback: true
    });
  }
};
