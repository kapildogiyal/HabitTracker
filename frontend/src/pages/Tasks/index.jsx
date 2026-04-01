import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Calendar, Tag, Play, Pause, Square, Clock, Zap, Sparkles } from 'lucide-react';
import useTaskStore from '../../store/taskStore';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';

const FILTERS = ['all', 'todo', 'inprogress', 'done'];
const defaultForm = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '' };

function LiveTimer({ accumulatedTime, timerLastStarted, isRunning, isDark }) {
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    if (!isRunning || !timerLastStarted) {
      setSessionTime(0);
      return;
    }
    const start = new Date(timerLastStarted).getTime();
    setSessionTime(Date.now() - start);

    const interval = setInterval(() => {
      setSessionTime(Date.now() - start);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerLastStarted]);

  const totalMs = (accumulatedTime || 0) + sessionTime;
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
      "font-mono font-black text-xs tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all", 
      isRunning 
        ? "bg-cyan-500/10 text-cyan-500 shadow-lg shadow-cyan-500/10" 
        : (isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400")
    )}>
      <Clock className={clsx("w-3.5 h-3.5", isRunning && "animate-pulse")} />
      {timeStr}
    </div>
  );
}

export default function Tasks() {
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, toggleTask, controlTimer, isLoading, filter, setFilter } = useTaskStore();
  const { updateUser } = useAuthStore();
  const { isDark } = useThemeStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState('');
  const [pomodoroPhase, setPomodoroPhase] = useState('focus');
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(1500);

  useEffect(() => { fetchTasks(); }, []);

  useEffect(() => {
    if (!isFocusOpen) return;
    setPomodoroPhase('focus');
    setRemainingSeconds(1500);
    setIsPomodoroRunning(false);
  }, [isFocusOpen]);

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
      await updateTask(editingTask._id, data);
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
    setFocusedTaskId(defaultTask?._id || '');
    setIsFocusOpen(true);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (isLoading) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 px-2">
        <div className="space-y-1">
          <h2 className={clsx('text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Sprint Tasks</h2>
          <p className={clsx('text-xs sm:text-sm lg:text-base font-bold', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {tasks.filter(t => t.completed).length} items archived · {tasks.filter(t => !t.completed).length} active now
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartFocus}
            className={clsx(
              'flex items-center gap-2 sm:gap-3 px-5 sm:px-6 py-3 sm:py-4 rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-widest transition-all',
              isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            )}
          >
            <Zap className="w-4 h-4" /> Start Focus
          </motion.button>
          <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAdd}
          className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-[2rem] bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-cyan-500/25 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> Add Task
          </motion.button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className={clsx(
        'flex flex-wrap gap-2 p-2 rounded-[2rem] w-fit shadow-sm', 
        isDark ? 'bg-white/5 border border-white/5' : 'bg-gray-100 border border-gray-200'
      )}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300',
              filter === f
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : isDark ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
            )}
          >
            {f === 'inprogress' ? 'In Progress' : f === 'all' ? `All Items` : f}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyTaskState onAdd={openAdd} isDark={isDark} filter={filter} />
      ) : (
        <div className="grid gap-6">
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
                    'group relative flex flex-col lg:flex-row lg:items-center gap-5 sm:gap-6 p-6 sm:p-8 rounded-[2.5rem] border transition-all card-hover',
                    isRunning && !task.completed ? 'border-cyan-500 shadow-xl shadow-cyan-500/10 bg-cyan-500/[0.02]' : '',
                    task.completed
                      ? isDark ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-gray-50/50 border-gray-100 opacity-50'
                      : isDark ? 'bg-[#151221] border-[#221d35]' : 'bg-white border-gray-100 shadow-premium'
                  )}
                >
                  <div className="flex items-start gap-6 flex-1 min-w-0">
                    {/* Unique Checkbox UI */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleTask(task._id, updateUser)}
                      className={clsx(
                        'w-10 h-10 rounded-2xl border-4 flex items-center justify-center shrink-0 mt-1 transition-all duration-500',
                        task.completed 
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                          : isDark ? 'border-white/10 hover:border-cyan-500 bg-white/5' : 'border-gray-100 hover:border-cyan-400 bg-gray-50'
                      )}
                    >
                      {task.completed && <Check className="w-5 h-5 text-white stroke-[4]" />}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className={clsx(
                          'text-lg sm:text-xl font-black transition-all truncate pr-4', 
                          isDark ? 'text-white' : 'text-gray-900', 
                          task.completed && 'line-through opacity-30 decoration-2'
                        )}>
                          {task.title}
                        </h3>
                        {isRunning && (
                          <div className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> ACTIVE
                          </div>
                        )}
                        <Badge label={task.priority} variant={task.priority} size="sm" />
                      </div>
                      
                      {task.description && (
                        <p className={clsx('text-sm font-medium mb-4 line-clamp-2 leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-500', task.completed && 'opacity-30')}>
                           {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        {task.dueDate && (
                          <span className={clsx('text-[10px] uppercase font-black tracking-widest flex items-center gap-2', isDark ? 'text-gray-500' : 'text-gray-400')}>
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.tags?.map(tag => (
                          <span key={tag} className={clsx('text-[10px] flex items-center gap-1.5 font-black uppercase tracking-widest px-3 py-1 rounded-full', isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600')}>
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side controls */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-6 lg:gap-4 lg:pl-8 lg:border-l lg:border-dashed lg:border-gray-100 lg:dark:border-white/5">
                    {!task.completed && (
                      <div className="flex items-center gap-4">
                        <LiveTimer accumulatedTime={task.accumulatedTime} timerLastStarted={task.timerLastStarted} isRunning={isRunning} isDark={isDark} />
                        
                        <div className={clsx('flex items-center gap-1.5 p-1.5 rounded-2xl', isDark ? 'bg-white/5' : 'bg-gray-50')}>
                          {timerStatus === 'idle' && (
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => controlTimer(task._id, 'start')} className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all">
                              <Play className="w-4 h-4 fill-current" />
                            </motion.button>
                          )}
                          {(timerStatus === 'running' || timerStatus === 'paused') && (
                            <>
                              <motion.button 
                                whileHover={{ scale: 1.1 }} 
                                whileTap={{ scale: 0.9 }} 
                                onClick={() => controlTimer(task._id, timerStatus === 'running' ? 'pause' : 'start')} 
                                className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all', timerStatus === 'running' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20')}
                              >
                                {timerStatus === 'running' ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => controlTimer(task._id, 'stop')} className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition-all">
                                <Square className="w-4 h-4 fill-current" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                       <button onClick={() => openEdit(task)} className={clsx('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900')}>
                         Edit
                       </button>
                       <button onClick={() => deleteTask(task._id)} className={clsx('p-2.5 rounded-xl transition-all', isDark ? 'text-gray-600 hover:text-rose-400 hover:bg-rose-500/10' : 'text-gray-300 hover:text-rose-500 hover:bg-rose-50')}>
                         <Trash2 className="w-4.5 h-4.5" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingTask ? 'Edit Task' : 'New Sprint Task'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput label="Title" required value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="The objective..." isDark={isDark} />
          <FormTextarea label="Notes" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Brief details" isDark={isDark} />
          <div className="grid grid-cols-2 gap-6">
            <FormSelect label="Priority" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} options={['low', 'medium', 'high', 'urgent']} isDark={isDark} />
            <FormSelect label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={['todo', 'inprogress', 'done']} isDark={isDark} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormInput label="Deadline" type="date" value={form.dueDate} onChange={v => setForm(f => ({ ...f, dueDate: v }))} isDark={isDark} />
             <FormInput label="Tags" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="work, ux, code" isDark={isDark} />
          </div>
          
          <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100 dark:border-white/5">
            <button type="button" onClick={closeModal} className={clsx('flex-1 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all', isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')}>Dismiss</button>
            <button type="submit" className="flex-1 py-4 rounded-[1.5rem] bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-cyan-500/20 active:scale-95 transition-all">
              {editingTask ? 'Save Task' : 'Initialize Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <div className={clsx('absolute inset-0', isDark ? 'bg-[#0b0a12]' : 'bg-white')} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="relative z-10 h-full flex flex-col items-center justify-center px-6"
            >
              <div className="absolute top-8 right-8">
                <button
                  type="button"
                  onClick={() => setIsFocusOpen(false)}
                  className={clsx(
                    'px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest',
                    isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Exit Focus
                </button>
              </div>

              <div className="text-center space-y-6 max-w-2xl">
                <p className={clsx('text-[10px] font-black uppercase tracking-[0.4em]', isDark ? 'text-gray-500' : 'text-gray-400')}>
                  Focus Mode
                </p>
                <h2 className={clsx('text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
                  {pomodoroPhase === 'focus' ? 'Focus Sprint' : 'Recovery Break'}
                </h2>
                <p className={clsx('text-sm font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Pomodoro: 25 min focus | 5 min break
                </p>

                <div className={clsx('text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter font-mono', isDark ? 'text-cyan-300' : 'text-cyan-600')}>
                  {formatTime(remainingSeconds)}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPomodoroRunning((prev) => !prev)}
                    className={clsx(
                      'px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest',
                      isPomodoroRunning
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    )}
                  >
                    {isPomodoroRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPomodoroRunning(false);
                      setPomodoroPhase('focus');
                      setRemainingSeconds(1500);
                    }}
                    className={clsx(
                      'px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest',
                      isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className={clsx('mt-8 sm:mt-12 w-full max-w-2xl rounded-[2rem] border p-5 sm:p-6', isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200')}>
                <p className={clsx('text-xs font-black uppercase tracking-widest mb-3', isDark ? 'text-gray-500' : 'text-gray-400')}>Running Task</p>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className={clsx('text-lg font-black', isDark ? 'text-white' : 'text-gray-900')}>
                      {focusedTask?.title || 'No active task'}
                    </p>
                    <p className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {focusedTask?.description || 'Pick a task to stay locked in.'}
                    </p>
                  </div>
                  <select
                    value={focusedTask?._id || ''}
                    onChange={(e) => setFocusedTaskId(e.target.value)}
                    className={clsx(
                      'px-4 py-2 rounded-2xl text-xs font-semibold border outline-none',
                      isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                    )}
                  >
                    <option value="">Select task</option>
                    {activeTasks.map((task) => (
                      <option key={task._id} value={task._id}>{task.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FormInput({ label, value, onChange, required, type = 'text', placeholder, isDark }) {
  return (
    <div className="space-y-2">
      <label className={clsx('text-[10px] font-black uppercase tracking-widest px-1', isDark ? 'text-gray-500' : 'text-gray-400')}>{label}</label>
      <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={clsx('w-full px-6 py-4 rounded-3xl font-bold text-sm border outline-none transition-all [color-scheme:dark]', isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-cyan-500' : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400 focus:border-cyan-400')} />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder, isDark }) {
  return (
    <div className="space-y-2">
      <label className={clsx('text-[10px] font-black uppercase tracking-widest px-1', isDark ? 'text-gray-500' : 'text-gray-400')}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
        className={clsx('w-full px-6 py-4 rounded-3xl font-bold text-sm border outline-none resize-none transition-all', isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-cyan-500' : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400 focus:border-cyan-400')} />
    </div>
  );
}

function FormSelect({ label, value, onChange, options, isDark }) {
  return (
    <div className="space-y-2">
      <label className={clsx('text-[10px] font-black uppercase tracking-widest px-1', isDark ? 'text-gray-500' : 'text-gray-400')}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={clsx('w-full px-6 py-4 rounded-3xl font-bold text-sm border outline-none capitalize transition-all appearance-none cursor-pointer', isDark ? 'bg-[#151221] border-white/10 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-cyan-400')}>
        {options.map(o => <option key={o} value={o} className={isDark ? 'bg-[#151221]' : ''}>{o === 'inprogress' ? 'In Progress' : o}</option>)}
      </select>
    </div>
  );
}

function EmptyTaskState({ onAdd, isDark, filter }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={clsx(
      'text-center py-20 rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center transition-all',
      isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'
    )}>
      <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-8 shadow-2xl animate-float">
         <Zap className="w-8 h-8" />
      </div>
      <h3 className={clsx('text-3xl font-black mb-3 tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
         {filter === 'all' ? 'The Void is Calm' : `No ${filter} found`}
      </h3>
      <p className={clsx('text-sm lg:text-base font-bold mb-10 max-w-sm mx-auto leading-relaxed', isDark ? 'text-gray-500' : 'text-gray-400')}>
         {filter === 'all' 
           ? 'Your task list is a clean slate. Deploy your first objective and start execution.' 
           : 'Everything is archived in this sector!'}
      </p>
      {filter === 'all' && (
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={onAdd} 
          className="px-10 py-5 rounded-[2rem] bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-500/30"
        >
          Initialize Task
        </motion.button>
      )}
    </motion.div>
  );
}
