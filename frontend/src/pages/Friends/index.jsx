import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Inbox, Search, Check, X, UserX } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import Modal from '../../components/ui/Modal';
import { friendsAPI } from '../../api/endpoints';

const tabItems = [
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'requests', label: 'Requests', icon: Inbox },
];

export default function Friends() {
  const { isDark } = useThemeStore();
  const [activeTab, setActiveTab] = useState('friends');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const res = await friendsAPI.list();
      setFriends(res.data.friends || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await friendsAPI.requests();
      setIncoming(res.data.incoming || []);
      setOutgoing(res.data.outgoing || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load requests');
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await friendsAPI.search(query.trim());
      setResults(res.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (friendId) => {
    try {
      await friendsAPI.request(friendId);
      toast.success('Friend request sent');
      setResults((prev) => prev.filter((user) => user.id !== friendId));
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await friendsAPI.accept(requestId);
      toast.success('Friend request accepted');
      fetchFriends();
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await friendsAPI.reject(requestId);
      toast.success('Friend request rejected');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleRemove = async (friendId) => {
    try {
      await friendsAPI.remove(friendId);
      toast.success('Friend removed');
      fetchFriends();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove friend');
    }
  };

  const filteredFriends = useMemo(() => friends, [friends]);

  return (
    <div className="max-w-5xl space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={clsx('text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>Friends</h2>
          <p className={clsx('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Connect, share progress, and keep each other accountable.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/25"
        >
          <UserPlus className="w-4 h-4" />
          Add Friend
        </button>
      </div>

      <div className={clsx('rounded-3xl border overflow-hidden', isDark ? 'bg-[#151221] border-[#2d2545]' : 'bg-white border-gray-200 shadow-xl shadow-gray-100')}>
        <div className="flex flex-wrap gap-3 p-6 border-b border-inherit">
          {tabItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all',
                activeTab === id
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20'
                  : isDark
                    ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {isLoading && (
                <p className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Loading friends...</p>
              )}
              {!isLoading && filteredFriends.length === 0 && (
                <div className={clsx('p-6 rounded-2xl text-sm', isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500')}>
                  No friends yet. Add someone to start tracking together.
                </div>
              )}
              {filteredFriends.map((friend) => (
                <motion.div
                  key={friend.id}
                  whileHover={{ y: -2 }}
                  className={clsx(
                    'flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-5',
                    isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-white'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold">
                      {friend.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className={clsx('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                        {friend.name}
                      </p>
                      <p className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>@{friend.username}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(friend.id)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold',
                      isDark ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    )}
                  >
                    <UserX className="w-3 h-3" />
                    Remove
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-8">
              <div>
                <p className={clsx('text-sm font-semibold mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>Incoming Requests</p>
                {incoming.length === 0 ? (
                  <div className={clsx('p-4 rounded-2xl text-xs', isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500')}>
                    No incoming requests.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incoming.map((request) => (
                      <div
                        key={request.requestId}
                        className={clsx('flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-white')}
                      >
                        <div>
                          <p className={clsx('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{request.user.name}</p>
                          <p className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>@{request.user.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAccept(request.requestId)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          >
                            <Check className="w-3 h-3" />
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(request.requestId)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className={clsx('text-sm font-semibold mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>Outgoing Requests</p>
                {outgoing.length === 0 ? (
                  <div className={clsx('p-4 rounded-2xl text-xs', isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500')}>
                    No outgoing requests.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outgoing.map((request) => (
                      <div
                        key={request.requestId}
                        className={clsx('flex items-center justify-between rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-white')}
                      >
                        <div>
                          <p className={clsx('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{request.user.name}</p>
                          <p className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>@{request.user.username}</p>
                        </div>
                        <span className={clsx('text-xs font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>Pending</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Friend">
        <div className="space-y-4">
          <div className="relative">
            <Search className={clsx('absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or email"
              className={clsx(
                'w-full pl-10 pr-4 py-3 rounded-2xl text-sm border outline-none transition-all',
                isDark
                  ? 'bg-white/5 border-white/10 text-white focus:border-violet-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-400'
              )}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {results.length === 0 && (
              <p className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>No results yet.</p>
            )}
            {results.map((user) => (
              <div
                key={user.id}
                className={clsx(
                  'flex items-center justify-between gap-3 rounded-2xl border p-3',
                  isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-white'
                )}
              >
                <div>
                  <p className={clsx('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{user.name}</p>
                  <p className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>@{user.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendRequest(user.id)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
