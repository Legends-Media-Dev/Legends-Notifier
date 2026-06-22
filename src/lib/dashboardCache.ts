import type { DashboardStats } from './api';

export type DashboardPeriod = 'current_month' | '7' | '30' | '90' | 'lifetime';

const CACHE_PREFIX = 'legends-dashboard-stats-v1';
const TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  data: DashboardStats;
  fetchedAt: number;
}

function cacheKey(period: DashboardPeriod): string {
  return `${CACHE_PREFIX}:${period}`;
}

export function isDashboardCacheFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < TTL_MS;
}

export function getDashboardCache(
  period: DashboardPeriod
): { data: DashboardStats; fetchedAt: number } | null {
  try {
    const raw = localStorage.getItem(cacheKey(period));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry?.data || typeof entry.fetchedAt !== 'number') {
      localStorage.removeItem(cacheKey(period));
      return null;
    }

    return { data: entry.data, fetchedAt: entry.fetchedAt };
  } catch {
    return null;
  }
}

export function setDashboardCache(period: DashboardPeriod, data: DashboardStats): void {
  try {
    const entry: CacheEntry = { data, fetchedAt: Date.now() };
    localStorage.setItem(cacheKey(period), JSON.stringify(entry));
  } catch {
    // Ignore quota / private mode errors
  }
}

export function clearDashboardCache(period?: DashboardPeriod): void {
  try {
    if (period) {
      localStorage.removeItem(cacheKey(period));
      return;
    }
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export function formatCacheAge(fetchedAt: number): string {
  const minutes = Math.floor((Date.now() - fetchedAt) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  return 'over an hour ago';
}
