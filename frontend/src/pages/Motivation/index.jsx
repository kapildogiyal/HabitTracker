import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Laugh, Lightbulb, Quote, RefreshCw } from 'lucide-react';
import { motivationAPI } from '../../api/endpoints';
import useThemeStore from '../../store/themeStore';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } } };

export default function Motivation() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useThemeStore();

  const fetchMotivation = async () => {
    setIsLoading(true);
    try {
      const res = await motivationAPI.generate();
      setData(res.data);
    } catch (err) {
      toast.error('AI is taking a nap. Try again later!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMotivation();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="max-w-5xl mx-auto space-y-8 pb-10"
      data-ver="CHECK_MARKER_V2"
    >
      
      {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
               <h2 className={clsx('text-2xl sm:text-3xl font-black flex items-center gap-3', isDark ? 'text-white' : 'text-gray-900')}>
                  AI Motivation Hub <Sparkles className="text-violet-500 w-6 h-6 sm:w-8 sm:h-8" />
          </h2>
               <p className={clsx('text-xs sm:text-sm mt-1 font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Personalized roasts, quotes, and hacks from your AI coach.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchMotivation}
               className="px-4 py-3 sm:p-4 rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-600/30 flex items-center gap-2 font-bold text-xs sm:text-sm"
        >
               <RefreshCw className={clsx("w-4 h-4 sm:w-5 sm:h-5", isLoading && "animate-spin")} />
          <span>Regenerate AI</span>
        </motion.button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-10">
        
        {/* Quote Card */}
      <motion.div variants={item} className={clsx('relative p-6 sm:p-8 lg:p-10 rounded-[3rem] border overflow-hidden group transition-all duration-500', isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-100 shadow-2xl shadow-gray-200/50')}>
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Quote className="w-48 h-48 text-violet-500 rotate-12" />
           </div>
           <div className="relative z-10 space-y-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-3xl bg-violet-500/10 flex items-center justify-center">
                 <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-violet-500" />
              </div>
              <p className={clsx('text-2xl sm:text-3xl font-bold leading-tight italic tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                 "{data?.quote}"
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-1 bg-violet-500/30 rounded-full" />
                 <p className={clsx('text-violet-500 font-black tracking-widest text-sm uppercase')}>
                    — {data?.author}
                 </p>
              </div>
           </div>
        </motion.div>

        {/* Funny Reminder (ROAST) */}
      <motion.div variants={item} className="relative p-6 sm:p-8 lg:p-10 rounded-[3rem] bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white overflow-hidden shadow-2xl shadow-rose-500/30 transition-all duration-500">
           <div className="absolute -bottom-12 -right-12 opacity-20">
              <Laugh className="w-64 h-64 rotate-[-15deg]" />
           </div>
           <div className="relative z-10 space-y-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                 <Laugh className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                 <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-2">The Real Talk</p>
                 <p className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                    {data?.funnyReminder}
                 </p>
              </div>
           </div>
        </motion.div>

        {/* Productivity Hack */}
        <motion.div variants={item} className={clsx('lg:col-span-2 relative p-6 sm:p-8 lg:p-10 rounded-[3rem] border overflow-hidden bg-gradient-to-br transition-all duration-500', isDark ? 'bg-[#151221] border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-100 shadow-2xl shadow-emerald-200/40')}>
           <div className="flex flex-col md:flex-row md:items-center gap-10">
              <div className="shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                 <Lightbulb className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-widest uppercase">PRO TIP</span>
                    <h3 className={clsx('text-xl sm:text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>SYSTEM OPTIMIZATION</h3>
                 </div>
                 <p className={clsx('text-base sm:text-xl font-medium leading-relaxed max-w-4xl', isDark ? 'text-emerald-400/90' : 'text-emerald-800/80')}>
                    {data?.suggestion}
                 </p>
              </div>
           </div>
           <div className="absolute top-0 right-0 p-12 opacity-5">
              <Lightbulb className="w-80 h-80 text-emerald-500" />
           </div>
        </motion.div>

      </div>

    </motion.div>
  );
}
