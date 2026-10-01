import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, RefreshCw, ShoppingCart } from 'lucide-react';
import { fetchShopifyStore, ShopifyStoreCheckout, ShopifyStoreCheckoutsResponse } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import EmptyState from '../EmptyState';
import { formatCurrency, formatNumber } from './shopifyFormatters';
import {
  SortLoadingBanner,
  SortableTh,
  fetchAllRemainingPages,
  useSortableRows,
} from './sortableTable';

const CheckoutsTab = () => {
  const [checkouts, setCheckouts] = useState<ShopifyStoreCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [sortTruncated, setSortTruncated] = useState(false);

  const load = useCallback(async (opts: { append?: boolean; cursor?: string | null } = {}) => {
    const append = opts.append ?? false;
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    setSortTruncated(false);
    try {
      const result = await fetchShopifyStore<ShopifyStoreCheckoutsResponse>({
        resource: 'checkouts', cursor: opts.cursor ?? null, limit: 40,
      });
      setCheckouts((prev) => append ? [...prev, ...result.checkouts] : result.checkouts);
      setCursor(result.pageInfo.endCursor);
      setHasNextPage(result.pageInfo.hasNextPage);
    } catch (err) {
      console.error(err);
      setError('Unable to load abandoned checkouts. Confirm read_checkouts / related scopes.');
      if (!append) setCheckouts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadAllForSort = useCallback(async () => {
    const result = await fetchAllRemainingPages({
      hasNextPage,
      cursor,
      currentItems: checkouts,
      fetchPage: async (pageCursor) => {
        const page = await fetchShopifyStore<ShopifyStoreCheckoutsResponse>({
          resource: 'checkouts',
          cursor: pageCursor,
          limit: 100,
        });
        return { items: page.checkouts, pageInfo: page.pageInfo };
      },
    });
    setCheckouts(result.items);
    setCursor(result.cursor);
    setHasNextPage(result.hasNextPage);
    setSortTruncated(result.truncated);
  }, [hasNextPage, cursor, checkouts]);

  type CheckoutSortKey = 'customer' | 'created' | 'items' | 'total';
  const accessors = useMemo(() => ({
    customer: (row: ShopifyStoreCheckout) => row.customerName || row.customerEmail || '',
    created: (row: ShopifyStoreCheckout) => row.createdAt,
    items: (row: ShopifyStoreCheckout) => row.itemCount,
    total: (row: ShopifyStoreCheckout) => row.total,
  }), []);
  const { sortedRows, sort, toggleSort, loadingAll } = useSortableRows<ShopifyStoreCheckout, CheckoutSortKey>(
    checkouts,
    accessors,
    { hasMore: hasNextPage, loadAll: loadAllForSort }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Abandoned checkouts</h2>
          <p className="text-sm text-gray-500 mt-0.5">Recent incomplete checkouts for recovery and conversion follow-up.</p>
        </div>
        <button type="button" onClick={() => load()} className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      <SortLoadingBanner loading={loadingAll} count={checkouts.length} />

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : error ? (
        <div className="page-card p-8 text-center"><p className="text-red-600 mb-4">{error}</p><button type="button" onClick={() => load()} className="btn-primary">Retry</button></div>
      ) : checkouts.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="w-6 h-6" />} title="No abandoned checkouts" description="Nothing to review right now." />
      ) : (
        <>
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-ink">{formatNumber(checkouts.length)}</span> checkouts
            {sort.key ? ' · sorted across full loaded set' : ''}
            {sortTruncated ? ' · sort capped at max pages' : ''}
            {hasNextPage && !sort.key ? ' (more available)' : ''}
          </div>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead><tr>
                <SortableTh label="Customer" column="customer" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Created" column="created" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Items" column="items" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Total" column="total" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <th></th>
              </tr></thead>
              <tbody>
                {sortedRows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <p className="font-medium text-ink">{c.customerName || 'Guest'}</p>
                      <p className="text-xs text-gray-400">{c.customerEmail || c.customerPhone || '—'}</p>
                      {c.lineItems[0] && <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{c.lineItems.map((i) => `${i.quantity}× ${i.title}`).join(', ')}</p>}
                    </td>
                    <td className="text-sm text-gray-500 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="tabular-nums text-sm">{formatNumber(c.itemCount)}</td>
                    <td className="font-semibold tabular-nums">{formatCurrency(c.total, c.currency)}</td>
                    <td className="text-right">
                      {c.recoveryUrl && (
                        <a href={c.recoveryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover">
                          Recovery <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasNextPage && !sort.key && (
            <div className="flex justify-center">
              <button type="button" onClick={() => load({ append: true, cursor })} disabled={loadingMore} className="btn-secondary inline-flex items-center gap-2">
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />} Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CheckoutsTab;
