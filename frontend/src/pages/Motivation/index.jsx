import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Laugh, Lightbulb, Quote, RefreshCw, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { useGetMotivationQuery } from '../../store/api/motivationApi';
import useThemeStore from '../../store/themeStore';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } } };

export default function Motivation() {
  const { isDark } = useThemeStore();
  const [refreshAt, setRefreshAt] = useState(() => Date.now());
  const [previousQuote, setPreviousQuote] = useState('');
  const { data, isLoading, isFetching } = useGetMotivationQuery({
    refreshAt,
    previousQuote,
  }, {
    refetchOnMountOrArgChange: true
  });

  const handleRegenerate = () => {
    setPreviousQuote(data?.quote || '');
    setRefreshAt(Date.now());
    toast.success('New motivation loaded');
  };

  if (isLoading) return <Loader />;

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
         className="max-w-6xl mx-auto space-y-8 sm:space-y-12 p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-12 sm:pb-20 mesh-gradient rounded-[2rem] sm:rounded-[4rem]"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
        <div className="space-y-2">
           <p className={clsx('text-[10px] font-black uppercase tracking-[0.4em]', isDark ? 'text-violet-400' : 'text-violet-600')}>Daily boost</p>
           <h2 className={clsx('text-4xl sm:text-5xl font-black tracking-tight flex items-center gap-4', isDark ? 'text-white' : 'text-gray-900')}>
              Motivation <Sparkles className="text-violet-500 w-8 h-8 animate-pulse" />
           </h2>
           <p className={clsx('text-sm lg:text-base font-bold opacity-50', isDark ? 'text-gray-300' : 'text-gray-600')}>
              Get simple quotes, reminders, and helpful tips.
           </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRegenerate}
          disabled={isFetching}
          className="btn-primary w-full md:w-auto px-6 sm:px-8 py-4 sm:py-5"
        >
          <RefreshCw className={clsx("w-5 h-5 stroke-[3]", isFetching && "animate-spin")} />
          {isFetching ? 'Loading...' : 'Refresh'}
        </motion.button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quote Card */}
        <motion.div variants={item} className={clsx('relative p-5 sm:p-10 lg:p-14 rounded-[2rem] sm:rounded-[4rem] border overflow-hidden glass-card group transition-all duration-500', isDark ? 'bg-white/[0.02]' : 'bg-white')}>
           <div className="absolute top-0 right-0 p-6 sm:p-12 opacity-5 group-hover:opacity-10 transition-opacity">
              <Quote className="w-56 h-56 text-violet-500 rotate-12" />
           </div>
           <div className="relative z-10 space-y-6 sm:space-y-10">
              <div className="w-16 h-16 rounded-[1.8rem] bg-violet-500/10 flex items-center justify-center">
                 <Quote className="w-8 h-8 text-violet-500" />
              </div>
              <p className={clsx('text-2xl sm:text-4xl font-black tracking-tight leading-tight italic', isDark ? 'text-white' : 'text-gray-900')}>
                 "{data?.quote}"
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-16 h-1 bg-violet-500/30 rounded-full" />
                 <p className="text-violet-500 font-black tracking-[0.3em] text-xs uppercase">
                    - {data?.author?.toUpperCase() || 'UNKNOWN'}
                 </p>
              </div>
           </div>
        </motion.div>

        {/* Dynamic Roast */}
        <motion.div variants={item} className="relative p-5 sm:p-10 lg:p-14 rounded-[2rem] sm:rounded-[4rem] bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white overflow-hidden shadow-2xl shadow-rose-500/20 transition-all duration-500">
           <div className="absolute -bottom-16 -right-16 opacity-10">
              <Laugh className="w-72 h-72 rotate-[-15deg]" />
           </div>
           <div className="relative z-10 space-y-10">
              <div className="w-16 h-16 rounded-[1.8rem] bg-white/20 backdrop-blur-md flex items-center justify-center">
                 <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-3 sm:space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Quick reminder</p>
                 <p className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                    {data?.funnyReminder}
                 </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 border border-white/10">
                 <ShieldCheck className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Stay honest</span>
              </div>
           </div>
        </motion.div>

        {/* Productivity Hack */}
        <motion.div variants={item} className={clsx('lg:col-span-2 relative p-5 sm:p-10 md:p-16 rounded-[2rem] sm:rounded-[4rem] border overflow-hidden glass-card transition-all duration-500', isDark ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-emerald-50 border-emerald-100')}>
           <div className="flex flex-col lg:flex-row lg:items-center gap-12">
              <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-[1.2rem] sm:rounded-[2.5rem] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                 <Lightbulb className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
              </div>
              <div className="flex-1 space-y-6">
                 <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className="px-5 py-2 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase">Simple tip</span>
                    <h3 className={clsx('text-2xl sm:text-3xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Try this today</h3>
                 </div>
                 <p className={clsx('text-lg sm:text-2xl font-bold leading-relaxed max-w-5xl opacity-80', isDark ? 'text-gray-100' : 'text-gray-800')}>
                    {data?.suggestion}
                 </p>
                 <div className="flex items-center gap-2 text-emerald-500">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Small steps help</span>
                 </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 hidden md:block p-16 opacity-5 pointer-events-none">
              <Lightbulb className="w-96 h-96 text-emerald-500" />
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
