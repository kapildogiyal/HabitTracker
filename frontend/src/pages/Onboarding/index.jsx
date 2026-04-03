import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Target, 
  Clock, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Award,
  Flame,
  Shield,
  Sparkles,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSubmitOnboardingMutation, useGetOnboardingStatusQuery } from '../../store/api/onboardingApi';
import { setOnboarding } from '../../store/slices/authSlice';
import useThemeStore from '../../store/themeStore';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const steps = [
  {
    id: 'intro',
    title: 'Welcome',
    description: 'Set up your goals, habits, and best time to work.',
    icon: Rocket,
  },
  {
    id: 'goals',
    title: 'Your Goals',
    description: 'What do you want to improve right now?',
    icon: Target,
  },
  {
    id: 'habits',
    title: 'Your Habits',
    description: 'Pick the daily habits you want to build.',
    icon: Flame,
  },
  {
    id: 'schedule',
    title: 'Best Time',
    description: 'Choose when you usually feel most focused.',
    icon: Clock,
  },
  {
    id: 'finalize',
    title: 'Ready to Start',
    description: 'Review your setup and open your dashboard.',
    icon: Zap,
  }
];

const goalOptions = [
  { id: 'health', label: 'Health', icon: Shield, color: 'bg-emerald-500' },
  { id: 'productivity', label: 'Productivity', icon: Zap, color: 'bg-amber-500' },
  { id: 'learning', label: 'Learning', icon: Sparkles, color: 'bg-cyan-500' },
  { id: 'mental', label: 'Mental wellness', icon: Shield, color: 'bg-violet-500' },
];

