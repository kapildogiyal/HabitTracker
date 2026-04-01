import { GoogleGenerativeAI } from '@google/generative-ai';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { getTodayString } from '../utils/dateUtils.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// @desc    Generate AI suggestions
// @route   GET /api/suggestions/generate
export const generateSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = getTodayString();

    const [habits, todayLogs] = await Promise.all([
      Habit.find({ userId, isActive: true }),
      HabitLog.find({ userId, date: today }),
    ]);

    const completedHabits = todayLogs.filter((log) => log.completed).map((log) => log.habitId.toString());
    const skippedHabits = habits
      .filter((habit) => !completedHabits.includes(habit._id.toString()))
      .map((habit) => habit.title);

    const completionRate = habits.length
      ? Math.round((completedHabits.length / habits.length) * 100)
      : 0;

    const context = {
      habits: habits.map((habit) => habit.title),
      completionRate,
      skippedHabits,
    };

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.json({
        success: true,
        productivitySuggestion: 'Focus on one skipped habit and finish it before lunch.',
        newHabitsSuggestion: 'Try adding a short stretching habit to boost energy.',
        isFallback: true,
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a productivity coach for a habit tracker.
User habits: ${context.habits.join(', ') || 'None'}
Completion rate today: ${context.completionRate}%
Skipped habits: ${context.skippedHabits.join(', ') || 'None'}

Return strict JSON with:
- productivitySuggestion: a concise, actionable tip (max 18 words)
- newHabitsSuggestion: one new habit idea based on their habits (max 14 words)

JSON Response:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanJson = text.replace(/```json|```/g, '').trim();
      let suggestions;
      try {
        suggestions = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('AI Suggestion Parse Error:', parseError, text);
        return res.json({
          success: true,
          productivitySuggestion: 'Focus on your most important high-priority task first.',
          newHabitsSuggestion: 'Consider a 5-minute reflection at the end of your day.',
          isFallback: true,
        });
      }

      res.json({
        success: true,
        ...suggestions,
        isFallback: false,
      });
    } catch (aiError) {
      console.error('Gemini API Error in suggestions:', aiError);
      res.json({
        success: true,
        productivitySuggestion: 'Break your biggest goal into 3 small, immediate steps.',
        newHabitsSuggestion: 'Try a 10-minute focus session for your hardest task.',
        isFallback: true,
      });
    }
  } catch (error) {
    next(error);
  }
};
