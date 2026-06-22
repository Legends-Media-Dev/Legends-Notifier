import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Smartphone, Calendar, User as UserIcon, Mail, Monitor, Users as UsersGroupIcon } from 'lucide-react';
import { fetchUsers, User } from '../lib/api';
import { formatDate } from '../lib/utils';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      if (hasLoadedOnce) setIsRefreshing(true);
      else setLoading(true);
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const usersArray = Array.isArray(users) ? users : [];
    const validUsers = usersArray.filter((user) => user && typeof user === 'object');

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

  const getGroupsForUser = (user: User): string[] => {
    const u = user as Record<string, unknown>;
    const g = (u.groups ?? u.group ?? u.userGroups) as string[] | { id?: string; name?: string }[] | undefined;
    if (!g || !Array.isArray(g)) return [];
    return g
      .map((item) => (typeof item === 'string' ? item : (item?.name ?? (item as { id?: string }).id ?? '')))
      .filter(Boolean) as string[];
  };

  const userCount = Array.isArray(users) ? users.length : 0;

  return (
    <PageLayout
      title="Users"
      description="View all registered devices and push notification subscribers"
    >
      <div className="mb-6">
        <div className="inline-flex items-center gap-3 px-5 py-4 page-card">
          <div className="section-icon">
            <UserIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Push enabled</p>
            <p className="text-2xl font-bold text-ink tabular-nums">
              {loading ? '—' : userCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, device, platform, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<UserIcon className="w-7 h-7" />}
          title={searchQuery ? 'No matching users' : 'No users found'}
          description={
            searchQuery
              ? 'Try a different search term.'
              : 'Registered devices will appear here once users enable push notifications.'
          }
        />
      ) : (
        <div className="table-shell relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr>
                  <th>Email / User ID</th>
                  <th>Device</th>
                  <th>Platform</th>
                  <th>Expo Token</th>
                  <th>Groups</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id || user.userId || `user-${index}`}>
                    <td className="whitespace-nowrap">
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
                    <td className="whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-ink">{user.modelName || '—'}</span>
                        </div>
                        {user.brand && <span className="text-xs text-gray-500 ml-6">{user.brand}</span>}
                        {user.osVersion && <span className="text-xs text-gray-400 ml-6">OS: {user.osVersion}</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 capitalize">{user.platform || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-xs text-gray-600 bg-surface-muted px-2 py-1 rounded-lg font-mono">
                        {truncateToken(user.token)}
                      </code>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {getGroupsForUser(user).length === 0 ? (
                          <span className="text-gray-300 text-sm">—</span>
                        ) : (
                          getGroupsForUser(user).map((groupName) => (
                            <span
                              key={groupName}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-light text-accent text-xs font-medium"
                            >
                              <UsersGroupIcon className="w-3 h-3" />
                              {groupName}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
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
        </div>
      )}
    </PageLayout>
  );
};

const truncateToken = (token: string | undefined | null, maxLength: number = 30): string => {
  if (!token || typeof token !== 'string') return '—';
  if (token.length <= maxLength) return token;
  return token.slice(0, maxLength) + '...';
};

export default Users;
