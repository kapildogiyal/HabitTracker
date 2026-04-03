import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Flag, CheckCircle, Target, Users, Zap, Calendar, TrendingUp, Award } from 'lucide-react';
import { 
  useGetChallengesQuery, 
  useCreateChallengeMutation, 
  useJoinChallengeMutation, 
  useUpdateChallengeProgressMutation, 
  useGetLeaderboardQuery 
} from '../../store/api/challengeApi';
import { useGetFriendsQuery } from '../../store/api/friendApi';
import useThemeStore from '../../store/themeStore';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const challengeTypes = [
  { id: '7_day', label: '7 Day Challenge' },
  { id: '30_day', label: '30 Day Challenge' },
  { id: 'custom', label: 'Custom Challenge' },
];

export default function Challenges() {
  const { isDark } = useThemeStore();
  const { data: challengesData = [], isLoading: isLoadingChallenges } = useGetChallengesQuery();
  const { data: friendsData = [] } = useGetFriendsQuery();
  
  const [createChallenge] = useCreateChallengeMutation();
  const [joinChallenge] = useJoinChallengeMutation();
  const [updateProgress] = useUpdateChallengeProgressMutation();

  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const leaderboardChallengeId = selectedChallengeId || challengesData[0]?._id || challengesData[0]?.id || '';
  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useGetLeaderboardQuery(leaderboardChallengeId, {
    skip: !leaderboardChallengeId,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState(null);
  
  const [form, setForm] = useState({
    title: '',
    type: '7_day',
    startDate: '',
    endDate: '',
    invitedIds: [],
  });
  
  const [progressForm, setProgressForm] = useState({ completedHabits: '', completedTasks: '' });

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Please enter a challenge name.');
    if (form.type === 'custom' && (!form.startDate || !form.endDate)) return toast.error('Please choose a start and end date.');

    try {
      await createChallenge(form).unwrap();
      toast.success('Challenge created');
      setIsCreateOpen(false);
      setForm({ title: '', type: '7_day', startDate: '', endDate: '', invitedIds: [] });
    } catch (error) {
      toast.error(error?.data?.message || 'Could not create challenge.');
    }
  };

  const handleJoin = async (id) => {
    try {
      await joinChallenge(id).unwrap();
      toast.success('Joined challenge');
    } catch (error) {
      toast.error(error?.data?.message || 'Could not join challenge.');
    }
  };

  const handleProgress = async () => {
    if (!activeChallenge) return;
    try {
      await updateProgress({
        challengeId: activeChallenge._id || activeChallenge.id,
        completedHabits: Number(progressForm.completedHabits || 0),
        completedTasks: Number(progressForm.completedTasks || 0),
      }).unwrap();
      toast.success('Progress updated');
      setIsProgressOpen(false);
      setProgressForm({ completedHabits: '', completedTasks: '' });
    } catch (error) {
      toast.error(error?.data?.message || 'Could not update progress.');
    }
  };

  const toggleInvite = (id) => {
    setForm(p => ({
      ...p,
      invitedIds: p.invitedIds.includes(id) 
        ? p.invitedIds.filter(i => i !== id) 
        : [...p.invitedIds, id]
    }));
  };

  const challenges = challengesData || [];
  
  if (isLoadingChallenges) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8 sm:space-y-12 mesh-gradient p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-12 sm:pb-20 rounded-[2rem] sm:rounded-[4rem]">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
        <div className="space-y-2">
          <p className={clsx('text-[10px] font-black uppercase tracking-[0.4em]', isDark ? 'text-amber-400' : 'text-amber-600')}>Group goals</p>
          <h2 className={clsx('text-4xl sm:text-5xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Challenges</h2>
          <p className={clsx('text-sm lg:text-base font-bold opacity-50', isDark ? 'text-gray-300' : 'text-gray-600')}>
            Join friends, share progress, and stay consistent.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary w-full md:w-auto px-6 sm:px-8 py-4 sm:py-5"
        >
          <Plus className="w-5 h-5 stroke-[3]" /> Create challenge
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-10 lg:gap-14">
        {/* Active Challenges */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className={clsx('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Active challenges</h3>
            <Flag className="w-5 h-5 text-violet-500 animate-pulse" />
          </div>
          
          <AnimatePresence mode="popLayout">
            {challenges.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 rounded-[3rem] glass-card border-dashed border-white/10 opacity-60">
                 <Target className="w-12 h-12 mx-auto mb-6 text-gray-500" />
                 <p className="font-bold">No active challenges yet.</p>
              </motion.div>
            ) : (
              <div className="grid gap-6">
                {challenges.map((challenge) => (
                  <motion.div
                    key={challenge._id || challenge.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    className={clsx('group p-5 sm:p-8 rounded-[1.8rem] sm:rounded-[3.5rem] glass-card transition-all relative overflow-hidden', isDark ? 'bg-white/[0.02]' : 'bg-white')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="space-y-3">
                         <div className="flex items-center gap-3">
                            <h4 className={clsx('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>{challenge.title}</h4>
                            <Badge label={challenge.type?.replace('_', ' ')} variant="info" size="sm" />
                         </div>
                         <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
                               <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                               {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
                               <Users className="w-3.5 h-3.5 text-violet-500" />
                               {challenge.participants?.length || challenge.participantCount || 0} members
                            </span>
                         </div>
                      </div>
                      
                      <div className="flex w-full md:w-auto items-center gap-4">
                        {challenge.status !== 'accepted' ? (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleJoin(challenge._id || challenge.id)}
                            className="btn-primary w-full md:w-auto px-6 sm:px-8 py-3 text-xs"
                          >
                            Join
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setActiveChallenge(challenge);
                              setIsProgressOpen(true);
                            }}
                            className="btn-primary w-full md:w-auto px-6 sm:px-8 py-3 text-xs"
                          >
                            Share progress
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Leaderboard */}
        <div className="space-y-8">
           <div className="flex items-center justify-between px-4">
              <h3 className={clsx('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Leaderboard</h3>
              <Trophy className="w-5 h-5 text-amber-500 shadow-glow-amber" />
           </div>

           <div className="glass-card rounded-[2rem] sm:rounded-[3.5rem] p-5 sm:p-8 space-y-8 min-h-[400px]">
              <div className="relative">
                 <select
                    value={leaderboardChallengeId}
                    onChange={(e) => setSelectedChallengeId(e.target.value)}
                    className={clsx('w-full px-8 py-4.5 rounded-[2rem] text-xs font-black uppercase tracking-widest border-2 outline-none appearance-none cursor-pointer transition-all', isDark ? 'bg-white/5 border-white/5 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-violet-400')}
                 >
                    <option value="">Select challenge</option>
                    {challenges.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                    ))}
                 </select>
                 <TrendingUp className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
              </div>

              <div className="space-y-5">
                 {isLoadingLeaderboard ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                       <Loader />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Loading ranks...</p>
                    </div>
                 ) : leaderboard.length === 0 ? (
                    <div className="text-center py-20 opacity-40">
                       <Award className="w-12 h-12 mx-auto mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest">No ranking data yet</p>
                    </div>
                 ) : (
                    leaderboard.map((entry, idx) => (
                      <motion.div
                        key={entry.user?._id || entry.user?.id}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={clsx('flex items-center justify-between p-6 rounded-[2.5rem] border transition-all hover:scale-[1.03]', isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm')}
                      >
                         <div className="flex items-center gap-5">
                           <div className={clsx('w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-lg font-black shadow-lg', idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900' : isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900')}>
                             {idx + 1}
                           </div>
                           <div>
                              <p className={clsx('text-sm font-black', isDark ? 'text-white' : 'text-gray-900')}>{entry.user?.name}</p>
                              <div className="flex items-center gap-3 opacity-40">
                                 <span className="text-[9px] font-black uppercase tracking-widest">{entry.completedHabits} Habits</span>
                                 <span className="text-[9px] font-black uppercase tracking-widest">{entry.completedTasks} Tasks</span>
                              </div>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className={clsx('text-sm font-black text-violet-500 shadow-glow-violet')}>{entry.score}</p>
                           <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Rating</p>
                         </div>
                      </motion.div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Challenge">
        <div className="space-y-8 p-2">
           <div className="space-y-3">
              <label className="app-label">Challenge name</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                className={clsx('w-full px-8 py-4.5 rounded-[2rem] text-sm font-bold border outline-none transition-all shadow-sm', isDark ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500' : 'bg-gray-50/50 border-gray-100 text-gray-900 focus:border-cyan-400')}
                placeholder="30 Day Fitness"
              />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {challengeTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setForm(p => ({ ...p, type: type.id }))}
                  className={clsx(
                    'px-6 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all',
                    form.type === type.id
                      ? 'border-transparent bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30'
                      : isDark ? 'border-white/5 bg-white/5 text-gray-500' : 'border-gray-100 bg-white text-gray-400'
                  )}
                >
                  {type.label}
                </button>
              ))}
           </div>

           {form.type === 'custom' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                   <label className="app-label">Start date</label>
                   <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={clsx('w-full px-6 py-4 rounded-2xl text-xs font-bold border outline-none [color-scheme:dark]', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100')} />
                </div>
                <div className="space-y-3">
                   <label className="app-label">End date</label>
                   <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={clsx('w-full px-6 py-4 rounded-2xl text-xs font-bold border outline-none [color-scheme:dark]', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100')} />
                </div>
             </div>
           )}

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 flex items-center gap-2">
                 <Users className="w-3.5 h-3.5" /> Invite friends
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                 {friendsData.map((friend) => {
                    const active = form.invitedIds.includes(friend._id || friend.id);
                    return (
                      <motion.button
                        key={friend._id || friend.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleInvite(friend._id || friend.id)}
                        className={clsx(
                          'flex items-center justify-between px-6 py-3.5 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-widest transition-all',
                          active
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                            : isDark ? 'border-white/5 bg-white/5 text-gray-500' : 'border-gray-100 bg-white text-gray-400'
                        )}
                      >
                         <span>@{friend.username}</span>
                         {active && <CheckCircle className="w-3.5 h-3.5" />}
                      </motion.button>
                    );
                 })}
              </div>
           </div>

           <motion.button
             whileHover={{ scale: 1.02, y: -2 }}
             whileTap={{ scale: 0.98 }}
             onClick={handleCreate}
             className="btn-primary w-full py-5"
           >
             Create challenge
           </motion.button>
        </div>
      </Modal>

      {/* Progress Modal */}
      <Modal isOpen={isProgressOpen} onClose={() => setIsProgressOpen(false)} title="Update Progress">
        <div className="space-y-8 p-2">
           <div className="space-y-3">
              <label className="app-label">Completed habits</label>
              <input
                type="number"
                min="0"
                value={progressForm.completedHabits}
                onChange={(e) => setProgressForm(p => ({ ...p, completedHabits: e.target.value }))}
                className={clsx('w-full px-8 py-5 rounded-[2rem] text-sm font-black border outline-none', isDark ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-200')}
                placeholder="0"
              />
           </div>
           <div className="space-y-3">
              <label className="app-label">Completed tasks</label>
              <input
                type="number"
                min="0"
                value={progressForm.completedTasks}
                onChange={(e) => setProgressForm(p => ({ ...p, completedTasks: e.target.value }))}
                className={clsx('w-full px-8 py-5 rounded-[2rem] text-sm font-black border outline-none', isDark ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-200')}
                placeholder="0"
              />
           </div>
           <motion.button
             whileHover={{ scale: 1.02, y: -2 }}
             whileTap={{ scale: 0.98 }}
             onClick={handleProgress}
             className="btn-primary w-full py-5"
           >
             Save progress
           </motion.button>
        </div>
      </Modal>
    </motion.div>
  );
}
