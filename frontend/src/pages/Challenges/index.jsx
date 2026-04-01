import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Flag, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import Modal from '../../components/ui/Modal';
import { challengesAPI, friendsAPI } from '../../api/endpoints';

const challengeTypes = [
  { id: '7_day', label: '7 day challenge' },
  { id: '30_day', label: '30 day challenge' },
  { id: 'custom', label: 'Custom challenge' },
];

export default function Challenges() {
  const { isDark } = useThemeStore();
  const [challenges, setChallenges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
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

  const fetchChallenges = async () => {
    try {
      const res = await challengesAPI.list();
      setChallenges(res.data.challenges || []);
      if (!selectedChallengeId && res.data.challenges?.length) {
        setSelectedChallengeId(res.data.challenges[0].id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load challenges');
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await friendsAPI.list();
      setFriends(res.data.friends || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load friends');
    }
  };

  const fetchLeaderboard = async (challengeId) => {
    if (!challengeId) return;
    try {
      const res = await challengesAPI.leaderboard(challengeId);
      setLeaderboard(res.data.leaderboard || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load leaderboard');
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (selectedChallengeId) fetchLeaderboard(selectedChallengeId);
  }, [selectedChallengeId]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Add a challenge title');
      return;
    }

    if (form.type === 'custom' && (!form.startDate || !form.endDate)) {
      toast.error('Select custom start and end dates');
      return;
    }

    try {
      await challengesAPI.create({
        title: form.title,
        type: form.type,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        invitedIds: form.invitedIds,
      });
      toast.success('Challenge created');
      setIsCreateOpen(false);
      setForm({ title: '', type: '7_day', startDate: '', endDate: '', invitedIds: [] });
      fetchChallenges();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create challenge');
    }
  };

  const handleJoin = async (challengeId) => {
    try {
      await challengesAPI.join(challengeId);
      toast.success('Challenge joined');
      fetchChallenges();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join challenge');
    }
  };

  const handleProgress = async () => {
    if (!activeChallenge) return;

    try {
      await challengesAPI.updateProgress({
        challengeId: activeChallenge.id,
        completedHabits: Number(progressForm.completedHabits || 0),
        completedTasks: Number(progressForm.completedTasks || 0),
      });
      toast.success('Progress updated');
      setIsProgressOpen(false);
      setProgressForm({ completedHabits: '', completedTasks: '' });
      fetchLeaderboard(activeChallenge.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update progress');
    }
  };

  const toggleInvite = (friendId) => {
    setForm((prev) => {
      const exists = prev.invitedIds.includes(friendId);
      return {
        ...prev,
        invitedIds: exists
          ? prev.invitedIds.filter((id) => id !== friendId)
          : [...prev.invitedIds, friendId],
      };
    });
  };

  return (
    <div className="max-w-6xl space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={clsx('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>Challenges</h2>
          <p className={clsx('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Compete with friends and track progress together.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/25"
        >
          <Plus className="w-4 h-4" />
          Create Challenge
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className={clsx('rounded-3xl border p-6 space-y-4', isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-200 shadow-xl shadow-gray-100')}>
          <div className="flex items-center justify-between">
            <h3 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Your Challenges</h3>
            <Flag className={clsx('w-5 h-5', isDark ? 'text-violet-400' : 'text-violet-500')} />
          </div>
          {challenges.length === 0 && (
            <div className={clsx('p-5 rounded-2xl text-sm', isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500')}>
              No challenges yet. Create one to begin.
            </div>
          )}
          {challenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              whileHover={{ y: -2 }}
              className={clsx('p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4', isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-white')}
            >
              <div>
                <p className={clsx('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{challenge.title}</p>
                <div className={clsx('text-xs mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  {challenge.type.replace('_', ' ')} | {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={clsx('text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full', isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}>
                  {challenge.participantCount} participants
                </span>
                {challenge.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => handleJoin(challenge.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Join
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChallenge(challenge);
                      setIsProgressOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30"
                  >
                    Update Progress
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className={clsx('rounded-3xl border p-6 space-y-4', isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-200 shadow-xl shadow-gray-100')}>
          <div className="flex items-center justify-between">
            <h3 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Leaderboard</h3>
            <Trophy className={clsx('w-5 h-5', isDark ? 'text-amber-400' : 'text-amber-500')} />
          </div>
          <select
            value={selectedChallengeId}
            onChange={(e) => setSelectedChallengeId(e.target.value)}
            className={clsx('w-full px-4 py-2 rounded-2xl text-sm border outline-none', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900')}
          >
            <option value="">Select challenge</option>
            {challenges.map((challenge) => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.title}
              </option>
            ))}
          </select>

          <div className="space-y-3">
            {leaderboard.length === 0 && (
              <div className={clsx('p-4 rounded-2xl text-xs', isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500')}>
                Leaderboard is empty.
              </div>
            )}
            {leaderboard.map((entry) => (
              <div
                key={`${entry.rank}-${entry.user?.id}`}
                className={clsx('flex items-center justify-between rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-white')}
              >
                <div>
                  <p className={clsx('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                    #{entry.rank} {entry.user?.name || 'User'}
                  </p>
                  <p className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    {entry.completedHabits} habits | {entry.completedTasks} tasks
                  </p>
                </div>
                <span className={clsx('text-sm font-black', isDark ? 'text-amber-300' : 'text-amber-600')}>{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Challenge">
        <div className="space-y-4">
          <div>
            <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className={clsx('mt-2 w-full px-4 py-3 rounded-2xl text-sm border outline-none', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {challengeTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, type: type.id }))}
                className={clsx(
                  'px-4 py-3 rounded-2xl text-xs font-semibold border',
                  form.type === type.id
                    ? 'border-transparent bg-gradient-to-r from-violet-500 to-indigo-500 text-white'
                    : isDark
                      ? 'border-white/10 bg-white/5 text-gray-300'
                      : 'border-gray-200 bg-white text-gray-600'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          {form.type === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Start date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className={clsx('mt-2 w-full px-4 py-3 rounded-2xl text-sm border outline-none', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900')}
                />
              </div>
              <div>
                <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>End date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className={clsx('mt-2 w-full px-4 py-3 rounded-2xl text-sm border outline-none', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900')}
                />
              </div>
            </div>
          )}

          <div>
            <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Invite friends</label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {friends.length === 0 && (
                <p className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>No friends yet.</p>
              )}
              {friends.map((friend) => {
                const active = form.invitedIds.includes(friend.id);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleInvite(friend.id)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 rounded-2xl border text-xs font-semibold',
                      active
                        ? 'border-transparent bg-emerald-500/20 text-emerald-300'
                        : isDark
                          ? 'border-white/10 bg-white/5 text-gray-300'
                          : 'border-gray-200 bg-white text-gray-600'
                    )}
                  >
                    <span>@{friend.username}</span>
                    {active && <CheckCircle className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold"
          >
            Create Challenge
          </button>
        </div>
      </Modal>

      <Modal isOpen={isProgressOpen} onClose={() => setIsProgressOpen(false)} title="Update Progress">
        <div className="space-y-4">
          <div>
            <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Completed habits</label>
            <input
              type="number"
              min="0"
              value={progressForm.completedHabits}
              onChange={(e) => setProgressForm((prev) => ({ ...prev, completedHabits: e.target.value }))}
              className={clsx('mt-2 w-full px-4 py-3 rounded-2xl text-sm border outline-none', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900')}
            />
          </div>
          <div>
            <label className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-500')}>Completed tasks</label>
            <input
              type="number"
              min="0"
              value={progressForm.completedTasks}
              onChange={(e) => setProgressForm((prev) => ({ ...prev, completedTasks: e.target.value }))}
              className={clsx('mt-2 w-full px-4 py-3 rounded-2xl text-sm border outline-none', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900')}
            />
          </div>
          <button
            type="button"
            onClick={handleProgress}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
          >
            Save Progress
          </button>
        </div>
      </Modal>
    </div>
  );
}
