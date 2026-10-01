import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

export type SortState<T extends string = string> = {
  key: T | null;
  direction: SortDirection;
};

export function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  direction: SortDirection
): number {
  const emptyA = a === null || a === undefined || a === '';
  const emptyB = b === null || b === undefined || b === '';
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;

  let result = 0;
  if (typeof a === 'number' && typeof b === 'number') {
    result = a - b;
  } else {
    result = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }
  return direction === 'asc' ? result : -result;
}

/** Max pages to pull when sorting the full dataset (safety cap). */
export const FULL_SORT_MAX_PAGES = 40;

export async function fetchAllRemainingPages<T>(options: {
  hasNextPage: boolean;
  cursor: string | null;
  currentItems: T[];
  maxPages?: number;
  fetchPage: (cursor: string | null) => Promise<{
    items: T[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }>;
}): Promise<{
  items: T[];
  cursor: string | null;
  hasNextPage: boolean;
  truncated: boolean;
}> {
  const maxPages = options.maxPages ?? FULL_SORT_MAX_PAGES;
  let items = [...options.currentItems];
  let cursor = options.cursor;
  let hasNextPage = options.hasNextPage;
  let pages = 0;
  let truncated = false;

  while (hasNextPage && pages < maxPages) {
    const page = await options.fetchPage(cursor);
    items = [...items, ...page.items];
    cursor = page.pageInfo.endCursor;
    hasNextPage = page.pageInfo.hasNextPage;
    pages += 1;
  }

  if (hasNextPage) truncated = true;

  return { items, cursor, hasNextPage: false, truncated };
}

export function useSortableRows<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => string | number | null | undefined>,
  options?: {
    initial?: SortState<K>;
    /** True when more pages exist beyond `rows`. */
    hasMore?: boolean;
    /** Load every remaining page before applying a new sort. */
    loadAll?: () => Promise<void>;
  }
) {
  const [sort, setSort] = useState<SortState<K>>(
    options?.initial ?? { key: null, direction: 'asc' }
  );
  const [loadingAll, setLoadingAll] = useState(false);

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows;
    const accessor = accessors[sort.key];
    if (!accessor) return rows;
    return [...rows].sort((a, b) =>
      compareSortValues(accessor(a), accessor(b), sort.direction)
    );
  }, [rows, sort, accessors]);

  const toggleSort = async (key: K) => {
    const next: SortState<K> = (() => {
      if (sort.key !== key) return { key, direction: 'asc' };
      if (sort.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };
    })();

    // Only need the full dataset when applying an active sort.
    if (next.key && options?.hasMore && options?.loadAll) {
      setLoadingAll(true);
      try {
        await options.loadAll();
      } finally {
        setLoadingAll(false);
      }
    }

    setSort(next);
  };

  return { sortedRows, sort, toggleSort, loadingAll };
}

export function SortableTh<K extends string>({
  label,
  column,
  sort,
  onSort,
  className = '',
  align = 'left',
  disabled = false,
}: {
  label: string;
  column: K;
  sort: SortState<K>;
  onSort: (column: K) => void;
  className?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1.5 w-full font-semibold uppercase tracking-wide text-xs transition-colors hover:text-ink disabled:opacity-60 disabled:cursor-wait ${
          align === 'right' ? 'justify-end' : 'justify-start'
        } ${active ? 'text-ink' : 'text-gray-500'}`}
      >
        <span>{label}</span>
        <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-accent' : 'text-gray-300'}`} />
      </button>
    </th>
  );
}

export function SortLoadingBanner({
  loading,
  count,
}: {
  loading: boolean;
  count: number;
}) {
  if (!loading) return null;
  return (
    <div className="rounded-xl border border-accent/20 bg-accent-light/60 px-4 py-3 text-sm text-ink flex items-center gap-2">
      <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
      Loading all records to sort ({count.toLocaleString()} loaded so far)…
    </div>
  );
}
