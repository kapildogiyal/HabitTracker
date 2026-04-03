import { GoogleGenerativeAI } from '@google/generative-ai';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import HabitLog from '../models/HabitLog.js';
import { getTodayString } from '../utils/dateUtils.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const fallbackMotivations = [
  {
    quote: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    funnyReminder: 'Your habits are missing you more than your ex does. Get back to work!',
    suggestion: 'Try breaking your biggest task into 5-minute chunks to get started.',
  },
  {
    quote: 'Success is the sum of small efforts repeated day in and day out.',
    author: 'Robert Collier',
    funnyReminder: 'Your to-do list did not disappear. It is just silently judging you.',
    suggestion: 'Pick one tiny habit and complete it right now to build momentum.',
  },
  {
    quote: 'It always seems impossible until it is done.',
    author: 'Nelson Mandela',
    funnyReminder: 'The procrastination Olympics are over. Time to win something real.',
    suggestion: 'Start with the easiest pending task, then move to the hardest one.',
  },
];

const pickFallbackMotivation = () =>
  fallbackMotivations[Math.floor(Math.random() * fallbackMotivations.length)];

const pickFallbackAvoidingQuote = (quoteToAvoid = '') => {
  if (!quoteToAvoid) return pickFallbackMotivation();
  const filtered = fallbackMotivations.filter((item) => item.quote !== quoteToAvoid);
  const pool = filtered.length ? filtered : fallbackMotivations;
  return pool[Math.floor(Math.random() * pool.length)];
};

const parseMotivationJson = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw error;
    return JSON.parse(cleaned.slice(start, end + 1));
  }
};

// @desc    Generate AI motivation
// @route   GET /api/motivation/generate
export const generateMotivation = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const userId = req.user.id;
    const previousQuote = String(req.query.previousQuote || '');
    const today = getTodayString();
    const creativitySeed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    
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
      const fallback = pickFallbackAvoidingQuote(previousQuote);
      return res.json({
         success: true,
         ...fallback,
         isFallback: true
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 1,
        topP: 0.95,
      },
    });

    const prompt = `
      You are a high-energy, witty, and slightly sarcastic productivity coach for a habit tracker app.
      Based on the following user progress for today:
      - Name: ${context.name}
      - Level: ${context.level} (Beginner, Consistent, Focused, Discipline Master)
      - Today's Habit Completions: ${context.habitCompletions}/${context.habitsCount}
      - Today's Task Completions: ${context.taskCompletions}
      - Skipped habits: ${context.skippedHabits.join(', ') || 'None'}
      - Overall Streak: ${context.streak}
      - Creativity Seed: ${creativitySeed}

      Provide a response in strict JSON format with the following fields:
      - quote: A powerful, short motivational quote.
      - author: The author of the quote.
      - funnyReminder: A witty, slightly roast-y, or funny reminder about their progress or skipped habits.
      - suggestion: One smart, actionable productivity hack based on their current state.

      Important:
      - Use the creativity seed to vary the response on each refresh.
      - Do not repeat the exact same quote/reminder/suggestion every time.
      - Previous quote to avoid repeating: ${previousQuote || 'None'}

      JSON Response:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let motivation = parseMotivationJson(text);
    if (previousQuote && motivation?.quote === previousQuote) {
      const fallback = pickFallbackAvoidingQuote(previousQuote);
      motivation = {
        ...fallback,
      };
    }

    res.json({
      success: true,
      ...motivation,
      isFallback: false
    });

  } catch (error) {
    console.error('Gemini Motivation Error:', error);
    const previousQuote = String(req.query.previousQuote || '');
    const fallback = pickFallbackAvoidingQuote(previousQuote);
    res.json({
       success: true,
       ...fallback,
       isFallback: true
    });
  }
};
