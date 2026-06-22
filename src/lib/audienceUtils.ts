import { fetchUsers, fetchUserGroups, UserGroup } from './api';

export async function resolveAudienceTokens(userGroup: string): Promise<string[]> {
  const groupId = userGroup || 'allUsers';

  if (groupId === 'allUsers' || groupId === 'all') {
    const allUsers = await fetchUsers();
    return allUsers
      .filter((u) => u.token && typeof u.token === 'string')
      .map((u) => u.token as string);
  }

  const groups = await fetchUserGroups();
  const group = groups.find(
    (g: UserGroup) =>
      g.id === groupId ||
      (g.name || '').toLowerCase() === groupId.toLowerCase() ||
      (g.metaName || '').toLowerCase() === groupId.toLowerCase()
  );

  if (group?.tokens?.length) {
    return group.tokens.filter((t): t is string => typeof t === 'string');
  }

  const allUsers = await fetchUsers();
  const groupIdLower = groupId.toLowerCase();
  return allUsers
    .filter((u) => {
      const g = u.groups;
      if (!g || !Array.isArray(g)) return false;
      return g.some((item) => {
        const name = typeof item === 'string' ? item : (item?.name ?? (item as { id?: string }).id ?? '');
        return String(name).toLowerCase() === groupIdLower;
      });
    })
    .filter((u) => u.token)
    .map((u) => u.token as string);
}
