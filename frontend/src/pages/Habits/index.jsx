import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Trash2, Check, PlusCircle, Bell, Sparkles, Pencil } from 'lucide-react';
import { 
  useGetHabitsQuery, 
  useCreateHabitMutation, 
  useUpdateHabitMutation, 
  useDeleteHabitMutation, 
  useLogHabitMutation 
} from '../../store/api/habitApi';
import useThemeStore from '../../store/themeStore';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';

const ICONS = ['⭐', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '🎯', '✍️', '🎸', '🧹', '💊', '🌱', '🙏'];
const COLORS = ['violet', 'indigo', 'cyan', 'emerald', 'rose', 'amber', 'blue', 'pink'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const gradientMap = {
  violet: 'from-violet-500 via-indigo-500 to-purple-600 shadow-violet-500/30',
  indigo: 'from-indigo-500 via-purple-500 to-fuchsia-600 shadow-indigo-500/30',
  cyan: 'from-cyan-500 via-blue-500 to-indigo-600 shadow-cyan-500/30',
  emerald: 'from-emerald-400 via-teal-500 to-emerald-600 shadow-emerald-500/30',
  rose: 'from-rose-500 via-pink-500 to-rose-600 shadow-rose-500/30',
  amber: 'from-amber-400 via-orange-500 to-amber-600 shadow-amber-500/30',
  blue: 'from-blue-500 via-indigo-500 to-blue-700 shadow-blue-500/30',
  pink: 'from-pink-400 via-rose-400 to-pink-600 shadow-pink-500/30',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const defaultForm = { title: '', description: '', icon: '⭐', color: 'violet', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], target: 1, reminderTime: '' };

export default function Habits() {
  const { isDark } = useThemeStore();
  
  const { data: habits = [], isLoading } = useGetHabitsQuery();
  const [createHabit] = useCreateHabitMutation();
  const [updateHabit] = useUpdateHabitMutation();
  const [deleteHabit] = useDeleteHabitMutation();
  const [logHabit] = useLogHabitMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const openAdd = () => { setEditingHabit(null); setForm(defaultForm); setModalOpen(true); };
  
  const openEdit = (h) => { 
    setEditingHabit(h); 
    setForm({ 
      title: h.title, 
      description: h.description || '', 
      icon: h.icon, 
      color: h.color, 
      daysOfWeek: h.daysOfWeek?.length ? h.daysOfWeek : [0, 1, 2, 3, 4, 5, 6], 
      target: h.target || 1,
      reminderTime: h.reminderTime || ''
    }); 
    setModalOpen(true); 
  };
  
  const closeModal = () => { setModalOpen(false); setEditingHabit(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, target: form.target || 1 };
    if (editingHabit) {
      await updateHabit({ id: editingHabit._id, ...payload });
    } else {
      await createHabit(payload);
    }
    closeModal();
  };

  const toggleDay = (dayIndex) => {
    setForm(f => {
      const days = [...f.daysOfWeek];
      if (days.includes(dayIndex)) {
        return { ...f, daysOfWeek: days.filter(d => d !== dayIndex) };
      }
      return { ...f, daysOfWeek: [...days, dayIndex].sort() };
    });
  };

  if (isLoading) return <Loader />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl space-y-10 p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-8 sm:pb-20">
      {/* Header */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }}
        className={clsx(
          'rounded-[2.5rem] border p-8 sm:p-10 flex flex-col md:flex-row md:items-end justify-between gap-8',
          isDark ? 'bg-gradient-to-br from-violet-950/50 via-slate-950 to-slate-900 border-white/10' : 'bg-gradient-to-br from-violet-50 via-white to-white border-violet-100'
        )}
      >
        <div className="space-y-4 max-w-2xl">
          <p className={clsx('text-[10px] font-black uppercase tracking-[0.28em]', isDark ? 'text-violet-300' : 'text-violet-700')}>Daily habits</p>
          <h2 className={clsx('text-4xl sm:text-6xl font-black tracking-[-0.04em] leading-[0.95]', isDark ? 'text-white' : 'text-gray-900')}>Build habits that stick</h2>
          <p className={clsx('text-sm sm:text-base font-bold leading-7', isDark ? 'text-slate-300' : 'text-gray-600')}>
            <span className="text-emerald-500">{habits.filter(h => h.completedToday).length}</span> of {habits.length} habits done today. Keep the most important routines visible and log progress in one tap.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAdd}
          className="btn-primary w-full md:w-auto px-8 sm:px-10 py-4 sm:py-5 shrink-0"
        >
          <PlusCircle className="w-5 h-5" /> Add Habit
        </motion.button>
      </motion.div>

      {/* Habit Grid */}
      {habits.length === 0 ? (
        <EmptyState onAdd={openAdd} isDark={isDark} />
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 px-1 sm:px-2 items-stretch">
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => {
              const grad = gradientMap[habit.color] || gradientMap.violet;
              const progressToday = habit.progressToday || 0;
              const target = habit.target || 1;
              const percent = Math.min((progressToday / target) * 100, 100);
              const isCompleted = habit.completedToday;

              return (
                <motion.div
                  key={habit._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileHover={{ y: -10 }}
                  className={clsx(
                    'group relative rounded-[2rem] cursor-pointer transition-all flex flex-col h-full border overflow-hidden',
                    isDark ? 'bg-slate-900/80 border-white/10 hover:border-violet-400/40' : 'bg-white border-gray-200 hover:border-violet-200 shadow-sm',
                    isCompleted && (isDark ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-emerald-200 bg-emerald-50/60')
                  )}
                  onClick={() => openEdit(habit)}
                >
                  <div className={clsx('h-2 w-full bg-gradient-to-r', grad)} />

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={clsx(
                          'w-16 h-16 rounded-[1.4rem] bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg transition-all duration-500 group-hover:scale-105 shrink-0',
                          grad
                        )}>
                          <span>{habit.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className={clsx(
                            'font-black text-2xl leading-tight tracking-tight truncate',
                            isDark ? 'text-white' : 'text-gray-900',
                            isCompleted && 'opacity-40 line-through'
                          )}>
                            {habit.title}
                          </h3>
                          <p className={clsx('mt-1 text-[10px] font-black uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-gray-400')}>
                            {target}x target / day
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(habit); }}
                        className={clsx('p-3 rounded-2xl transition-colors shrink-0', isDark ? 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10' : 'bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100')}
                        aria-label="Edit habit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <div className={clsx('w-fit px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.16em] flex items-center gap-1.5 transition-colors', isDark ? 'bg-violet-500/15 text-violet-200 border border-violet-400/20' : 'bg-violet-50 text-violet-700')}>
                        <Bell className="w-3 h-3" />
                        {habit.reminderTime || 'No reminder'}
                      </div>
                      <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.16em]', isDark ? 'bg-rose-500/10 text-rose-200 border border-rose-400/20' : 'bg-rose-50 text-rose-700')}>
                        <Flame className="w-3.5 h-3.5" />
                        {habit.currentStreak} day streak
                      </div>
                    </div>

                    <p className={clsx('mt-5 text-sm font-bold leading-relaxed min-h-[48px]', isDark ? 'text-slate-300' : 'text-gray-600')}>
                      {habit.description || 'No description added yet.'}
                    </p>

                    <div className="mt-auto pt-8">
                      <div className="flex justify-between items-end mb-3">
                        <span className={clsx('text-[10px] font-black uppercase tracking-[0.14em]', isDark ? 'text-slate-300' : 'text-gray-600')}>
                          Today progress
                        </span>
                        <span className={clsx('text-[10px] font-black uppercase tracking-[0.14em]', isDark ? 'text-violet-300' : 'text-violet-700')}>
                          {progressToday}/{target} / {Math.round(percent)}%
                        </span>
                      </div>
                      <div className={clsx('h-3 rounded-full overflow-hidden p-1', isDark ? 'bg-slate-800' : 'bg-gray-100')}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, type: 'spring', bounce: 0.2 }}
                          className={clsx('h-full rounded-full bg-gradient-to-r shadow-lg', grad)}
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: isCompleted ? 1 : 1.02 }}
                        whileTap={{ scale: isCompleted ? 1 : 0.98 }}
                        onClick={(e) => { e.stopPropagation(); if (!isCompleted) logHabit(habit._id); }}
                        disabled={isCompleted}
                        className={clsx(
                          'mt-6 w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.14em] transition-all',
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-200 cursor-default'
                            : 'bg-violet-600 text-white hover:bg-violet-500'
                        )}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {isCompleted ? 'Completed today' : 'Log progress'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingHabit ? 'Edit Habit' : 'Add Habit'}>
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="md:col-span-2">
              <label className={clsx('text-[10px] font-black uppercase tracking-[0.3em] block mb-3 px-2 opacity-50')}>Habit Name</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Drink water"
                className="app-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className={clsx('text-[10px] font-black uppercase tracking-[0.3em] block mb-3 px-2 opacity-50')}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Write a short note..."
                rows={3}
                className="app-input resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="md:col-span-2">
              <label className={clsx('text-[10px] font-black uppercase tracking-[0.3em] block mb-4 px-2 opacity-50')}>Repeat On</label>
              <div className="flex justify-between gap-3 overflow-x-auto pb-2 scrollbar-none">
                {DAYS.map((day, i) => {
                   const isSelected = form.daysOfWeek.includes(i);
                   return (
                     <button
                       key={i} type="button" onClick={() => toggleDay(i)}
                       className={clsx('flex-1 min-w-[3rem] aspect-square rounded-2xl text-[10px] font-black transition-all hover:scale-110 shadow-lg', isSelected ? 'bg-gradient-main text-white shadow-violet-500/30' : isDark ? 'bg-white/5 text-gray-500 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 shadow-none')}
                     >
                       {day}
                     </button>
                   );
                })}
              </div>
            </div>

            <div>
              <label className={clsx('text-[10px] font-black uppercase tracking-[0.3em] block mb-3 px-2 opacity-50')}>Daily Target</label>
              <div className="flex items-center gap-4">
                <input
                  type="number" min="1" max="100" required
                  value={form.target}
                  onChange={e => setForm(f => ({ ...f, target: parseInt(e.target.value) || 1 }))}
                  className="app-input w-28 px-6 text-center"
                />
                <span className={clsx('text-[10px] font-black text-gray-500 uppercase tracking-widest')}>Times / Day</span>
              </div>
            </div>

            <div>
              <label className={clsx('text-[10px] font-black uppercase tracking-[0.3em] block mb-3 px-2 opacity-50')}>Reminder Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={form.reminderTime}
                  onChange={e => setForm(f => ({ ...f, reminderTime: e.target.value }))}
                  className="app-input [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 border-t border-white/5">
            <div>
              <label className={clsx('text-[10px] font-black uppercase tracking-[0.4em] block mb-4 px-2 opacity-50')}>Color</label>
              <div className="flex flex-wrap gap-4">
                {COLORS.map(color => (
                  <button
                    key={color} type="button" onClick={() => setForm(f => ({ ...f, color }))}
                    className={clsx(
                      'w-10 h-10 rounded-full bg-gradient-to-br transition-all hover:scale-125 group relative', 
                      gradMapSimple(color), 
                      form.color === color ? 'ring-4 ring-offset-4 ring-violet-500 shadow-2xl scale-110' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                    )}
                    style={{ ringOffsetColor: isDark ? '#1a1628' : '#fff' }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className={clsx('text-[10px] font-black uppercase tracking-[0.4em] block mb-4 px-2 opacity-50')}>Icon</label>
              <div className="flex flex-wrap gap-3 h-32 overflow-y-auto pr-4 scrollbar-custom">
                {ICONS.map(icon => (
                  <button
                    key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                    className={clsx(
                      'w-14 h-14 rounded-[1.5rem] text-xl flex items-center justify-center transition-all hover:scale-110', 
                      form.icon === icon 
                        ? 'bg-gradient-main text-white shadow-xl shadow-violet-500/20' 
                        : isDark ? 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-10 mt-6 border-t border-white/5">
            {editingHabit && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                type="button" 
                onClick={() => { deleteHabit(editingHabit._id); closeModal(); }}
                className={clsx('p-5 rounded-[2rem] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white shadow-lg transition-all')}
              >
                <Trash2 className="w-6 h-6" />
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn-primary flex-1 py-5"
            >
              {editingHabit ? 'Save Habit' : 'Create Habit'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

function gradMapSimple(color) {
  const g = {
    violet: 'from-violet-500 to-indigo-600',
    indigo: 'from-indigo-500 to-purple-600',
    cyan: 'from-cyan-500 to-blue-600',
    emerald: 'from-emerald-400 to-emerald-600',
    rose: 'from-rose-500 to-pink-600',
    amber: 'from-amber-400 to-orange-600',
    blue: 'from-blue-500 to-blue-700',
    pink: 'from-pink-400 to-pink-600',
  };
  return g[color] || g.violet;
}

function EmptyState({ onAdd, isDark }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={clsx(
      'text-center py-20 sm:py-32 rounded-[2rem] sm:rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center transition-all px-6 sm:px-8 glass-card',
      isDark ? 'border-white/5 bg-white/[0.01]' : 'border-gray-100 bg-gray-50/50 shadow-sm'
    )}>
      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[3rem] bg-gradient-main flex items-center justify-center text-white mb-8 sm:mb-10 shadow-[0_15px_40px_rgba(139,92,246,0.4)] animate-float">
         <Sparkles className="w-12 h-12" />
      </div>
      <h3 className={clsx('text-2xl sm:text-4xl font-black mb-4 tracking-tighter', isDark ? 'text-white' : 'text-gray-900')}>No Habits Yet</h3>
      <p className={clsx('text-sm lg:text-lg font-bold mb-12 max-w-md mx-auto leading-relaxed opacity-50 px-2', isDark ? 'text-gray-400' : 'text-gray-500')}>
         Add your first habit and start building consistency.
      </p>
      <motion.button 
        whileHover={{ scale: 1.05, y: -5 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={onAdd} 
        className="btn-primary px-8 sm:px-12 py-4 sm:py-6"
      >
        Add First Habit
      </motion.button>
    </motion.div>
  );
}
