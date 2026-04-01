import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const FALLBACK_MESSAGES = {
  Funny: {
    default: 'Your goals are waiting. :)',
    morning_motivation: 'Rise and grind. Your goals miss you already.',
    habit_reminder: 'That habit is waving at you from the sidelines.',
    task_reminder: 'Your task is starting soon. No hiding.',
    inactive_user: 'We saved your seat. Come back and crush it.',
    streak_protection: 'Streak in danger. Time to swoop in.',
    completion_celebration: 'All tasks done. Victory dance optional.',
    weekly_report: 'Sunday check-in: you survived and leveled up.',
  },
  Strict: {
    default: 'You skipped again.',
    morning_motivation: 'Wake up. Start now.',
    habit_reminder: 'Do the habit. No excuses.',
    task_reminder: 'Task starts soon. Be ready.',
    inactive_user: 'You have been inactive. Return and execute.',
    streak_protection: 'Streak at risk. Complete a habit.',
    completion_celebration: 'All tasks complete. Stay consistent.',
    weekly_report: 'Weekly report is ready. Review it.',
  },
  Motivational: {
    default: 'You are improving daily.',
    morning_motivation: 'New day, new progress. Let us go.',
    habit_reminder: 'Small steps now create big wins later.',
    task_reminder: 'You are ready for this. Focus and finish.',
    inactive_user: 'You can restart today. Your goals still believe in you.',
    streak_protection: 'Protect your streak. You are so close.',
    completion_celebration: 'Everything is done. Celebrate your momentum.',
    weekly_report: 'Your weekly progress is ready. Keep building.',
  },
  Friendly: {
    default: 'Quick check-in: you have got this.',
    morning_motivation: 'Good morning! Let us make today feel great.',
    habit_reminder: 'Friendly reminder to wrap up your habit.',
    task_reminder: 'Your task starts soon. I am cheering for you.',
    inactive_user: 'We missed you. Ready to jump back in?',
    streak_protection: 'Your streak is close. One habit to save it.',
    completion_celebration: 'Nice work finishing everything today!',
    weekly_report: 'Sunday summary is ready whenever you are.',
  },
};

const normalizePersonality = (value) => {
  if (!value) return 'Motivational';
  
  // Handle array input (from recent onboarding update)
  const baseValue = Array.isArray(value) ? value[0] : value;
  if (!baseValue || typeof baseValue !== 'string') return 'Motivational';

  const key = baseValue.toLowerCase();
  if (key === 'funny') return 'Funny';
  if (key === 'strict') return 'Strict';
  if (key === 'friendly') return 'Friendly';
  return 'Motivational';
};

const getFallbackMessage = (personality, type) => {
  const messages = FALLBACK_MESSAGES[personality] || FALLBACK_MESSAGES.Motivational;
  return messages[type] || messages.default;
};

export const generatePersonalityMessage = async ({ personality, type, context }) => {
  const personalityKey = normalizePersonality(personality);

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return getFallbackMessage(personalityKey, type);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a ${personalityKey} AI coach for a habit tracker app. 
Write a short push notification message (max 18 words) for the notification type: ${type}.
Context: ${JSON.stringify(context)}
Tone rules:
- Funny: playful, light, slightly witty.
- Strict: direct, no fluff.
- Motivational: uplifting and encouraging.
- Friendly: warm and supportive.
Return plain text only, no quotes.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/\n/g, ' ').trim();
    return text || getFallbackMessage(personalityKey, type);
  } catch (error) {
    console.error('AI Personality generation error:', error);
    return getFallbackMessage(personalityKey, type);
  }
};
