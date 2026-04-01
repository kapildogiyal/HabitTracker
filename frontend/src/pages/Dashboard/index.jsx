import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckSquare, Trophy, Zap, Clock, Quote, Sparkles, Award, Star, TrendingUp, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useHabitStore from '../../store/habitStore';
import useTaskStore from '../../store/taskStore';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import clsx from 'clsx';
import { analyticsAPI, motivationAPI, moodAPI } from '../../api/endpoints';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { 
  hidden: { opacity: 0, y: 30, scale: 0.95 }, 
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 20 } } 
};

export default function Dashboard() {
  const { habits, fetchHabits, logHabit } = useHabitStore();
  const { tasks, fetchTasks, toggleTask } = useTaskStore();
  const { user, updateUser } = useAuthStore();
  const { isDark } = useThemeStore();

  const [summary, setSummary] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [todayMood, setTodayMood] = useState(null);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchHabits(),
          fetchTasks(),
          analyticsAPI.getSummary().then(res => setSummary(res.data.summary)),
          motivationAPI.generate().then(res => setMotivation(res.data)),
          moodAPI.getToday().then(res => setTodayMood(res.data.mood)),
        ]);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const level = user?.level || 'Beginner';
  const xp = user?.xp || 0;
  const streak = user?.streak || 0;
  
  const dailyScore = useMemo(() => {
    if (!habits.length && !tasks.length) return 0;
    const completedHabits = habits.filter(h => h.completedToday).length;
    const today = new Date().setHours(0,0,0,0);
    const completedTasks = tasks.filter(t => t.completed && new Date(t.updatedAt) >= today).length;
    const totalItems = habits.length + tasks.length;
    return Math.round(((completedHabits + completedTasks) / totalItems) * 100);
  }, [habits, tasks]);

  // Derived info for the new informative dashboard
  const upcomingTasks = useMemo(() => 
    tasks.filter(t => !t.completed).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 4),
    [tasks]
  );

  const topStreaks = useMemo(() => 
    [...habits].sort((a,b) => b.currentStreak - a.currentStreak).slice(0, 3),
    [habits]
  );

  if (isLoading) return <div className="h-96 flex items-center justify-center font-black text-violet-500 animate-pulse uppercase tracking-[0.5em]">Syncing Objective...</div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* ================= HEADER & XP ================= */}
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-2">
        <div className="space-y-2">
          <p className={clsx('text-[10px] font-black uppercase tracking-[0.4em]', isDark ? 'text-violet-400' : 'text-violet-600')}>
            Operational Status: Optimal
          </p>
          <h1 className={clsx('text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter flex items-center gap-4', isDark ? 'text-white' : 'text-gray-900')}>
            Commander {user?.name?.split(' ')[0] || 'User'}
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </h1>
        </div>
        
        <div className={clsx(
          'flex-1 max-w-md p-6 rounded-[2.5rem] border shadow-premium relative group overflow-hidden',
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-main flex items-center justify-center text-white shadow-lg font-black text-xl">
                 {level[0]}
              </div>
              <div>
                <span className={clsx('text-lg font-black block', isDark ? 'text-white' : 'text-gray-900')}>{level} Rank</span>
                <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">{xp} XP Total</span>
              </div>
            </div>
            <div className="text-right">
               <span className="text-2xl font-black text-violet-500">{100 - (xp % 100)}</span>
               <p className="text-[8px] font-black uppercase tracking-widest opacity-50">XP to Next Rank</p>
            </div>
          </div>
          <div className={clsx('h-3 rounded-full p-1', isDark ? 'bg-black/40' : 'bg-gray-100')}>
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${xp % 100}%` }}
               className="h-full rounded-full bg-gradient-main shadow-[0_0_10px_rgba(139,92,246,0.3)]"
             />
          </div>
        </div>
      </motion.div>

      {/* ================= PRIMARY STATS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Daily Score" value={`${dailyScore}%`} icon={Zap} color="emerald" trend="+12% from avg" isDark={isDark} />
        <StatCard title="Total Streak" value={streak} icon={Flame} color="rose" trend="On Fire!" isDark={isDark} />
        <StatCard title="Active Habits" value={habits.length} icon={Star} color="amber" trend="3 pending today" isDark={isDark} />
        <StatCard title="Pending Tasks" value={tasks.filter(t => !t.completed).length} icon={CheckSquare} color="cyan" trend="Next due in 2h" isDark={isDark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ================= LEFT COLUMN (CHART & HABITS) ================= */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Performance Chart */}
          <motion.div variants={item} className={clsx(
            'rounded-[3rem] p-8 border shadow-premium overflow-hidden relative',
            isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-100'
          )}>
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className={clsx('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>Tactical Readiness</h3>
                  <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">7-Day Performance Metrics</p>
               </div>
               <div className="flex gap-2">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-500" /><span className="text-[10px] font-black uppercase tracking-widest opacity-50">Habits</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-[10px] font-black uppercase tracking-widest opacity-50">Tasks</span></div>
               </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary?.weekly || []}>
                  <defs>
                    <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2d2545' : '#f1f1f1'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: isDark ? '#4b5563' : '#9ca3af' }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#1a1628' : '#fff', border: 'none', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="habits" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorHabits)" />
                  <Area type="monotone" dataKey="tasks" stroke="#22d3ee" strokeWidth={4} fillOpacity={1} fill="url(#colorTasks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Quick Habits Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className={clsx('text-xl font-black uppercase tracking-widest', isDark ? 'text-white' : 'text-gray-900')}>Daily Deployment</h3>
               <Link to="/habits" className="text-[10px] font-black text-violet-500 uppercase tracking-widest hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.slice(0, 3).map(habit => (
                <QuickHabitCard key={habit._id} habit={habit} onLog={logHabit} isDark={isDark} user={user} updateUser={updateUser} />
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (TASKS & FEED) ================= */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Upcoming Blockers */}
          <motion.div variants={item} className={clsx(
            'rounded-[3rem] p-8 border shadow-premium',
            isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-100'
          )}>
            <div className="flex items-center justify-between mb-8">
               <h3 className={clsx('text-xl font-black', isDark ? 'text-white' : 'text-gray-900')}>Upcoming Sprints</h3>
               <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500"><Clock className="w-4 h-4" /></div>
            </div>
            <div className="space-y-4">
              {upcomingTasks.length === 0 ? (
                <p className="text-center py-10 opacity-30 font-bold italic">All sectors clear.</p>
              ) : (
                upcomingTasks.map(task => (
                  <div key={task._id} className={clsx('p-4 rounded-2xl border transition-all hover:border-cyan-500/50', isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100')}>
                    <div className="flex items-center justify-between mb-2">
                       <span className={clsx('text-[10px] font-black uppercase tracking-widest', isDark ? 'text-cyan-400' : 'text-cyan-600')}>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                       <Badge label={task.priority} variant={task.priority} size="sm" />
                    </div>
                    <p className={clsx('font-black text-sm truncate pr-2', isDark ? 'text-white' : 'text-gray-900')}>{task.title}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Hall of Fame (Streaks) */}
          <motion.div variants={item} className={clsx(
            'rounded-[3rem] p-8 border shadow-premium relative overflow-hidden',
            isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-100'
          )}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl" />
            <h3 className={clsx('text-xl font-black mb-6 flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
              Top Disciplines
              <Award className="w-4 h-4 text-amber-500" />
            </h3>
            <div className="space-y-4">
               {topStreaks.map((h, i) => (
                 <div key={h._id} className="flex items-center gap-4">
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm', i === 0 ? 'bg-amber-500 text-white shadow-lg' : isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}>
                       {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className={clsx('font-black text-xs truncate', isDark ? 'text-white' : 'text-gray-900')}>{h.title}</p>
                       <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{h.currentStreak} Day Blaze</p>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* AI Motivation Hub (Refined) */}
          <motion.div variants={item} className="p-1 rounded-[3rem] bg-gradient-main">
            <div className={clsx('h-full w-full rounded-[2.8rem] p-8 space-y-4', isDark ? 'bg-[#0a0910]' : 'bg-white')}>
               <div className="flex items-center gap-2 text-violet-500">
                  <Quote className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Neural Tip</span>
               </div>
               <p className={clsx('text-sm font-black italic leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-700')}>
                 "{motivation?.quote || 'Success is the sum of small efforts repeated daily.'}"
               </p>
            </div>
          </motion.div>
        </div>
      </div>

    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, isDark }) {
  const colors = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    cyan: 'text-cyan-500 bg-cyan-500/10',
    violet: 'text-violet-500 bg-violet-500/10',
  };

  return (
    <motion.div variants={item} className={clsx(
      'rounded-[2.5rem] p-6 border shadow-premium relative group overflow-hidden',
      isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-100'
    )}>
      <div className={clsx('absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500', colors[color].split(' ')[0].replace('text-', 'text-'))}>
         <Icon size={120} />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className={clsx('p-3 rounded-2xl transition-transform group-hover:scale-110', colors[color])}>
           <Icon className="w-5 h-5" />
        </div>
        <span className={clsx('text-[10px] font-black uppercase tracking-[0.2em]', isDark ? 'text-gray-500' : 'text-gray-400')}>
           {title}
        </span>
      </div>
      <div className={clsx('text-3xl font-black mb-2 tracking-tighter', isDark ? 'text-white' : 'text-gray-900')}>
         {value}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">{trend}</p>
    </motion.div>
  );
}

function QuickHabitCard({ habit, onLog, isDark, user, updateUser }) {
  const isCompleted = habit.completedToday;
  
  return (
    <div className={clsx(
      'p-6 rounded-[2rem] border transition-all select-none',
      isCompleted 
        ? 'bg-emerald-500/10 border-emerald-500/20' 
        : isDark ? 'bg-white/5 border-white/5 hover:border-violet-500/30' : 'bg-gray-50 border-gray-100 hover:border-violet-300'
    )}>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-xl">{habit.icon}</div>
        <p className={clsx('font-black text-sm truncate flex-1', isDark ? 'text-white' : 'text-gray-900', isCompleted && 'opacity-30 line-through')}>{habit.title}</p>
      </div>
      <button 
        onClick={() => onLog(habit._id, updateUser)}
        className={clsx(
          'w-full py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all',
          isCompleted
            ? 'bg-emerald-500 text-white shadow-lg'
            : isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-white text-gray-500 hover:bg-violet-500 hover:text-white shadow-sm'
        )}
      >
        {isCompleted ? 'Success' : 'Log Entry'}
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  const { isDark } = useThemeStore();
  return (
    <div className={clsx('flex-1 flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-dashed transition-all', isDark ? 'border-white/5 bg-white/2' : 'border-gray-100 bg-gray-50')}>
       <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-700" />
       </div>
       <p className="text-gray-500 dark:text-gray-400 font-bold text-center">{text}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
