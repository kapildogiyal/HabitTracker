import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Activity,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Flame,
  Laugh,
  Lightbulb,
  Quote,
  RefreshCw,
  Star,
  Zap,
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import clsx from 'clsx';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';

import { selectCurrentUser } from '../../store/slices/authSlice';
import useThemeStore from '../../store/themeStore';
import { useGetHabitsQuery } from '../../store/api/habitApi';
import { useGetTasksQuery } from '../../store/api/taskApi';
import { useGetHeatmapQuery, useGetSummaryQuery } from '../../store/api/analyticsApi';
import { useGetMotivationQuery } from '../../store/api/motivationApi';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { 
  hidden: { opacity: 0, y: 24, scale: 0.98 }, 
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 110, damping: 18 } } 
};
const TIMEFRAMES = ['weekly', 'monthly', 'yearly'];
const moodScale = { Happy: 4, Neutral: 3, Sad: 2, Stressed: 1 };

export default function Dashboard() {
  const user = useSelector(selectCurrentUser);
  const { isDark } = useThemeStore();
  const [timeframe, setTimeframe] = useState('weekly');
  const monthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const { data: habits = [], isLoading: habitsLoading } = useGetHabitsQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery();
  const { data: summaryData, isLoading: analyticsLoading } = useGetSummaryQuery();
  const { data: heatmapData, isLoading: heatmapLoading } = useGetHeatmapQuery(monthKey);
  const [motivationRefreshAt, setMotivationRefreshAt] = useState(() => Date.now());
  const [previousMotivationQuote, setPreviousMotivationQuote] = useState('');
  const {
    data: motivation,
    isFetching: motivationFetching,
  } = useGetMotivationQuery(
    { refreshAt: motivationRefreshAt, previousQuote: previousMotivationQuote },
    {
    refetchOnMountOrArgChange: true,
    }
  );
  const summary = summaryData?.summary;
  const isLoading = habitsLoading || tasksLoading || analyticsLoading || heatmapLoading;
  const userName = user?.name?.split(' ')?.[0] || 'there';
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    []
  );
  
  const completedHabits = useMemo(
    () => habits.filter((habit) => habit.completedToday),
    [habits]
  );
  const pendingHabits = useMemo(
    () => habits
      .filter((habit) => !habit.completedToday)
      .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))
      .slice(0, 4),
    [habits]
  );
  const upcomingTasks = useMemo(
    () => tasks
      .filter((task) => !task.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4),
    [tasks]
  );
  const taskStats = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayEnd = new Date().setHours(23, 59, 59, 999);
    const completedToday = tasks.filter(
      (task) => task.completed && new Date(task.updatedAt).getTime() >= todayStart
    ).length;
    const overdue = tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate).getTime() < todayStart
    ).length;
    const dueToday = tasks.filter((task) => {
      if (task.completed || !task.dueDate) return false;
      const dueTime = new Date(task.dueDate).getTime();
      return dueTime >= todayStart && dueTime <= todayEnd;
    }).length;
    return {
      completedToday,
      pending: tasks.filter((task) => !task.completed).length,
      overdue,
      dueToday,
    };
  }, [tasks]);

  const dailyScore = useMemo(() => {
    const totalItems = habits.length + tasks.length;
    if (!totalItems) return 0;
    return Math.round(((completedHabits.length + taskStats.completedToday) / totalItems) * 100);
  }, [completedHabits.length, habits.length, taskStats.completedToday, tasks.length]);

  const progressStats = useMemo(() => {
    if (!summary) return { habitRate: 0, taskRate: 0, xp: 0 };
    const rows = summary[timeframe] || [];
    if (!rows.length) return { habitRate: 0, taskRate: 0, xp: 0 };
    return {
      habitRate: Math.round(rows.reduce((sum, row) => sum + (row.habits || 0), 0) / rows.length),
      taskRate: Math.round(rows.reduce((sum, row) => sum + (row.tasks || 0), 0) / rows.length),
      xp: rows.reduce((sum, row) => sum + (row.xp || 0), 0),
    };
  }, [summary, timeframe]);

  const chartData = summary?.[timeframe] || summary?.weekly || [];
  const overallProgress = Math.round((progressStats.habitRate + progressStats.taskRate) / 2) || 0;
  const ringData = [
    { name: 'Done', value: Math.max(overallProgress, 1), color: '#8b5cf6' },
    { name: 'Left', value: Math.max(100 - overallProgress, 0), color: isDark ? '#1f2937' : '#e5e7eb' },
  ];
  const moodTrend = (summary?.moodTrend || []).map((entry) => ({
    ...entry,
    moodScore: entry.mood ? moodScale[entry.mood] : null,
  }));
  const heatmapDays = heatmapData?.days || [];
  const startPad = heatmapDays.length ? new Date(heatmapDays[0].date).getDay() : 0;

  if (isLoading) return <Loader />;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl space-y-8 p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-8 sm:pb-20"
    >
      <motion.section
        variants={item}
        className={clsx(
          'relative overflow-hidden rounded-[2.5rem] border p-7 sm:p-10',
          isDark
            ? 'border-white/10 bg-gradient-to-br from-violet-950/50 via-slate-950 to-slate-900'
            : 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50'
        )}
      >
        <div className="absolute right-[-10%] top-[-35%] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-40%] left-[20%] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(420px,1.25fr)_minmax(380px,0.95fr)]">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Pill icon={CalendarDays} label={todayLabel} tone="violet" isDark={isDark} />
              <Pill icon={Flame} label={`${user?.streak || 0} day streak`} tone="rose" isDark={isDark} />
              <Pill icon={Zap} label={`${user?.xp || 0} XP`} tone="emerald" isDark={isDark} />
            </div>

            <h1 className={clsx('max-w-xl text-4xl font-black tracking-[-0.04em] leading-[0.95] sm:text-5xl 2xl:text-6xl', isDark ? 'text-white' : 'text-slate-900')}>
              Build momentum today, {userName}.
            </h1>
            <p className={clsx('mt-5 max-w-xl text-sm font-bold leading-7 sm:text-base', isDark ? 'text-slate-300' : 'text-slate-600')}>
              Focus on your pending habits and earliest deadlines first. Your dashboard highlights what matters right now, then shows deeper performance trends below.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <HeroMetric label="Completion" value={`${dailyScore}%`} caption={`${completedHabits.length}/${habits.length} habits done`} tone="emerald" isDark={isDark} />
              <HeroMetric label="Open tasks" value={taskStats.pending} caption={`${taskStats.overdue} overdue`} tone="cyan" isDark={isDark} />
              <HeroMetric label="Earned XP" value={user?.xp || 0} caption={`${timeframe} view active`} tone="violet" isDark={isDark} />
            </div>
          </div>

          <div className={clsx('rounded-[2rem] border p-6 sm:p-8 backdrop-blur-sm min-w-0', isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/80')}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-violet-500">
                  <Activity className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.28em]">Today snapshot</span>
                </div>
                <h2 className={clsx('mt-4 text-2xl font-black tracking-tight sm:text-3xl', isDark ? 'text-white' : 'text-slate-900')}>
                  {dailyScore >= 70 ? 'Strong day in progress' : dailyScore >= 35 ? 'Momentum is building' : 'Start with one small win'}
                </h2>
                <p className={clsx('mt-3 text-sm font-bold leading-6', isDark ? 'text-slate-300' : 'text-slate-600')}>
                  {pendingHabits.length} habits left, {taskStats.dueToday} due today, and {taskStats.overdue} overdue tasks.
                </p>
              </div>
              <div className={clsx('shrink-0 rounded-[1.4rem] px-4 py-3 text-center', isDark ? 'bg-violet-500/10 text-violet-200' : 'bg-violet-50 text-violet-700')}>
                <p className="text-3xl font-black leading-none">{dailyScore}%</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em]">Today</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <SnapshotCard label="Habits done" value={`${completedHabits.length}/${habits.length}`} icon={CheckCircle2} tone="emerald" isDark={isDark} />
              <SnapshotCard label="Due today" value={taskStats.dueToday} icon={CalendarDays} tone="cyan" isDark={isDark} />
              <SnapshotCard label="Pending habits" value={pendingHabits.length} icon={Star} tone="violet" isDark={isDark} />
              <SnapshotCard label="Open tasks" value={taskStats.pending} icon={CheckSquare} tone="rose" isDark={isDark} />
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-12">
        <motion.div variants={item} className="min-w-0 lg:col-span-8">
          <Panel
            isDark={isDark}
            title="Performance trend"
            subtitle={`Habits vs tasks for ${timeframe}`}
            action={
              <SegmentedControl
                value={timeframe}
                options={TIMEFRAMES}
                onChange={setTimeframe}
                isDark={isDark}
              />
            }
          >
            <div className="mt-8 h-[320px] min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="habitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="taskFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#ececf5'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  <Area type="monotone" dataKey="habits" name="Habits" stroke="#8b5cf6" strokeWidth={4} fill="url(#habitFill)" />
                  <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#22d3ee" strokeWidth={4} fill="url(#taskFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </motion.div>

        <motion.div variants={item} className="min-w-0 lg:col-span-4">
          <Panel isDark={isDark} title="Overall progress" subtitle="Completion average">
            <div className="mt-8 flex items-center justify-center">
              <div className="relative h-56 w-56 overflow-visible">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                  <PieChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                    <Pie data={ringData} cx="50%" cy="50%" innerRadius={68} outerRadius={92} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      {ringData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={clsx('text-5xl font-black', isDark ? 'text-white' : 'text-slate-900')}>{overallProgress}%</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-violet-500">Complete</p>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <SummaryTile value={`${progressStats.habitRate}%`} label="Habit rate" color="violet" isDark={isDark} />
              <SummaryTile value={`${progressStats.taskRate}%`} label="Task rate" color="cyan" isDark={isDark} />
            </div>
          </Panel>
        </motion.div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <motion.div variants={item} className="lg:col-span-7">
          <Panel isDark={isDark} title="Today's focus queue" subtitle="Habits to protect your streak">
            <div className="mt-8 space-y-4">
              {pendingHabits.length === 0 ? (
                <EmptyState
                  isDark={isDark}
                  icon={CheckCircle2}
                  title="All habits done"
                  text="You have cleared your habit list for today. Keep that streak alive."
                />
              ) : (
                pendingHabits.map((habit) => (
                  <FocusRow
                    key={habit._id}
                    isDark={isDark}
                    icon={Star}
                    title={habit.title}
                    meta={`${habit.currentStreak || 0} day streak`}
                    badge={`${habit.xpReward || 10} XP`}
                    accent="violet"
                  />
                ))
              )}
            </div>
          </Panel>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-5">
          <Panel isDark={isDark} title="Upcoming deadlines" subtitle="Next tasks to tackle">
            <div className="mt-8 space-y-4">
              {upcomingTasks.length === 0 ? (
                <EmptyState
                  isDark={isDark}
                  icon={CheckSquare}
                  title="No pending tasks"
                  text="Nice. Add your next task when you're ready to plan ahead."
                />
              ) : (
                upcomingTasks.map((task) => <TaskRow key={task._id} task={task} isDark={isDark} />)
              )}
            </div>
          </Panel>
        </motion.div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={item}>
          <Panel isDark={isDark} title="Monthly activity" subtitle={heatmapData?.month || monthKey}>
            <div className="mt-8 grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={`${day}-${index}`} className="text-center text-[10px] font-black opacity-40">{day}</div>
              ))}
              {Array.from({ length: startPad }).map((_, index) => <div key={`pad-${index}`} className="aspect-square" />)}
              {heatmapDays.map((day) => {
                const avgRate = ((day.habitRate || 0) + (day.taskRate || 0)) / 2;
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.habitCount} habits, ${day.taskCount} tasks`}
                    className={clsx(
                      'aspect-square rounded-xl border transition-transform hover:scale-105',
                      avgRate >= 75
                        ? 'border-violet-400 bg-violet-500'
                        : avgRate >= 40
                          ? 'border-violet-400/70 bg-violet-400/70'
                          : avgRate > 0
                            ? 'border-violet-300/40 bg-violet-300/40'
                            : isDark
                              ? 'border-white/10 bg-white/5'
                              : 'border-slate-200 bg-slate-100'
                    )}
                  />
                );
              })}
            </div>
          </Panel>
        </motion.div>

        <motion.div variants={item}>
          <Panel isDark={isDark} title="Mood vs productivity" subtitle="Last 7 days">
            <div className="mt-8 h-[280px] min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <LineChart data={moodTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#ececf5'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  <Line type="monotone" dataKey="moodScore" name="Mood" stroke="#22d3ee" strokeWidth={4} dot={false} connectNulls />
                  <Line type="monotone" dataKey="productivity" name="Productivity" stroke="#8b5cf6" strokeWidth={4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </motion.div>
      </section>

      <motion.section variants={item}>
        <Panel
          isDark={isDark}
          title="Daily motivation"
          subtitle="Quote, reminder, and a small actionable tip"
          action={
            <button
              type="button"
              onClick={() => {
                setPreviousMotivationQuote(motivation?.quote || '');
                setMotivationRefreshAt(Date.now());
              }}
              className={clsx(
                'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors',
                isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              )}
            >
              <RefreshCw className={clsx('h-4 w-4', motivationFetching && 'animate-spin')} />
              Refresh
            </button>
          }
        >
          <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]">
            <div className={clsx('rounded-[1.75rem] border p-6', isDark ? 'border-violet-500/20 bg-violet-500/10' : 'border-violet-100 bg-violet-50')}>
              <div className="flex items-center gap-2 text-violet-500">
                <Quote className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em]">Quote of the day</span>
              </div>
              <p className={clsx('mt-6 text-2xl font-black italic leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                "{motivation?.quote || 'Success is the sum of small efforts repeated daily.'}"
              </p>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.26em] text-violet-500">
                - {(motivation?.author || 'HabitTrack').toUpperCase()}
              </p>
            </div>

            <MiniInsight
              icon={Laugh}
              title="Reminder"
              text={motivation?.funnyReminder || 'One small action now beats a perfect plan later.'}
              tone="rose"
              isDark={isDark}
            />
            <MiniInsight
              icon={Lightbulb}
              title="Today's tip"
              text={motivation?.suggestion || 'Pick one habit, do the first 2 minutes, and let momentum carry you.'}
              tone="emerald"
              isDark={isDark}
            />
          </div>
        </Panel>
      </motion.section>
    </motion.div>
  );
}

function Panel({ title, subtitle, action, children, isDark }) {
  return (
    <div
      className={clsx(
        'h-full rounded-[2rem] border p-6 sm:p-8',
        isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white shadow-sm'
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={clsx('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
            {title}
          </h2>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] opacity-50">
            {subtitle}
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Pill({ icon: Icon, label, tone, isDark }) {
  const toneMap = {
    violet: isDark ? 'bg-violet-500/10 text-violet-300 border-violet-500/20' : 'bg-violet-100 text-violet-700 border-violet-200',
    rose: isDark ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-rose-100 text-rose-700 border-rose-200',
    emerald: isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <div className={clsx('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em]', toneMap[tone])}>
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

function HeroMetric({ label, value, caption, tone, isDark }) {
  const toneMap = {
    emerald: isDark ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-300' : 'border-emerald-100 bg-emerald-50 text-emerald-700',
    cyan: isDark ? 'border-cyan-500/15 bg-cyan-500/10 text-cyan-300' : 'border-cyan-100 bg-cyan-50 text-cyan-700',
    violet: isDark ? 'border-violet-500/15 bg-violet-500/10 text-violet-300' : 'border-violet-100 bg-violet-50 text-violet-700',
  };

  return (
    <div className={clsx('min-w-0 rounded-[1.75rem] border p-5', toneMap[tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-5 text-4xl font-black tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-xs font-bold opacity-60">{caption}</p>
    </div>
  );
}

function MiniInsight({ icon: Icon, title, text, tone, isDark }) {
  const toneMap = {
    rose: isDark ? 'bg-rose-500/10 text-rose-200' : 'bg-rose-50 text-rose-700',
    emerald: isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className={clsx('rounded-[1.5rem] p-5', toneMap[tone])}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.22em]">{title}</span>
      </div>
      <p className="text-sm font-bold leading-6">{text}</p>
    </div>
  );
}

function SegmentedControl({ value, options, onChange, isDark }) {
  return (
    <div className={clsx('flex w-fit gap-1 rounded-[1.4rem] border p-1.5', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={clsx(
            'rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all',
            value === option
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
              : isDark
                ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                : 'text-slate-500 hover:bg-white hover:text-slate-900'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SummaryTile({ value, label, color, isDark }) {
  const toneMap = {
    violet: isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700',
    cyan: isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700',
  };

  return (
    <div className={clsx('rounded-[1.5rem] p-4 text-center', toneMap[color])}>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</p>
    </div>
  );
}

function SnapshotCard({ label, value, icon: Icon, tone, isDark }) {
  const toneMap = {
    emerald: isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
    cyan: isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700',
    violet: isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700',
    rose: isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700',
  };

  return (
    <div className={clsx('rounded-[1.5rem] p-5', toneMap[tone])}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</p>
        <Icon className="h-5 w-5 shrink-0" />
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function FocusRow({ isDark, icon: Icon, title, meta, badge, accent }) {
  const colorMap = {
    violet: isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700',
  };

  return (
    <div className={clsx('flex items-center justify-between gap-4 rounded-[1.5rem] border p-4', isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50')}>
      <div className="flex min-w-0 items-center gap-4">
        <div className={clsx('rounded-2xl p-3', colorMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={clsx('truncate text-sm font-black', isDark ? 'text-white' : 'text-slate-900')}>
            {title}
          </p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{meta}</p>
        </div>
      </div>
      <span className={clsx('shrink-0 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em]', colorMap[accent])}>
        {badge}
      </span>
    </div>
  );
}

function TaskRow({ task, isDark }) {
  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'No due date';

  return (
    <div className={clsx('rounded-[1.5rem] border p-5', isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50')}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-violet-500">
          <CalendarDays className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{dueLabel}</span>
        </div>
        <Badge label={task.priority} variant={task.priority} size="sm" />
      </div>
      <p className={clsx('truncate text-sm font-black', isDark ? 'text-white' : 'text-slate-900')}>
        {task.title}
      </p>
    </div>
  );
}

function EmptyState({ isDark, icon: Icon, title, text }) {
  return (
    <div className={clsx('rounded-[1.75rem] border border-dashed p-10 text-center', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className={clsx('mt-5 text-lg font-black', isDark ? 'text-white' : 'text-slate-900')}>
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm font-bold leading-6 opacity-60">{text}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={clsx('rounded-2xl border p-4 shadow-xl', isDark ? 'border-white/10 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900')}>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{label}</p>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.dataKey}`} className="flex items-center gap-2 text-sm font-bold">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  );
}
