import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Calendar, Tag, Play, Pause, Square, Clock, Zap } from 'lucide-react';
import { 
  useGetTasksQuery, 
  useCreateTaskMutation, 
  useUpdateTaskMutation, 
  useDeleteTaskMutation, 
  useToggleTaskMutation, 
  useControlTimerMutation 
} from '../../store/api/taskApi';
import useThemeStore from '../../store/themeStore';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const FILTERS = ['all', 'todo', 'inprogress', 'done'];
const defaultForm = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '' };

function LiveTimer({ accumulatedTime, timerLastStarted, isRunning, isDark }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning || !timerLastStarted) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerLastStarted]);

  const currentSessionTime =
    isRunning && timerLastStarted
      ? Math.max(0, now - new Date(timerLastStarted).getTime())
      : 0;
  const totalMs = (accumulatedTime || 0) + currentSessionTime;
  const totalSeconds = Math.floor(totalMs / 1000);
  
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const timeStr = [
    h > 0 ? String(h).padStart(2, '0') : null,
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].filter(Boolean).join(':');

  return (
    <div className={clsx(
      "font-mono font-black text-xs tracking-[0.2em] flex items-center gap-3 px-4 py-2 rounded-2xl transition-all shadow-lg", 
      isRunning 
        ? "bg-cyan-500 text-white shadow-cyan-500/30 animate-pulse" 
        : (isDark ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-400 shadow-none")
    )}>
      <Clock className={clsx("w-3.5 h-3.5", isRunning && "animate-spin-slow")} />
      {timeStr}
    </div>
  );
}

