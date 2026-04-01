import UserPreferences from '../models/UserPreferences.js';

const REQUIRED_FIELDS = [
  'goal',
  'wakeUpTime',
  'sleepTime',
  'motivationType',
  'birthday',
  'selectedHabits',
];

const getMissingFields = (prefs) => {
  const missing = [];

  if (!Array.isArray(prefs.goal) || prefs.goal.length === 0) missing.push('goal');
  if (!prefs.wakeUpTime) missing.push('wakeUpTime');
  if (!prefs.sleepTime) missing.push('sleepTime');
  if (!Array.isArray(prefs.motivationType) || prefs.motivationType.length === 0) {
    missing.push('motivationType');
  }
  if (!prefs.birthday) missing.push('birthday');
  if (!Array.isArray(prefs.selectedHabits) || prefs.selectedHabits.length === 0) {
    missing.push('selectedHabits');
  }

  return missing;
};

// @desc    Get onboarding status
// @route   GET /api/onboarding/status
export const getOnboardingStatus = async (req, res, next) => {
  try {
    const prefs = await UserPreferences.findOne({ userId: req.user.id });
    if (!prefs) {
      return res.json({
        success: true,
        required: true,
        missing: REQUIRED_FIELDS,
        preferences: null,
      });
    }

    const missing = getMissingFields(prefs);

    res.json({
      success: true,
      required: missing.length > 0,
      missing,
      preferences: prefs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save onboarding preferences
// @route   POST /api/onboarding/submit
export const saveOnboarding = async (req, res, next) => {
  try {
    const parseArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) return [val.trim()];
      return [];
    };

    const payload = {
      goal: parseArray(req.body.goal),
      wakeUpTime: req.body.wakeUpTime,
      sleepTime: req.body.sleepTime,
      motivationType: parseArray(req.body.motivationType),
      birthday: req.body.birthday,
      selectedHabits: parseArray(req.body.selectedHabits),
    };

    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: req.user.id },
      { ...payload, userId: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );

    const missing = getMissingFields(preferences);

    res.status(201).json({
      success: true,
      preferences,
      required: missing.length > 0,
      missing,
    });
  } catch (error) {
    next(error);
  }
};
