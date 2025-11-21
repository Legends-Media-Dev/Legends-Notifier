import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Smartphone, Calendar, User as UserIcon, Mail, Monitor, Search } from 'lucide-react';
import { fetchSegmentUsers, User } from '../lib/api';
import { formatDate } from '../lib/utils';

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
      // Reset when modal closes
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
    if (!token || typeof token !== 'string') return 'N/A';
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{segmentName}</h2>
                  <p className="text-sm text-gray-500 mt-1">Users in this segment</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {searchQuery ? 'No users found matching your search' : 'No users found in this segment'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Email / User ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Device
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Platform
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Expo Token
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Last Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((user, index) => (
                          <tr key={user.id || user.userId || `user-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                {user.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 font-medium">{user.email}</span>
                                  </div>
                                )}
                                {user.userId && (
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">ID: {user.userId}</span>
                                  </div>
                                )}
                                {!user.email && !user.userId && <span className="text-gray-400">N/A</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-900 font-medium">{user.modelName || 'N/A'}</span>
                                </div>
                                {user.brand && (
                                  <span className="text-sm text-gray-500 ml-6">{user.brand}</span>
                                )}
                                {user.osVersion && (
                                  <span className="text-xs text-gray-400 ml-6">OS: {user.osVersion}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700 capitalize">{user.platform || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded font-mono">
                                {truncateToken(user.token)}
                              </code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">
                                  {user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
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

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-2xl">
                <p className="text-sm text-gray-600">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SegmentUsersModal;