export default function Tasks() {
  const { isDark } = useThemeStore();
  
  const [filter, setFilter] = useState('all');
  const { data: tasks = [], isLoading } = useGetTasksQuery();
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [toggleTask] = useToggleTaskMutation();
  const [controlTimer] = useControlTimerMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState('');
  const [pomodoroPhase, setPomodoroPhase] = useState('focus');
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(1500);

  useEffect(() => {
    if (!isPomodoroRunning) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          const nextPhase = pomodoroPhase === 'focus' ? 'break' : 'focus';
          setPomodoroPhase(nextPhase);
          return nextPhase === 'focus' ? 1500 : 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroPhase]);

  const openAdd = () => { setEditingTask(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (t) => {
    setEditingTask(t);
    setForm({ title: t.title, description: t.description || '', priority: t.priority, status: t.status, dueDate: t.dueDate ? t.dueDate.split('T')[0] : '', tags: t.tags?.join(', ') || '' });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
    if (editingTask) {
      await updateTask({ id: editingTask._id, ...data });
    } else {
      await createTask(data);
    }
    closeModal();
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const focusedTask = useMemo(
    () => tasks.find((t) => t._id === focusedTaskId) || activeTasks[0],
    [tasks, focusedTaskId, activeTasks]
  );

  const handleStartFocus = () => {
    const defaultTask = activeTasks[0];
    if (!defaultTask) {
      toast('Add an active task first to start focus mode.');
      setIsFocusOpen(false);
      openAdd();
      return;
    }
    setFocusedTaskId(defaultTask?._id || '');
    setPomodoroPhase('focus');
    setRemainingSeconds(1500);
    setIsPomodoroRunning(true);
    setIsFocusOpen(true);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (isLoading) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8 p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-8 sm:pb-20">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={clsx(
          'rounded-[2.5rem] border p-8 sm:p-10 flex flex-col md:flex-row md:items-end justify-between gap-8',
          isDark ? 'bg-gradient-to-br from-cyan-950/40 via-slate-950 to-slate-900 border-white/10' : 'bg-gradient-to-br from-cyan-50 via-white to-white border-cyan-100'
        )}
      >
        <div className="space-y-4 max-w-2xl">
          <p className={clsx('text-[10px] font-black uppercase tracking-[0.24em]', isDark ? 'text-cyan-300' : 'text-cyan-700')}>Task management</p>
          <h2 className={clsx('text-4xl sm:text-6xl font-black tracking-[-0.04em] leading-[0.95]', isDark ? 'text-white' : 'text-gray-900')}>Plan focused work</h2>
          <p className={clsx('text-sm sm:text-base font-bold leading-7', isDark ? 'text-slate-300' : 'text-gray-600')}>
            {tasks.filter(t => t.completed).length} completed / {tasks.filter(t => !t.completed).length} active. Sort work by status, track deadlines, and use focus mode when a task needs deep work.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleStartFocus}
            className="btn-secondary px-6 sm:px-8"
          >
            <Zap className="w-4 h-4 text-cyan-500" /> Start Focus
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={openAdd}
            className="btn-primary px-8 sm:px-10"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Add Task
          </motion.button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className={clsx(
        'flex flex-wrap gap-2 p-2 rounded-[1.5rem] w-full sm:w-fit border',
        isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
      )}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-4 sm:px-6 py-3 rounded-2xl text-xs font-black capitalize transition-colors',
              filter === f
                ? 'bg-cyan-500 text-white'
                : isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            {f === 'inprogress' ? 'In progress' : f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyTaskState onAdd={openAdd} isDark={isDark} filter={filter} />
      ) : (
        <div className="grid gap-6 px-2">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => {
              const timerStatus = task.timerStatus || 'idle';
              const isRunning = timerStatus === 'running';

              return (
                <motion.div
                  key={task._id}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  className={clsx(
                    'group relative rounded-[2rem] border overflow-hidden transition-all',
                    isDark ? 'bg-slate-900/80 border-white/10 hover:border-cyan-500/30' : 'bg-white border-gray-200 shadow-sm hover:border-cyan-200',
                    isRunning && !task.completed && (isDark ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-cyan-300 bg-cyan-50'),
                    task.completed && 'opacity-40 grayscale-[0.5]'
                  )}
                >
                  <div className={clsx('h-2 w-full', task.priority === 'urgent' ? 'bg-rose-500' : task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400')} />

                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-6">
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    {/* Unique Checkbox UI */}
                    <motion.button
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => toggleTask(task._id)}
                      className={clsx(
                        'w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 mt-1 transition-all duration-700',
                        task.completed 
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-500/50 shadow-emerald-500/30' 
                          : isDark ? 'border-white/10 hover:border-cyan-500 bg-white/5' : 'border-gray-100 hover:border-cyan-400 bg-white'
                      )}
                    >
                      {task.completed && <Check className="w-7 h-7 text-white stroke-[4]" />}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 flex-wrap mb-3">
                        <h3 className={clsx(
                          'text-xl sm:text-2xl font-black transition-all truncate pr-2 tracking-tight',
                          isDark ? 'text-white' : 'text-gray-900', 
                          task.completed && 'line-through decoration-emerald-500/50 decoration-4'
                        )}>
                          {task.title}
                        </h3>
                        {isRunning && (
                          <div className="px-3 py-2 rounded-full bg-cyan-500 text-white text-[10px] font-black uppercase tracking-[0.14em] flex items-center gap-2 shadow-lg shadow-cyan-500/30 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Running
                          </div>
                        )}
                        <Badge label={task.priority} variant={task.priority} size="sm" />
                        <span className={clsx('text-[10px] font-black uppercase tracking-[0.12em] px-3 py-2 rounded-full', isDark ? 'bg-white/5 text-slate-300' : 'bg-gray-100 text-gray-600')}>
                          {task.status === 'inprogress' ? 'In progress' : task.status}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className={clsx('text-sm font-bold mb-4 line-clamp-2 leading-relaxed opacity-60', isDark ? 'text-gray-300' : 'text-gray-500')}>
                           {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 flex-wrap">
                        {task.dueDate && (
                          <span className={clsx('text-[10px] uppercase font-black tracking-[0.12em] flex items-center gap-2 px-3 py-2 rounded-full', isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-500')}>
                            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.tags?.map(tag => (
                          <span key={tag} className={clsx('text-[10px] flex items-center gap-1.5 font-black uppercase tracking-[0.12em] px-3 py-2 rounded-full', isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700')}>
                            <Tag className="w-3.5 h-3.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side controls */}
                  <div className={clsx('flex flex-wrap lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 lg:pl-6 lg:border-l', isDark ? 'lg:border-white/10' : 'lg:border-gray-100')}>
                    {!task.completed && (
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <LiveTimer accumulatedTime={task.accumulatedTime} timerLastStarted={task.timerLastStarted} isRunning={isRunning} isDark={isDark} />
                        
                        <div className={clsx('flex items-center gap-2 p-1.5 rounded-xl', isDark ? 'bg-white/5' : 'bg-gray-100/50')}>
                          {timerStatus === 'idle' && (
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={() => controlTimer({ id: task._id, action: 'start' })} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-cyan-500 text-white shadow-xl shadow-cyan-500/30 transition-all">
                              <Play className="w-5 h-5 fill-current" />
                            </motion.button>
                          )}
                          {(timerStatus === 'running' || timerStatus === 'paused') && (
                            <>
                              <motion.button 
                                whileHover={{ scale: 1.15 }} 
                                whileTap={{ scale: 0.85 }} 
                                onClick={() => controlTimer({ id: task._id, action: timerStatus === 'running' ? 'pause' : 'start' })} 
                                className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl transition-all', timerStatus === 'running' ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-emerald-500 text-white shadow-emerald-500/30')}
                              >
                                {timerStatus === 'running' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={() => controlTimer({ id: task._id, action: 'stop' })} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-rose-500 text-white shadow-xl shadow-rose-500/30 transition-all">
                                <Square className="w-5 h-5 fill-current" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                       <button onClick={() => openEdit(task)} className={clsx('px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.12em] transition-colors', isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
                         Edit
                       </button>
                       <button onClick={() => deleteTask(task._id)} className={clsx('p-3 rounded-2xl transition-colors', isDark ? 'text-gray-500 hover:text-rose-300 hover:bg-rose-500/10' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50')}>
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingTask ? 'Edit Task' : 'Add Task'}>
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
          <FormInput label="Task Name" required value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="What do you need to do?" isDark={isDark} />
          <FormTextarea label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Add more details..." isDark={isDark} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <FormSelect label="Priority" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} options={['low', 'medium', 'high', 'urgent']} isDark={isDark} />
            <FormSelect label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={['todo', 'inprogress', 'done']} isDark={isDark} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <FormInput label="Due Date" type="date" value={form.dueDate} onChange={v => setForm(f => ({ ...f, dueDate: v }))} isDark={isDark} />
             <FormInput label="Tags" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="work, personal, health" isDark={isDark} />
          </div>
          
          <div className="flex gap-4 pt-10 mt-6 border-t border-white/5">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1 py-5">Cancel</button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn-primary flex-1 py-4"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusOpen && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] overflow-y-auto"
          >
            <div className={clsx('fixed inset-0', isDark ? 'bg-[#0a0910]' : 'bg-white')} />
            <div className="absolute inset-0 mesh-gradient opacity-30" />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, y: 24 }}
              transition={{ duration: 0.45, type: 'spring', damping: 22, stiffness: 120 }}
              className="relative z-10 min-h-screen px-4 py-6 sm:px-8 sm:py-8"
            >
              <div className="mx-auto max-w-6xl">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className={clsx('text-[10px] font-black uppercase tracking-[0.5em]', isDark ? 'text-cyan-300' : 'text-cyan-700')}>
                      Focus Mode
                    </p>
                    <h2 className={clsx('mt-3 text-2xl sm:text-5xl font-black tracking-[-0.04em]', isDark ? 'text-white' : 'text-gray-900')}>
                      {pomodoroPhase === 'focus' ? 'Deep work session' : 'Recovery break'}
                    </h2>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setIsFocusOpen(false)}
                    className={clsx(
                      'px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] border transition-all',
                      isDark ? 'text-gray-200 bg-white/5 border-white/10 hover:bg-white/10' : 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100'
                    )}
                  >
                    Exit Focus
                  </motion.button>
                </div>

                <div className={clsx(
                  'mt-8 rounded-[2rem] sm:rounded-[2.5rem] border p-5 sm:p-12',
                  isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-gray-200'
                )}>
                  <div className="grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:items-center">
                    <div className="text-center xl:text-left">
                      <div className={clsx(
                        'inline-flex items-center gap-3 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em]',
                        pomodoroPhase === 'focus'
                          ? isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'
                          : isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      )}>
                        <span className={clsx('h-2 w-2 rounded-full', pomodoroPhase === 'focus' ? 'bg-cyan-400' : 'bg-emerald-400')} />
                        {pomodoroPhase === 'focus' ? 'Focus interval' : 'Break interval'}
                      </div>

                      <div className={clsx(
                        'mt-8 font-mono text-5xl sm:text-8xl lg:text-9xl font-black leading-none tracking-[-0.06em]',
                        pomodoroPhase === 'focus'
                          ? isDark ? 'text-cyan-300' : 'text-cyan-600'
                          : isDark ? 'text-emerald-300' : 'text-emerald-600'
                      )}>
                        {formatTime(remainingSeconds)}
                      </div>

                      <p className={clsx('mt-6 text-sm sm:text-base font-bold leading-7 max-w-2xl mx-auto xl:mx-0', isDark ? 'text-gray-300' : 'text-gray-600')}>
                        Work in a focused 25-minute sprint, then take a 5-minute break. Keep one task selected so your effort stays directed.
                      </p>

                      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4">
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => setIsPomodoroRunning((prev) => !prev)}
                          className={clsx(
                            'w-full sm:w-auto px-8 sm:px-10 py-5 rounded-[1.75rem] text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] shadow-2xl transition-all min-w-0 sm:min-w-[180px]',
                            isPomodoroRunning ? 'bg-amber-500 text-white' : 'bg-cyan-500 text-white'
                          )}
                        >
                          {isPomodoroRunning ? 'Pause' : 'Start'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => {
                            setIsPomodoroRunning(false);
                            setPomodoroPhase('focus');
                            setRemainingSeconds(1500);
                          }}
                          className={clsx(
                            'w-full sm:w-auto px-8 sm:px-10 py-5 rounded-[1.75rem] text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] border transition-all min-w-0 sm:min-w-[180px]',
                            isDark ? 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          )}
                        >
                          Reset
                        </motion.button>
                      </div>
                    </div>

                    <div className={clsx(
                      'rounded-[2rem] border p-6 sm:p-8',
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    )}>
                      <p className={clsx('text-[10px] font-black uppercase tracking-[0.3em]', isDark ? 'text-cyan-300' : 'text-cyan-700')}>
                        Current Task
                      </p>
                      <h3 className={clsx('mt-5 text-2xl sm:text-4xl font-black tracking-tight break-words', isDark ? 'text-white' : 'text-gray-900')}>
                        {focusedTask?.title || 'No task selected'}
                      </h3>
                      <p className={clsx('mt-4 text-sm font-bold leading-7 min-h-[56px]', isDark ? 'text-gray-300' : 'text-gray-600')}>
                        {focusedTask?.description || 'Pick a task from the list below before starting your focus sprint.'}
                      </p>

                      <select
                        value={focusedTask?._id || ''}
                        onChange={(e) => setFocusedTaskId(e.target.value)}
                        className={clsx(
                          'mt-8 w-full px-6 py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.18em] border outline-none cursor-pointer transition-all',
                          isDark ? 'bg-slate-950/70 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                        )}
                    >
                      <option value="">Switch task</option>
                      {activeTasks.map((task) => (
                        <option key={task._id} value={task._id} className={isDark ? 'bg-[#0a0910]' : 'bg-white'}>
                          {task.title}
                        </option>
                      ))}
                    </select>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className={clsx('rounded-2xl p-4', isDark ? 'bg-cyan-500/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700')}>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Phase</p>
                          <p className="mt-2 text-xl font-black capitalize">{pomodoroPhase}</p>
                        </div>
                        <div className={clsx('rounded-2xl p-4', isDark ? 'bg-violet-500/10 text-violet-200' : 'bg-violet-50 text-violet-700')}>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Status</p>
                          <p className="mt-2 text-xl font-black">{isPomodoroRunning ? 'Running' : 'Paused'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FormInput({ label, value, onChange, required, type = 'text', placeholder, isDark }) {
  return (
    <div className="space-y-3">
      <label className={clsx('text-[10px] font-black uppercase tracking-[0.3em] opacity-50 px-2')}>{label}</label>
      <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={clsx('w-full px-8 py-5 rounded-[2rem] font-bold text-sm border outline-none transition-all shadow-sm [color-scheme:dark]', isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-white/[0.08]' : 'bg-gray-50/50 border-gray-100 text-gray-900 placeholder-gray-400 focus:border-cyan-400 focus:bg-white')} />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder, isDark }) {
  return (
    <div className="space-y-3">
      <label className={clsx('text-[10px] font-black uppercase tracking-[0.3em] opacity-50 px-2')}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
        className={clsx('w-full px-8 py-5 rounded-[2rem] font-bold text-sm border outline-none resize-none transition-all shadow-sm', isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-white/[0.08]' : 'bg-gray-50/50 border-gray-100 text-gray-900 placeholder-gray-400 focus:border-cyan-400 focus:bg-white')} />
    </div>
  );
}

function FormSelect({ label, value, onChange, options, isDark }) {
  return (
    <div className="space-y-3">
      <label className={clsx('text-[10px] font-black uppercase tracking-[0.3em] opacity-50 px-2')}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={clsx('w-full px-8 py-5 rounded-[2rem] font-bold text-sm border outline-none capitalize transition-all appearance-none cursor-pointer shadow-sm', isDark ? 'bg-[#151221] border-white/10 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-cyan-400')}>
        {options.map(o => <option key={o} value={o} className={isDark ? 'bg-[#151221]' : ''}>{o === 'inprogress' ? 'In progress' : o}</option>)}
      </select>
    </div>
  );
}

function EmptyTaskState({ onAdd, isDark, filter }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={clsx(
      'text-center py-20 sm:py-32 rounded-[2rem] sm:rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center transition-all px-6 sm:px-8 glass-card',
      isDark ? 'border-white/5 bg-white/[0.01]' : 'border-gray-100 bg-gray-50/50 shadow-sm'
    )}>
      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[3rem] bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-8 sm:mb-10 shadow-[0_15px_40px_rgba(6,182,212,0.4)] animate-float">
         <Zap className="w-12 h-12" />
      </div>
      <h3 className={clsx('text-2xl sm:text-4xl font-black mb-4 tracking-tighter', isDark ? 'text-white' : 'text-gray-900')}>
         {filter === 'all' ? 'No tasks yet' : 'No tasks in this filter'}
      </h3>
      <p className={clsx('text-sm lg:text-lg font-bold mb-12 max-w-md mx-auto leading-relaxed opacity-50 px-2', isDark ? 'text-gray-400' : 'text-gray-500')}>
         {filter === 'all' 
           ? 'Create your first task to get started.' 
           : 'Try another filter or add a new task.'}
      </p>
      {filter === 'all' && (
        <motion.button 
          whileHover={{ scale: 1.05, y: -5 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={onAdd} 
          className="px-10 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-colors"
        >
          Add Your First Task
        </motion.button>
      )}
    </motion.div>
  );
}




