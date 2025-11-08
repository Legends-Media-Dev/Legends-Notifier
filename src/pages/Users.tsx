import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Smartphone, Calendar, User as UserIcon, Mail, Monitor } from 'lucide-react';
import { fetchUsers, User } from '../lib/api';
import { formatDate } from '../lib/utils';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      // Ensure we always set an array
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    // Ensure users is always an array
    const usersArray = Array.isArray(users) ? users : [];
    
    // Filter out any invalid users (null, undefined)
    const validUsers = usersArray.filter(
      (user) => user && typeof user === 'object'
    );
    
    if (!searchQuery.trim()) return validUsers;
    
    const query = searchQuery.toLowerCase();
    return validUsers.filter(
      (user) =>
        user.email?.toLowerCase().includes(query) ||
        user.modelName?.toLowerCase().includes(query) ||
        user.brand?.toLowerCase().includes(query) ||
        user.platform?.toLowerCase().includes(query) ||
        user.token?.toLowerCase().includes(query) ||
        user.userId?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">View all registered devices and users</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by email, device, platform, or token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No users found matching your search' : 'No users found'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email / User ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Expo Token
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
          </div>
        )}
      </div>
    </div>
  );
};

const truncateToken = (token: string | undefined | null, maxLength: number = 30): string => {
  if (!token || typeof token !== 'string') return 'N/A';
  if (token.length <= maxLength) return token;
  return token.slice(0, maxLength) + '...';
};

export default Users;

