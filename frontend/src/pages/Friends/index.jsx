import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, Inbox, Search, Check, X, UserX, User, ShieldCheck, Globe, Zap } from 'lucide-react';
import { 
  useGetFriendsQuery, 
  useGetFriendRequestsQuery, 
  useSearchFriendsQuery, 
  useSendFriendRequestMutation, 
  useAcceptFriendRequestMutation, 
  useRejectFriendRequestMutation, 
  useRemoveFriendMutation 
} from '../../store/api/friendApi';
import useThemeStore from '../../store/themeStore';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const tabItems = [
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'requests', label: 'Requests', icon: Inbox },
];

export default function Friends() {
  const { isDark } = useThemeStore();
  const [activeTab, setActiveTab] = useState('friends');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: friendsData = [], isLoading: isLoadingFriends } = useGetFriendsQuery();
  const { data: requestsData = {} } = useGetFriendRequestsQuery();
  
  const [sendRequest] = useSendFriendRequestMutation();
  const [acceptRequest] = useAcceptFriendRequestMutation();
  const [rejectRequest] = useRejectFriendRequestMutation();
  const [removeFriend] = useRemoveFriendMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [], isFetching: isSearching } = useSearchFriendsQuery(searchQuery, {
    skip: !searchQuery,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchQuery(query.trim());
  };

  const handleSendRequest = async (id) => {
    try {
      await sendRequest(id).unwrap();
      toast.success('Friend request sent');
    } catch (error) {
      toast.error(error?.data?.message || 'Could not send request.');
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptRequest(id).unwrap();
      toast.success('Friend request accepted');
    } catch (error) {
      toast.error('Could not accept request.');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequest(id).unwrap();
      toast.success('Friend request rejected');
    } catch (error) {
       toast.error('Could not reject request.');
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this friend?')) return;
    try {
      await removeFriend(id).unwrap();
      toast.success('Friend removed');
    } catch (error) {
      toast.error('Could not remove friend.');
    }
  };

  const friends = friendsData || [];
  const incoming = requestsData.incoming || [];
  const outgoing = requestsData.outgoing || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 sm:space-y-12 p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-12 sm:pb-20 mesh-gradient rounded-[2rem] sm:rounded-[4rem]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
        <div className="space-y-2">
           <p className={clsx('text-[10px] font-black uppercase tracking-[0.4em]', isDark ? 'text-indigo-400' : 'text-indigo-600')}>Your circle</p>
           <h2 className={clsx('text-4xl sm:text-5xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>Friends</h2>
           <p className={clsx('text-sm lg:text-base font-bold opacity-50', isDark ? 'text-gray-300' : 'text-gray-600')}>
              Add friends and track progress together.
           </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="btn-primary w-full md:w-auto px-6 sm:px-8 py-4 sm:py-5"
        >
          <UserPlus className="w-5 h-5 stroke-[3]" /> Add friend
        </motion.button>
      </div>

      <div className={clsx('rounded-[2rem] sm:rounded-[3.5rem] border overflow-hidden glass-card transition-all', isDark ? 'bg-white/[0.02]' : 'bg-white')}>
        <div className="flex flex-wrap gap-3 sm:gap-4 p-4 sm:p-8 border-b border-white/5">
          {tabItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'flex items-center gap-3 px-6 py-3.5 rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all',
                activeTab === id
                  ? 'bg-gradient-main text-white shadow-xl shadow-violet-500/20'
                  : isDark ? 'bg-white/5 text-gray-500 hover:bg-white/10' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'friends' ? (
              <motion.div key="friends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {isLoadingFriends ? (
                  <div className="py-20 flex flex-col items-center gap-4">
                     <Loader />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Loading friends...</p>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-20 opacity-40 rounded-[2.5rem] border-2 border-dashed border-white/10">
                    <Globe className="w-12 h-12 mx-auto mb-6 text-gray-500" />
                    <p className="font-bold text-sm uppercase tracking-widest">No friends yet. Add friends to share progress.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {friends.map((friend) => (
                      <motion.div
                        key={friend._id || friend.id}
                        layout
                        whileHover={{ x: 10 }}
                      className={clsx(
                          'flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 rounded-[1.5rem] sm:rounded-[2.5rem] border p-4 sm:p-6 transition-all',
                          isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-50 bg-gray-50/30'
                        )}
                      >
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.8rem] bg-gradient-main flex items-center justify-center font-black text-white text-lg sm:text-xl shadow-lg shadow-violet-500/20">
                            {friend.name?.[0]?.toUpperCase() || 'O'}
                          </div>
                          <div>
                            <p className={clsx('text-lg font-black', isDark ? 'text-white' : 'text-gray-900')}>{friend.name}</p>
                            <div className="flex items-center gap-2 mt-1 opacity-40">
                               <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                               <span className="text-[10px] font-black uppercase tracking-widest">@{friend.username || 'friend'}</span>
                            </div>
                          </div>
                        </div>
                          <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemove(friend._id || friend.id)}
                            className={clsx(
                              'p-3 sm:p-4 rounded-2xl transition-all',
                            isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          )}
                        >
                          <UserX className="w-5 h-5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-4">
                     <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                     <h4 className={clsx('text-xs font-black uppercase tracking-widest', isDark ? 'text-gray-400' : 'text-gray-700')}>New requests</h4>
                  </div>
                  {incoming.length === 0 ? (
                    <div className="p-8 rounded-[2rem] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center">
                       No new requests
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {incoming.map((request) => (
                        <div
                          key={request.requestId}
                          className={clsx('flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 rounded-[1.5rem] sm:rounded-[2.5rem] border p-4 sm:p-6', isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-white shadow-sm')}
                        >
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-500/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-indigo-400" />
                             </div>
                             <div>
                                <p className={clsx('text-sm font-black', isDark ? 'text-white' : 'text-gray-900')}>{request.user?.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">@{request.user?.username}</p>
                             </div>
                          </div>
                          <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAccept(request.requestId)}
                              className="btn-primary flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs"
                            >
                              <Check className="w-4 h-4 stroke-[3]" /> Accept
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReject(request.requestId)}
                              className="btn-danger flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs"
                            >
                              <X className="w-4 h-4 stroke-[3]" /> Reject
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <h4 className={clsx('text-xs font-black uppercase tracking-widest px-4', isDark ? 'text-gray-400' : 'text-gray-700')}>Sent requests</h4>
                  {outgoing.length === 0 ? (
                    <div className="p-8 rounded-[2rem] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center">
                       No sent requests.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {outgoing.map((request) => (
                        <div
                          key={request.requestId}
                          className={clsx('flex items-center justify-between rounded-[1.5rem] sm:rounded-[2.5rem] border p-4 sm:p-6', isDark ? 'border-white/5 bg-black/20' : 'border-gray-50 bg-gray-50/30')}
                        >
                          <div className="flex items-center gap-5 opacity-60">
                             <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                             <div>
                                <p className={clsx('text-sm font-black', isDark ? 'text-white' : 'text-gray-900')}>{request.user?.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest">@{request.user?.username}</p>
                             </div>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-500 animate-pulse">Pending</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Friend Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Find Friends">
        <div className="space-y-10 p-2">
          <form onSubmit={handleSearch} className="relative group">
            <Search className={clsx('absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors', isDark ? 'text-gray-600 group-focus-within:text-violet-500' : 'text-gray-400 group-focus-within:text-violet-500')} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or email"
              className={clsx(
                'w-full pl-16 pr-6 py-5 rounded-[2.2rem] text-sm font-black border-2 outline-none transition-all',
                isDark ? 'bg-white/5 border-white/5 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-violet-400 shadow-sm'
              )}
            />
            <button type="submit" className="hidden">Search</button>
          </form>

          <div className="space-y-4 max-h-[400px] overflow-y-auto px-2 custom-scrollbar">
            {isSearching ? (
               <div className="flex flex-col items-center py-20 gap-4">
                  <Loader />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Searching...</p>
               </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[2rem]">
                 <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                 <p className="text-[10px] font-black uppercase tracking-widest">{searchQuery ? 'No users found.' : 'Search to find friends.'}</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <motion.div
                  key={user._id || user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={clsx(
                    'flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 rounded-[1.5rem] sm:rounded-[2.5rem] border p-4 sm:p-6 transition-all hover:bg-white/5',
                    isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-white shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-main flex items-center justify-center font-black text-white shadow-lg">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className={clsx('text-sm font-black', isDark ? 'text-white' : 'text-gray-900')}>{user.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">@{user.username}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSendRequest(user._id || user.id)}
                    className="btn-primary w-full sm:w-auto px-6 py-3 text-xs"
                  >
                    Connect
                  </motion.button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
