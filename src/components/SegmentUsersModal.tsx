import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Smartphone, Calendar, User as UserIcon, Mail, Monitor, Search } from 'lucide-react';
import { fetchSegmentUsers, User } from '../lib/api';
import { formatDate } from '../lib/utils';
import LoadingButton from './LoadingButton';

interface SegmentUsersModalProps {
  segmentName: string;
  segmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const SegmentUsersModal = ({
  segmentName,
  segmentId,
  isOpen,
  onClose,
}: SegmentUsersModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && segmentId) {
      loadUsers();
    } else {
      setUsers([]);
      setSearchQuery('');
    }
  }, [isOpen, segmentId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchSegmentUsers(segmentId);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load segment users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.modelName?.toLowerCase().includes(query) ||
      user.brand?.toLowerCase().includes(query) ||
      user.platform?.toLowerCase().includes(query) ||
      user.token?.toLowerCase().includes(query) ||
      user.userId?.toLowerCase().includes(query)
    );
  });

  const truncateToken = (token: string | undefined | null, maxLength: number = 30): string => {
    if (!token || typeof token !== 'string') return '—';
    if (token.length <= maxLength) return token;
    return token.slice(0, maxLength) + '...';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">{segmentName}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Users in this segment</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-ink font-semibold">
                      {searchQuery ? 'No matching users' : 'No users in this segment'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery ? 'Try a different search term.' : 'This segment has no members yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-200 bg-surface-muted/60">
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email / User ID</th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Device</th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform</th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expo Token</th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((user, index) => (
                          <tr key={user.id || user.userId || `user-${index}`} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                {user.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-ink">{user.email}</span>
                                  </div>
                                )}
                                {user.userId && (
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-500">ID: {user.userId}</span>
                                  </div>
                                )}
                                {!user.email && !user.userId && <span className="text-gray-400 text-sm">—</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium text-ink">{user.modelName || '—'}</span>
                                </div>
                                {user.brand && <span className="text-xs text-gray-500 ml-6">{user.brand}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700 capitalize">{user.platform || '—'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-xs text-gray-600 bg-surface-muted px-2 py-1 rounded-lg font-mono">
                                {truncateToken(user.token)}
                              </code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {user.updatedAt ? formatDate(user.updatedAt) : '—'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-surface-muted flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
                <LoadingButton variant="primary" onClick={onClose} className="!py-2">
                  Close
                </LoadingButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SegmentUsersModal;
