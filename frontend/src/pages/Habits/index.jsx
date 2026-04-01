import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Edit2, Trash2, Check, PlusCircle, Bell, Calendar, Sparkles } from 'lucide-react';
import useHabitStore from '../../store/habitStore';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';

const ICONS = ['⭐', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '🎯', '✍️', '🎸', '🧹', '💊', '🌱', '🙏'];
const COLORS = ['violet', 'indigo', 'cyan', 'emerald', 'rose', 'amber', 'blue', 'pink'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const gradientMap = {
  violet: 'from-violet-500 via-indigo-500 to-purple-600',
  indigo: 'from-indigo-500 via-purple-500 to-fuchsia-600',
  cyan: 'from-cyan-500 via-blue-500 to-indigo-600',
  emerald: 'from-emerald-400 via-teal-500 to-emerald-600',
  rose: 'from-rose-500 via-pink-500 to-rose-600',
  amber: 'from-amber-400 via-orange-500 to-amber-600',
  blue: 'from-blue-500 via-indigo-500 to-blue-700',
  pink: 'from-pink-400 via-rose-400 to-pink-600',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const defaultForm = { title: '', description: '', icon: '⭐', color: 'violet', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], target: 1, reminderTime: '' };

export default function Habits() {
  const { habits, fetchHabits, createHabit, updateHabit, deleteHabit, logHabit, isLoading } = useHabitStore();
  const { updateUser } = useAuthStore();
  const { isDark } = useThemeStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => { fetchHabits(); }, []);

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
      await updateHabit(editingHabit._id, payload);
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
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl space-y-8 pb-20">
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 px-2">
        <div className="space-y-1">
          <h2 className={clsx('text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Your Habits</h2>
          <p className={clsx('text-xs sm:text-sm lg:text-base font-bold', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {habits.filter(h => h.completedToday).length} of {habits.length} tasks crushed today! 🚀
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAdd}
          className="flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-[2rem] bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Add New Habit
        </motion.button>
      </motion.div>

      {/* Habit Grid */}
      {habits.length === 0 ? (
        <EmptyState onAdd={openAdd} isDark={isDark} />
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => {
              const grad = gradientMap[habit.color] || gradientMap.violet;
              const progressCount = habit.progressToday || 0;
              const target = habit.target || 1;
              const percent = Math.min((progressCount / target) * 100, 100);
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
                    'group relative rounded-[3rem] p-6 sm:p-8 border cursor-pointer transition-all card-hover flex flex-col',
                    isCompleted
                      ? isDark ? 'bg-violet-500/5 border-violet-500/20' : 'bg-violet-50/50 border-violet-200'
                      : isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-100 shadow-premium'
                  )}
                  onClick={() => openEdit(habit)}
                >
                  {/* Status Indicator */}
                  <div className={clsx(
                    'absolute top-6 sm:top-8 right-6 sm:right-8 w-2 h-2 rounded-full animate-pulse',
                    isCompleted ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/10'
                  )} />

                  <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-6">
                    {/* Icon */}
                    <div className={clsx(
                      'w-16 h-16 sm:w-20 sm:h-20 rounded-[2.5rem] bg-gradient-to-br flex items-center justify-center text-2xl sm:text-3xl shadow-xl transition-transform duration-500 group-hover:scale-110',
                      grad
                    )}>
                       <div className="absolute inset-0 bg-white/20 animate-shimmer rounded-[2.5rem]" />
                       <span className="relative z-10">{habit.icon}</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className={clsx(
                        'font-black text-lg sm:text-xl leading-none transition-all', 
                        isDark ? 'text-white' : 'text-gray-900', 
                        isCompleted && 'opacity-40 line-through'
                      )}>
                        {habit.title}
                      </h3>
                      {habit.reminderTime ? (
                        <p className={clsx('text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5', isDark ? 'text-violet-400' : 'text-violet-500')}>
                          <Bell className="w-3 h-3" /> {habit.reminderTime}
                        </p>
                      ) : (
                        <p className={clsx('text-[10px] font-black uppercase tracking-widest', isDark ? 'text-gray-500' : 'text-gray-400')}>No Reminder</p>
                      )}
                    </div>
                  </div>
                  
                  {habit.description && (
                    <p className={clsx('text-xs font-medium text-center mb-6 line-clamp-2 leading-relaxed px-2', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {habit.description}
                    </p>
                  )}

                  <div className="mt-auto space-y-6">
                    {/* Progress Visual */}
                    <div>
                      <div className="flex justify-between items-end mb-2 px-1">
                        <span className={clsx('text-[10px] font-black uppercase tracking-widest', isDark ? 'text-gray-500' : 'text-gray-400')}>
                           {progressCount} / {target} Hits
                        </span>
                        <span className={clsx('text-[10px] font-black uppercase tracking-widest', isDark ? 'text-gray-300' : 'text-gray-600')}>
                           {Math.round(percent)}%
                        </span>
                      </div>
                      <div className={clsx('h-3 rounded-full overflow-hidden p-0.5', isDark ? 'bg-white/5' : 'bg-gray-50')}>
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${percent}%` }} 
                          transition={{ duration: 0.8, type: 'spring' }}
                          className={clsx('h-full rounded-full bg-gradient-to-r shadow-sm', grad)} 
                        />
                      </div>
                    </div>

                    <div className={clsx('flex items-center justify-between pt-4 border-t border-dashed', isDark ? 'border-[#2d2545]' : 'border-gray-100')}>
                      <div className="flex items-center gap-3">
                        <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest', isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-500')}>
                          <Flame className="w-3 h-3" />
                          <span>{habit.currentStreak}</span>
                        </div>
                      </div>
                      
                      {/* Log Action */}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => { e.stopPropagation(); logHabit(habit._id, updateUser); }}
                        className={clsx(
                          'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500',
                          isCompleted
                            ? `bg-gradient-to-br ${grad} text-white shadow-lg shadow-violet-500/20`
                            : isDark ? 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-violet-500'
                        )}
                      >
                        {isCompleted ? <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />}
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
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingHabit ? 'Edit Habit' : 'Create New Habit'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={clsx('text-[10px] font-black uppercase tracking-widest block mb-2 px-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Habit Title</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Master the Guitar"
                className={clsx('w-full px-6 py-4 rounded-[1.5rem] font-bold text-sm border outline-none transition-all', isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500 focus:bg-white/[0.08]' : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:bg-white')}
              />
            </div>
            <div className="md:col-span-2">
              <label className={clsx('text-[10px] font-black uppercase tracking-widest block mb-2 px-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Why is this important to you?"
                rows={3}
                className={clsx('w-full px-6 py-4 rounded-[1.5rem] font-bold text-sm border outline-none resize-none transition-all', isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500 focus:bg-white/[0.08]' : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:bg-white')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={clsx('text-[10px] font-black uppercase tracking-widest block mb-3 px-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Schedule</label>
              <div className="flex justify-between gap-2">
                {DAYS.map((day, i) => {
                   const isSelected = form.daysOfWeek.includes(i);
                   return (
                     <button
                       key={i} type="button" onClick={() => toggleDay(i)}
                       className={clsx('flex-1 aspect-square rounded-2xl text-xs font-black transition-all hover:scale-105', isSelected ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20' : isDark ? 'bg-white/5 text-gray-500 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
                     >
                       {day}
                     </button>
                   );
                })}
              </div>
            </div>

            <div>
              <label className={clsx('text-[10px] font-black uppercase tracking-widest block mb-2 px-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Daily Target</label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="1" max="100" required
                  value={form.target === '' ? '' : form.target}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setForm(f => ({ ...f, target: isNaN(val) ? '' : val }));
                  }}
                  className={clsx('w-24 px-4 py-4 rounded-[1.5rem] font-bold text-sm border outline-none text-center', isDark ? 'bg-white/5 border-white/10 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-violet-400')}
                />
                <span className={clsx('text-xs font-black text-gray-500 uppercase tracking-widest')}>Hits</span>
              </div>
            </div>

            <div>
              <label className={clsx('text-[10px] font-black uppercase tracking-widest block mb-2 px-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Reminder</label>
              <input
                type="time"
                value={form.reminderTime}
                onChange={e => setForm(f => ({ ...f, reminderTime: e.target.value }))}
                className={clsx('w-full px-6 py-4 rounded-[1.5rem] font-bold text-sm border outline-none transition-all', isDark ? 'bg-white/5 border-white/10 text-white focus:border-violet-500 [color-scheme:dark]' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-violet-400')}
              />
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-white/5 w-full" />

          {/* Card Style */}
          <div className="space-y-6">
            <div>
              <label className={clsx('text-[10px] font-black uppercase tracking-widest block mb-3 px-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Aesthetic</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(color => (
                  <button
                    key={color} type="button" onClick={() => setForm(f => ({ ...f, color }))}
                    className={clsx(
                      'w-10 h-10 rounded-full bg-gradient-to-br transition-all hover:scale-125 hover:rotate-12', 
                      gradientMap[color], 
                      form.color === color ? 'ring-4 ring-offset-4 ring-violet-500 shadow-xl' : 'opacity-60 grayscale-[40%] hover:grayscale-0 hover:opacity-100'
                    )}
                    style={{ ringOffsetColor: isDark ? '#12101b' : '#fff' }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className={clsx('text-[10px] font-black uppercase tracking-widest block mb-3 px-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Symbol</label>
              <div className="flex flex-wrap gap-2 h-32 overflow-y-auto pr-4 scrollbar-custom">
                {ICONS.map(icon => (
                  <button
                    key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                    className={clsx(
                      'w-12 h-12 rounded-2xl text-xl flex items-center justify-center transition-all', 
                      form.icon === icon 
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg' 
                        : isDark ? 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100 dark:border-white/5">
            {editingHabit && (
              <button 
                type="button" 
                onClick={() => { deleteHabit(editingHabit._id); closeModal(); }}
                className={clsx('p-4 rounded-[1.5rem] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button type="submit" className="flex-1 py-5 rounded-[1.5rem] bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 transition-all active:scale-95 leading-none">
              {editingHabit ? 'Save Changes' : 'Initialize Habit'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

function EmptyState({ onAdd, isDark }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={clsx(
      'text-center py-24 rounded-[3.5rem] border-2 border-dashed flex flex-col items-center justify-center transition-all',
      isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'
    )}>
      <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white mb-8 shadow-2xl animate-float">
         <Sparkles className="w-10 h-10" />
      </div>
      <h3 className={clsx('text-3xl font-black mb-3 tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Void of Habits</h3>
      <p className={clsx('text-sm lg:text-base font-bold mb-10 max-w-sm mx-auto leading-relaxed', isDark ? 'text-gray-500' : 'text-gray-400')}>
         The first rule of progress is showing up. Add your first habit and start your journey today.
      </p>
      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={onAdd} 
        className="px-10 py-5 rounded-[2rem] bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-500/25"
      >
        Ignite Your First Habit
      </motion.button>
    </motion.div>
  );
}
