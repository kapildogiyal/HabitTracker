import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Calendar, Sunrise, Moon, Target, ListChecks } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import { onboardingAPI } from '../../api/endpoints';

const goalOptions = ['Get Fit', 'Study More', 'Be Productive', 'Build Habits', 'Custom'];
const motivationOptions = ['Funny', 'Motivational', 'Strict', 'Friendly'];
const habitOptions = ['Drink Water', 'Workout', 'Reading', 'Meditation', 'Journaling'];

const stepIcons = [Target, Sunrise, Sparkles, Calendar, ListChecks];

export default function Onboarding() {
  const { isDark } = useThemeStore();
  const { setOnboardingRequired } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [form, setForm] = useState({
    goal: [],
    wakeUpTime: '',
    sleepTime: '',
    motivationType: [],
    birthday: '',
    selectedHabits: [],
  });

  const totalSteps = 5;
  const progress = useMemo(() => Math.round(((step + 1) / totalSteps) * 100), [step]);

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleField = (key, value) => {
    setForm((prev) => {
      const current = prev[key];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const toggleHabit = (habit) => toggleField('selectedHabits', habit);

  const validateStep = () => {
    if (step === 0) {
      if (form.goal.length === 0) {
        toast.error('Pick at least one goal');
        return false;
      }
      if (form.goal.includes('Custom') && !customGoal.trim()) {
        toast.error('Write your custom goal');
        return false;
      }
      return true;
    }
    if (step === 1) {
      if (!form.wakeUpTime || !form.sleepTime) {
        toast.error('Add wake up and sleep times');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (form.motivationType.length === 0) {
        toast.error('Pick at least one reminder style');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!form.birthday) {
        toast.error('Add your birthday');
        toast.error('Add your birthday');
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (form.selectedHabits.length === 0) {
        toast.error('Pick at least one habit');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    nextStep();
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSaving(true);
    try {
      const processedGoals = form.goal.map(g => g === 'Custom' ? customGoal.trim() : g);
      const payload = {
        ...form,
        goal: processedGoals,
      };
      await onboardingAPI.submit(payload);
      setOnboardingRequired(false);
      toast.success('Onboarding complete');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save onboarding');
    } finally {
      setIsSaving(false);
    }
  };

  const StepIcon = stepIcons[step];

  return (
    <div className={clsx('min-h-screen relative overflow-hidden', isDark ? 'bg-[#0b0a12]' : 'bg-gray-50')}>
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-gradient-to-br from-rose-500/30 via-amber-400/20 to-transparent blur-[120px]" />
      <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-transparent blur-[130px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={clsx(
            'grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-10 rounded-[36px] border shadow-2xl overflow-hidden',
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'
          )}
        >
          <div className={clsx('p-10 lg:p-12 relative', isDark ? 'bg-black/20' : 'bg-gradient-to-br from-violet-50 via-white to-cyan-50')}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <p className={clsx('text-xs font-black uppercase tracking-[0.3em]', isDark ? 'text-violet-300' : 'text-violet-500')}>Onboarding</p>
                <h1 className={clsx('text-3xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Level up your routine</h1>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={clsx(isDark ? 'text-gray-400' : 'text-gray-500')}>Progress</span>
                <span className={clsx('font-black', isDark ? 'text-white' : 'text-gray-900')}>{progress}%</span>
              </div>
              <div className={clsx('mt-3 h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-100')}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500"
                />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {['Goal Selection', 'Daily Routine', 'Motivation Style', 'Birthday', 'Habit Suggestions'].map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center border',
                      index <= step
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white border-transparent shadow-lg shadow-violet-500/30'
                        : isDark
                          ? 'border-white/10 text-gray-500'
                          : 'border-gray-200 text-gray-400'
                    )}
                  >
                    {index < step ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">0{index + 1}</span>}
                  </div>
                  <div>
                    <p className={clsx('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-800')}>{label}</p>
                    <p className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Step {index + 1} of {totalSteps}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 lg:p-12">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-goal"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className={clsx('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>What is your main goal?</h2>
                    <p className={clsx('text-sm mt-2', isDark ? 'text-gray-400' : 'text-gray-500')}>Pick a direction and we will tailor your experience.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goalOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleField('goal', option)}
                        className={clsx(
                          'px-5 py-4 rounded-2xl border text-left font-semibold transition-all flex items-center justify-between',
                          form.goal.includes(option)
                            ? 'border-transparent bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30'
                            : isDark
                              ? 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-violet-200'
                        )}
                      >
                        <span>{option}</span>
                        {form.goal.includes(option) && <Check className="w-4 h-4 ml-2" />}
                      </button>
                    ))}
                  </div>
                  {form.goal.includes('Custom') && (
                    <div>
                      <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Custom Goal</label>
                      <input
                        type="text"
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        placeholder="Describe your goal"
                        className={clsx(
                          'mt-2 w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all',
                          isDark
                            ? 'bg-white/5 border-white/10 text-white focus:border-violet-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-400'
                        )}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-routine"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className={clsx('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>Define your daily rhythm</h2>
                    <p className={clsx('text-sm mt-2', isDark ? 'text-gray-400' : 'text-gray-500')}>We will schedule reminders around your day.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Wake up time</label>
                      <div className="relative">
                        <Sunrise className={clsx('absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <input
                          type="time"
                          value={form.wakeUpTime}
                          onChange={(e) => updateField('wakeUpTime', e.target.value)}
                          className={clsx(
                            'mt-2 w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none',
                            isDark
                              ? 'bg-white/5 border-white/10 text-white focus:border-emerald-400'
                              : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-300'
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Sleep time</label>
                      <div className="relative">
                        <Moon className={clsx('absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <input
                          type="time"
                          value={form.sleepTime}
                          onChange={(e) => updateField('sleepTime', e.target.value)}
                          className={clsx(
                            'mt-2 w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none',
                            isDark
                              ? 'bg-white/5 border-white/10 text-white focus:border-indigo-400'
                              : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-300'
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-motivation"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className={clsx('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>What type of reminders do you prefer?</h2>
                    <p className={clsx('text-sm mt-2', isDark ? 'text-gray-400' : 'text-gray-500')}>Choose the voice that keeps you consistent.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {motivationOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleField('motivationType', option)}
                        className={clsx(
                          'px-5 py-4 rounded-2xl border text-left font-semibold transition-all flex items-center justify-between',
                          form.motivationType.includes(option)
                            ? 'border-transparent bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                            : isDark
                              ? 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200'
                        )}
                      >
                        <span>{option}</span>
                        {form.motivationType.includes(option) && <Check className="w-4 h-4 ml-2" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-birthday"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className={clsx('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>When is your birthday?</h2>
                    <p className={clsx('text-sm mt-2', isDark ? 'text-gray-400' : 'text-gray-500')}>We will save it for milestone rewards.</p>
                  </div>
                  <div>
                    <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Birthday</label>
                    <input
                      type="date"
                      value={form.birthday}
                      onChange={(e) => updateField('birthday', e.target.value)}
                      className={clsx(
                        'mt-2 w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all',
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-amber-400'
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-300'
                      )}
                    />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step-habits"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className={clsx('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>Pick some habit suggestions</h2>
                    <p className={clsx('text-sm mt-2', isDark ? 'text-gray-400' : 'text-gray-500')}>Select multiple habits to start strong.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {habitOptions.map((habit) => {
                      const active = form.selectedHabits.includes(habit);
                      return (
                        <button
                          key={habit}
                          type="button"
                          onClick={() => toggleHabit(habit)}
                          className={clsx(
                            'px-5 py-4 rounded-2xl border text-left font-semibold transition-all flex items-center justify-between',
                            active
                              ? 'border-transparent bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                              : isDark
                                ? 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-amber-200'
                          )}
                        >
                          <span>{habit}</span>
                          {active && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0}
                className={clsx(
                  'px-5 py-2.5 rounded-2xl font-semibold transition-all',
                  step === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'bg-white/5 text-gray-200 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                Back
              </button>
              {step < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/30"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : 'Finish Onboarding'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
