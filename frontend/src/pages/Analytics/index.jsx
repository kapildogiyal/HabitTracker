import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { analyticsAPI } from '../../api/endpoints';
import useThemeStore from '../../store/themeStore';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';
import { Flame, Trophy, CheckCircle2, Target, TrendingUp, Sparkles, Calendar } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const TIMEFRAMES = ['daily', 'weekly', 'monthly', 'yearly'];

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={clsx(
        "p-4 rounded-2xl border shadow-2xl backdrop-blur-md",
        isDark ? "bg-[#1a1628]/80 border-white/10 text-white" : "bg-white/80 border-gray-100 text-gray-900"
      )}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-sm font-black">{p.name}: {p.value}{p.name.includes('%') ? '%' : ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('weekly');
  const { isDark } = useThemeStore();

  useEffect(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    Promise.all([
      analyticsAPI.getSummary(),
      analyticsAPI.getHeatmap(monthKey),
    ])
      .then(([summaryRes, heatmapRes]) => {
        setSummary(summaryRes.data.summary);
        setHeatmap(heatmapRes.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loader />;
  if (!summary) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-6">
       <div className="w-20 h-20 rounded-[2.5rem] bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-gray-700">
         <TrendingUp className="w-10 h-10" />
       </div>
       <p className={clsx('text-xl font-black tracking-tight', isDark ? 'text-gray-500' : 'text-gray-400')}>Waiting for execution data...</p>
    </div>
  );

  const axisColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const gridColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

  const stats = (() => {
    if (timeframe === 'daily') {
      return {
        habitRate: summary.daily.habitRate,
        taskRate: summary.daily.taskRate,
        xp: summary.daily.xpEarned,
      };
    }
    const data = summary[timeframe] || [];
    if (!data.length) return { habitRate: 0, taskRate: 0, xp: 0 };
    const avgHabit = Math.round(data.reduce((acc, d) => acc + d.habits, 0) / data.length);
    const avgTask = Math.round(data.reduce((acc, d) => acc + d.tasks, 0) / data.length);
    const totalXp = data.reduce((acc, d) => acc + d.xp, 0);
    return { habitRate: avgHabit, taskRate: avgTask, xp: totalXp };
  })();

  const chartData = summary[timeframe] || summary.weekly;
  const overallProgress = Math.round((stats.habitRate + stats.taskRate) / 2) || 0;
  
  const ringData = [
    { name: 'Completed', value: overallProgress, color: '#8b5cf6' },
    { name: 'Remaining', value: 100 - overallProgress, color: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' },
  ];

  const moodScale = {
    Happy: 4,
    Neutral: 3,
    Sad: 2,
    Stressed: 1,
  };

  const moodTrend = (summary.moodTrend || []).map((entry) => ({
    ...entry,
    moodScore: entry.mood ? moodScale[entry.mood] : null,
  }));

  const days = heatmap?.days || [];
  const monthLabel = heatmap?.month || new Date().toISOString().slice(0, 7);
  const startDayIndex = days.length ? new Date(days[0].date).getDay() : 0;
  const habitCells = Array.from({ length: startDayIndex }).map((_, i) => ({ key: `h-pad-${i}`, empty: true }));
  const taskCells = Array.from({ length: startDayIndex }).map((_, i) => ({ key: `t-pad-${i}`, empty: true }));

  const getIntensityClass = (rate, base) => {
    if (!rate) return base.low;
    if (rate < 25) return base.midLow;
    if (rate < 50) return base.mid;
    if (rate < 75) return base.midHigh;
    return base.high;
  };

  const habitPalette = {
    low: isDark ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200',
    midLow: 'bg-gradient-to-br from-violet-200 to-violet-300 opacity-60',
    mid: 'bg-gradient-to-br from-violet-300 to-violet-400 opacity-80',
    midHigh: 'bg-gradient-to-br from-violet-400 to-violet-500',
    high: 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-glow-violet ring-2 ring-violet-500/20',
  };

  const taskPalette = {
    low: isDark ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200',
    midLow: 'bg-gradient-to-br from-cyan-200 to-cyan-300 opacity-60',
    mid: 'bg-gradient-to-br from-cyan-300 to-cyan-400 opacity-80',
    midHigh: 'bg-gradient-to-br from-cyan-400 to-cyan-500',
    high: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-glow-emerald ring-2 ring-cyan-500/20',
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-12 pb-20">
      
      {/* Header & Controls */}
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 px-2">
        <div className="space-y-1">
          <p className={clsx('text-[10px] font-black uppercase tracking-[0.4em]', isDark ? 'text-violet-400' : 'text-violet-600')}>Strategic Intel</p>
          <h2 className={clsx('text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Intelligence</h2>
        </div>
        
        <div className={clsx(
          'flex gap-2 p-2 rounded-[2rem] w-fit shadow-sm', 
          isDark ? 'bg-white/5 border border-white/5' : 'bg-gray-100 border border-gray-200'
        )}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={clsx(
                'px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 outline-none',
                timeframe === tf
                  ? 'bg-gradient-main text-white shadow-xl shadow-violet-500/20'
                  : isDark ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {[
          { label: 'Habit Execution', value: `${stats.habitRate}%`, icon: <CheckCircle2 className="w-5 h-5" />, gradient: 'from-violet-500 via-indigo-600 to-violet-700', shadow: 'shadow-violet-500/20' },
          { label: 'Task Throughput', value: `${stats.taskRate}%`, icon: <Target className="w-5 h-5" />, gradient: 'from-cyan-500 via-blue-600 to-cyan-700', shadow: 'shadow-cyan-500/20' },
          { label: 'Total XP Velocity', value: stats.xp.toLocaleString(), icon: <Trophy className="w-5 h-5" />, gradient: 'from-amber-400 via-orange-500 to-amber-600', shadow: 'shadow-amber-500/20' },
          { label: 'Peak Streak', value: `${summary.streaks.longest}d`, icon: <Flame className="w-5 h-5" />, gradient: 'from-rose-500 via-pink-600 to-rose-700', shadow: 'shadow-rose-500/20' },
        ].map((s, i) => (
          <motion.div key={i} variants={item} whileHover={{ scale: 1.05 }} className={clsx(`group relative overflow-hidden rounded-[3rem] p-8 text-white bg-gradient-to-br transition-all duration-500`, s.gradient, s.shadow)}>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
               <div className="w-48 h-48 rounded-full bg-white blur-3xl opacity-20" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/10 flex items-center justify-center">
                 {s.icon}
              </div>
              <div>
                <p className="text-5xl font-black tracking-tighter mb-1 leading-none">{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 mix-blend-overlay">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Architecture */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Core Progress Ring */}
        <motion.div variants={item} className={clsx('rounded-[3.5rem] p-10 border flex flex-col items-center justify-center card-hover', isDark ? 'bg-[#151221] border-[#221d35]' : 'bg-white border-gray-100 shadow-premium')}>
          <div className="w-full mb-12 text-center">
            <h3 className={clsx('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>System Efficacy</h3>
            <p className={clsx('text-[10px] font-black uppercase tracking-widest mt-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Aggregate Workflow Efficiency</p>
          </div>
          
          <div className="relative w-64 h-64 scale-110">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ringData} cx="50%" cy="50%" innerRadius={85} outerRadius={110} startAngle={90} endAngle={-270} dataKey="value" stroke="none" cornerRadius={12} paddingAngle={0}>
                  {ringData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={index === 0 ? 1 : 0.05} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={clsx('text-6xl font-black tracking-tighter', isDark ? 'text-white' : 'text-gray-900')}>{overallProgress}%</motion.span>
              <div className={clsx('mt-3 p-1 rounded-full', isDark ? 'bg-violet-500/10' : 'bg-violet-50')}>
                <div className={clsx('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', isDark ? 'bg-violet-500 text-white' : 'bg-white text-violet-600 shadow-sm')}>OPTIMAL</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Calendar Heatmap Section */}
        <motion.div variants={item} className={clsx('rounded-[3.5rem] p-8 lg:p-12 border lg:col-span-2 card-hover relative overflow-hidden', isDark ? 'bg-[#151221] border-[#221d35]' : 'bg-white border-gray-100 shadow-premium')}>
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12 pointer-events-none">
              <Calendar size={400} />
           </div>
           
           <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 relative z-10">
              <div>
                <h3 className={clsx('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Activity Matrix</h3>
                <p className={clsx('text-[10px] font-black uppercase tracking-widest mt-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Monthly Multi-Vector Analysis</p>
              </div>
              <div className={clsx('flex items-center gap-4 px-6 py-3 rounded-2xl border font-black text-xs uppercase tracking-widest', isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600')}>
                <span className="opacity-40">Period</span> {monthLabel}
              </div>
           </div>

           <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 relative z-10">
              {/* Habits Heatmap */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 rounded-full bg-violet-500" />
                      <span className={clsx('text-xs font-black uppercase tracking-[0.2em]', isDark ? 'text-violet-300' : 'text-violet-600')}>Habit Consistency</span>
                   </div>
                   <div className="flex items-center gap-1 opacity-60">
                      <span className="text-[10px] font-black mr-2">LOW</span>
                      {[...Array(4)].map((_, i) => <div key={i} className={clsx('w-2 h-2 rounded-sm', ['bg-violet-200', 'bg-violet-300', 'bg-violet-400', 'bg-violet-500'][i])} />)}
                      <span className="text-[10px] font-black ml-2">HIGH</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="grid grid-cols-7 gap-2">
                      {['S','M','T','W','T','F','S'].map(d => (
                        <div key={d} className={clsx('text-center text-[10px] font-black opacity-30', isDark ? 'text-white' : 'text-gray-900')}>{d}</div>
                      ))}
                   </div>
                   <div className="grid grid-cols-7 gap-2 sm:gap-3">
                      {habitCells.map(c => <div key={c.key} className="aspect-square" />)}
                      {days.map(day => (
                        <motion.div
                          key={`h-${day.date}`}
                          whileHover={{ scale: 1.15, zIndex: 10 }}
                          title={`${day.date}: ${day.habitCount} Habits`}
                          className={clsx(
                            'aspect-square rounded-xl border transition-all duration-300 cursor-help',
                            getIntensityClass(day.habitRate, habitPalette)
                          )}
                        />
                      ))}
                   </div>
                </div>
              </div>

              {/* Tasks Heatmap */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 rounded-full bg-cyan-400" />
                      <span className={clsx('text-xs font-black uppercase tracking-[0.2em]', isDark ? 'text-cyan-300' : 'text-cyan-600')}>Sprints Throughput</span>
                   </div>
                   <div className="flex items-center gap-1 opacity-60">
                      <span className="text-[10px] font-black mr-2">LOW</span>
                      {[...Array(4)].map((_, i) => <div key={i} className={clsx('w-2 h-2 rounded-sm', ['bg-cyan-200', 'bg-cyan-300', 'bg-cyan-400', 'bg-cyan-500'][i])} />)}
                      <span className="text-[10px] font-black ml-2">HIGH</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="grid grid-cols-7 gap-2">
                      {['S','M','T','W','T','F','S'].map(d => (
                        <div key={d} className={clsx('text-center text-[10px] font-black opacity-30', isDark ? 'text-white' : 'text-gray-900')}>{d}</div>
                      ))}
                   </div>
                   <div className="grid grid-cols-7 gap-2 sm:gap-3">
                      {taskCells.map(c => <div key={c.key} className="aspect-square" />)}
                      {days.map(day => (
                        <motion.div
                          key={`t-${day.date}`}
                          whileHover={{ scale: 1.15, zIndex: 10 }}
                          title={`${day.date}: ${day.taskCount} Tasks`}
                          className={clsx(
                            'aspect-square rounded-xl border transition-all duration-300 cursor-help',
                            getIntensityClass(day.taskRate, taskPalette)
                          )}
                        />
                      ))}
                   </div>
                </div>
              </div>
           </div>
        </motion.div>

        {/* Comparative Analysis */}
        <motion.div variants={item} className={clsx('rounded-[3.5rem] p-8 lg:p-12 border lg:col-span-3 card-hover', isDark ? 'bg-[#151221] border-[#221d35]' : 'bg-white border-gray-100 shadow-premium')}>
          <div className="flex items-center justify-between mb-12 px-2 text-center lg:text-left">
            <div>
              <h3 className={clsx('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Comparative Analysis</h3>
              <p className={clsx('text-[10px] font-black uppercase tracking-widest mt-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Multi-Vector Performance Ratios</p>
            </div>
            <div className="hidden sm:block">
               <div className="p-4 rounded-3xl bg-violet-500/10 text-violet-500"><Sparkles className="w-6 h-6 animate-pulse" /></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={timeframe === 'daily' ? summary.weekly : chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} dy={20} />
              <YAxis tick={{ fill: axisColor, fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} domain={[0, 100]} dx={-10} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 40, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }} />
              <Bar dataKey="habits" name="Habit Rate" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={24} />
              <Bar dataKey="tasks" name="Task Rate" fill="#22d3ee" radius={[8, 8, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Mood vs Productivity */}
        <motion.div variants={item} className={clsx('rounded-[3.5rem] p-8 lg:p-12 border lg:col-span-3 card-hover relative overflow-hidden', isDark ? 'bg-[#151221] border-[#221d35]' : 'bg-white border-gray-100 shadow-premium')}>
          <div className="absolute top-0 left-0 p-12 opacity-[0.02] pointer-events-none">
             <Sparkles size={400} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 relative z-10">
            <div>
              <h3 className={clsx('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Mood vs Productivity</h3>
              <p className={clsx('text-[10px] font-black uppercase tracking-widest mt-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Cognitive State & Output Correlation (Last 7 Days)</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Real-time Sync</span>
            </div>
          </div>
          
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={moodTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} dy={20} />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: axisColor, fontSize: 10, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[1, 4]}
                  ticks={[1, 2, 3, 4]}
                  tickFormatter={(value) => {
                    if (value === 4) return 'Happy';
                    if (value === 3) return 'Neutral';
                    if (value === 2) return 'Sad';
                    return 'Stress';
                  }}
                  dx={-10}
                />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: axisColor, fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} domain={[0, 100]} dx={10} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: '#22d3ee', strokeWidth: 2, strokeDasharray: '5 5' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 40, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }} />
                <Line yAxisId="left" type="monotone" dataKey="moodScore" name="Mood State" stroke="#22d3ee" strokeWidth={5} dot={{ r: 6, fill: '#22d3ee', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} connectNulls shadow="shadow-lg shadow-cyan-500/20" />
                <Line yAxisId="right" type="monotone" dataKey="productivity" name="Productivity" stroke="#8b5cf6" strokeWidth={5} dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} shadow="shadow-lg shadow-violet-500/20" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
