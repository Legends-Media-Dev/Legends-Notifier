import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Search, Users } from 'lucide-react';
import { fetchShopifyStore, ShopifyStoreCustomer, ShopifyStoreCustomersResponse } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import EmptyState from '../EmptyState';
import { formatCurrency, formatNumber } from './shopifyFormatters';
import {
  SortLoadingBanner,
  SortableTh,
  fetchAllRemainingPages,
  useSortableRows,
} from './sortableTable';

const CustomersTab = () => {
  const [customers, setCustomers] = useState<ShopifyStoreCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [sortTruncated, setSortTruncated] = useState(false);

  const load = useCallback(async (opts: { append?: boolean; cursor?: string | null } = {}) => {
    const append = opts.append ?? false;
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    setSortTruncated(false);
    try {
      const result = await fetchShopifyStore<ShopifyStoreCustomersResponse>({
        resource: 'customers', search: search || undefined, cursor: opts.cursor ?? null, limit: 50,
      });
      setCustomers((prev) => append ? [...prev, ...result.customers] : result.customers);
      setCursor(result.pageInfo.endCursor);
      setHasNextPage(result.pageInfo.hasNextPage);
    } catch (err) {
      console.error(err);
      setError('Unable to load customers. Confirm the Admin API has read_customers scope.');
      if (!append) setCustomers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadAllForSort = useCallback(async () => {
    const result = await fetchAllRemainingPages({
      hasNextPage,
      cursor,
      currentItems: customers,
      fetchPage: async (pageCursor) => {
        const page = await fetchShopifyStore<ShopifyStoreCustomersResponse>({
          resource: 'customers',
          search: search || undefined,
          cursor: pageCursor,
          limit: 100,
        });
        return { items: page.customers, pageInfo: page.pageInfo };
      },
    });
    setCustomers(result.items);
    setCursor(result.cursor);
    setHasNextPage(result.hasNextPage);
    setSortTruncated(result.truncated);
  }, [hasNextPage, cursor, customers, search]);

  type CustomerSortKey = 'name' | 'location' | 'orders' | 'spent' | 'lastOrder' | 'tags';
  const accessors = useMemo(() => ({
    name: (row: ShopifyStoreCustomer) => row.displayName || row.email || '',
    location: (row: ShopifyStoreCustomer) => row.location || '',
    orders: (row: ShopifyStoreCustomer) => row.numberOfOrders,
    spent: (row: ShopifyStoreCustomer) => row.amountSpent,
    lastOrder: (row: ShopifyStoreCustomer) => row.lastOrder?.createdAt || '',
    tags: (row: ShopifyStoreCustomer) => row.tags.join(', '),
  }), []);
  const { sortedRows, sort, toggleSort, loadingAll } = useSortableRows<ShopifyStoreCustomer, CustomerSortKey>(
    customers,
    accessors,
    { hasMore: hasNextPage, loadAll: loadAllForSort }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Customers</h2>
          <p className="text-sm text-gray-500 mt-0.5">Lookup customers by email, name, or tag for support assistance.</p>
        </div>
        <button type="button" onClick={() => load()} className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center self-end"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search email, name, phone, tag..." className="input-field pl-10" />
      </div>
      <SortLoadingBanner loading={loadingAll} count={customers.length} />

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : error ? (
        <div className="page-card p-8 text-center"><p className="text-red-600 mb-4">{error}</p><button type="button" onClick={() => load()} className="btn-primary">Retry</button></div>
      ) : customers.length === 0 ? (
        <EmptyState icon={<Users className="w-6 h-6" />} title="No customers found" description="Try another search." />
      ) : (
        <>
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-ink">{formatNumber(customers.length)}</span> customers
            {sort.key ? ' · sorted across full loaded set' : ''}
            {sortTruncated ? ' · sort capped at max pages' : ''}
            {hasNextPage && !sort.key ? ' (more available)' : ''}
          </div>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead><tr>
                <SortableTh label="Customer" column="name" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Location" column="location" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Orders" column="orders" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Spent" column="spent" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Last order" column="lastOrder" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Tags" column="tags" sort={sort} onSort={toggleSort} disabled={loadingAll} />
              </tr></thead>
              <tbody>
                {sortedRows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <p className="font-medium text-ink">{c.displayName || 'Customer'}</p>
                      <p className="text-xs text-gray-400">{c.email || c.phone || '—'}</p>
                    </td>
                    <td className="text-sm text-gray-500">{c.location || '—'}</td>
                    <td className="tabular-nums text-sm">{formatNumber(c.numberOfOrders)}</td>
                    <td className="tabular-nums font-medium">{formatCurrency(c.amountSpent, c.currency)}</td>
                    <td className="text-sm text-gray-500">
                      {c.lastOrder ? `${c.lastOrder.name} · ${formatDate(c.lastOrder.createdAt)}` : '—'}
                    </td>
                    <td className="text-xs text-gray-400 max-w-[180px] truncate">{c.tags.join(', ') || '—'}</td>
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

export default CustomersTab;