export default function Onboarding() {
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    goals: [],
    habits: [],
    schedule: 'morning',
    intensity: 'standard'
  });

  const [submitOnboarding, { isLoading: isSubmitting }] = useSubmitOnboardingMutation();
  const { data: status, isLoading: isLoadingStatus } = useGetOnboardingStatusQuery();

  useEffect(() => {
    if (status && !status.required) {
       navigate('/dashboard', { replace: true });
    }
  }, [status, navigate]);

  const buildOnboardingPayload = () => {
    const scheduleMap = {
      morning: { wakeUpTime: '06:30', sleepTime: '22:30' },
      afternoon: { wakeUpTime: '08:00', sleepTime: '23:30' },
      evening: { wakeUpTime: '09:30', sleepTime: '00:30' },
    };
    const motivationMap = {
      gentle: ['supportive'],
      standard: ['supportive'],
      intense: ['strict'],
    };
    const scheduleDefaults = scheduleMap[formData.schedule] || scheduleMap.morning;

    return {
      goal: formData.goals,
      selectedHabits: formData.habits,
      motivationType: motivationMap[formData.intensity] || ['supportive'],
      wakeUpTime: scheduleDefaults.wakeUpTime,
      sleepTime: scheduleDefaults.sleepTime,
      birthday: '2000-01-01',
    };
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(curr => curr - 1);
  };

  const handleComplete = async () => {
    try {
      await submitOnboarding(buildOnboardingPayload()).unwrap();
      dispatch(setOnboarding(false));
      toast.success('Setup complete. Welcome!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Setup failed. Please try again.');
    }
  };

  const toggleGoal = (id) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(id) 
        ? prev.goals.filter(g => g !== id)
        : [...prev.goals, id]
    }));
  };

  if (isLoadingStatus) return <Loader />;

  return (
    <div className={clsx('min-h-screen flex items-center justify-center p-3 sm:p-4 transition-colors relative overflow-hidden', isDark ? 'bg-[#0a0910]' : 'bg-gray-50')}>
      {/* Immersive Background */}
      <div className="absolute inset-0 mesh-gradient opacity-10 animate-pulse pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={clsx(
          'w-full max-w-4xl p-4 sm:p-10 md:p-16 rounded-[1.5rem] sm:rounded-[3rem] md:rounded-[4rem] shadow-2xl glass-card relative z-10 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-12',
          isDark ? 'shadow-black/50' : 'shadow-violet-500/10'
        )}
      >
        {/* Progress Bar */}
        <div className="w-full max-w-md flex items-center justify-between relative mb-4 sm:mb-8">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-main"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
           </div>
           {steps.map((s, idx) => (
             <div 
               key={idx}
               className={clsx(
                 'w-10 h-10 rounded-[1.2rem] flex items-center justify-center relative z-10 transition-all duration-500 border-4',
                 idx <= currentStep 
                   ? 'bg-gradient-main text-white border-transparent' 
                   : isDark ? 'bg-[#151221] border-[#2d2545] text-gray-600' : 'bg-white border-gray-100 text-gray-300'
               )}
             >
                {idx < currentStep ? <Check className="w-5 h-5 stroke-[4]" /> : <span className="text-xs font-black">{idx + 1}</span>}
             </div>
           ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full space-y-12"
          >
            <div className="space-y-3 sm:space-y-4">
               <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="inline-flex w-16 h-16 sm:w-24 sm:h-24 rounded-[1.2rem] sm:rounded-[2.5rem] bg-gradient-main items-center justify-center mb-3 sm:mb-6 shadow-2xl shadow-violet-500/30"
               >
                 {(() => {
                    const Icon = steps[currentStep].icon;
                    return <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />;
                 })()}
               </motion.div>
               <h2 className={clsx('text-2xl sm:text-4xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                 {steps[currentStep].title}
               </h2>
               <p className={clsx('text-sm sm:text-base font-bold opacity-50 max-w-lg mx-auto', isDark ? 'text-gray-300' : 'text-gray-600')}>
                 {steps[currentStep].description}
               </p>
            </div>

            {/* Step Content */}
            <div className="max-w-2xl mx-auto">
               {currentStep === 0 && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Ready to begin</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card border border-white/5 space-y-3 sm:space-y-4">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <p className="font-bold text-sm">Account ready</p>
                       </div>
                       <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card border border-white/5 space-y-3 sm:space-y-4">
                          <Rocket className="w-8 h-8 text-cyan-500 mx-auto animate-bounce" />
                          <p className="font-bold text-sm">Setup in progress</p>
                       </div>
                    </div>
                 </motion.div>
               )}

               {currentStep === 1 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {goalOptions.map((goal) => (
                      <motion.button
                        key={goal.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleGoal(goal.id)}
                        className={clsx(
                          'p-6 sm:p-10 rounded-[1.8rem] sm:rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 sm:gap-6 group',
                          formData.goals.includes(goal.id)
                            ? 'bg-gradient-main border-transparent text-white shadow-2xl shadow-violet-500/30'
                            : isDark ? 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/[0.08]' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-white'
                        )}
                      >
                         <goal.icon className={clsx('w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-110', formData.goals.includes(goal.id) ? 'text-white' : 'text-violet-500')} />
                         <span className="text-xs font-black uppercase tracking-widest leading-relaxed">{goal.label}</span>
                      </motion.button>
                    ))}
                 </div>
               )}

               {currentStep === 2 && (
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Suggested habits</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {['Deep Work', 'Hydration', 'Meditation', 'Reflection', 'Exercise'].map(h => (
                            <button
                              key={h}
                              onClick={() => setFormData(p => ({
                                ...p,
                                habits: p.habits.includes(h) ? p.habits.filter(i => i !== h) : [...p.habits, h]
                              }))}
                              className={clsx(
                                'px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest border-2 transition-all',
                                formData.habits.includes(h)
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent text-white'
                                  : isDark ? 'bg-white/5 border-white/5 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400'
                              )}
                            >
                               {h}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
               )}

               {currentStep === 3 && (
                 <div className="space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                       {[
                         { id: 'morning', label: 'Morning', time: '05:00 - 09:00' },
                         { id: 'afternoon', label: 'Afternoon', time: '12:00 - 16:00' },
                         { id: 'evening', label: 'Evening', time: '20:00 - 00:00' }
                       ].map(t => (
                         <button
                           key={t.id}
                           onClick={() => setFormData(p => ({ ...p, schedule: t.id }))}
                           className={clsx(
                             'p-8 rounded-[2.5rem] border-2 transition-all space-y-4',
                             formData.schedule === t.id
                               ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-transparent text-white'
                               : isDark ? 'bg-white/5 border-white/5 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400'
                           )}
                         >
                            <p className="text-xs font-black uppercase tracking-widest">{t.label}</p>
                            <p className="text-[10px] opacity-60">{t.time}</p>
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               {currentStep === 4 && (
                 <div className="space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card border border-white/5 text-left">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500 mb-2">Goals</p>
                          <p className="font-bold text-sm">{formData.goals.length || 0} goals selected</p>
                       </div>
                       <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card border border-white/5 text-left">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Habits</p>
                          <p className="font-bold text-sm">{formData.habits.length || 0} habits selected</p>
                       </div>
                    </div>
                    <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-main text-white space-y-2">
                       <Award className="w-10 h-10 mx-auto mb-4" />
                       <p className="text-lg font-black tracking-tight">You're ready</p>
                       <p className="text-xs font-bold opacity-80">Your dashboard will open after setup.</p>
                    </div>
                 </div>
               )}
            </div>

            {/* Navigation */}
            <div className="flex w-full max-w-md mx-auto flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 sm:pt-8">
               <motion.button
                 whileHover={{ x: -5 }}
                 onClick={handleBack}
                 disabled={currentStep === 0}
                 className={clsx(
                   'flex items-center justify-center gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-[1.2rem] sm:rounded-[2rem] text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-0',
                   isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                 )}
               >
                 <ChevronLeft className="w-5 h-5" /> Back
               </motion.button>

               <motion.button
                 whileHover={{ scale: 1.05, y: -2 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={handleNext}
                 disabled={isSubmitting}
                 className="btn-primary w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5"
               >
                 {isSubmitting ? 'Saving...' : currentStep === steps.length - 1 ? 'Start' : 'Next'}
                 {currentStep < steps.length - 1 && <ChevronRight className="w-5 h-5" />}
               </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
