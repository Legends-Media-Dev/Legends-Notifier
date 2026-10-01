import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Percent, RefreshCw, Search, Ticket } from 'lucide-react';
import { fetchShopifyStore, ShopifyStoreDiscount, ShopifyStoreDiscountsResponse } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import EmptyState from '../EmptyState';
import { StatusPill, formatNumber } from './shopifyFormatters';
import { SortableTh, useSortableRows } from './sortableTable';

const DiscountsTab = () => {
  const [discounts, setDiscounts] = useState<ShopifyStoreDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShopifyStore<ShopifyStoreDiscountsResponse>({
        resource: 'discounts', search: search || undefined, status,
      });
      setDiscounts(result.discounts);
    } catch (err) {
      console.error(err);
      setError('Unable to load discounts. Confirm read_discounts scope on the Admin API token.');
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  type DiscountSortKey = 'title' | 'type' | 'status' | 'value' | 'usage' | 'dates';
  const accessors = useMemo(() => ({
    title: (row: ShopifyStoreDiscount) => row.title,
    type: (row: ShopifyStoreDiscount) => row.type,
    status: (row: ShopifyStoreDiscount) => row.status || '',
    value: (row: ShopifyStoreDiscount) => row.valueLabel || '',
    usage: (row: ShopifyStoreDiscount) => row.usageCount,
    dates: (row: ShopifyStoreDiscount) => row.startsAt || '',
  }), []);
  const { sortedRows, sort, toggleSort } = useSortableRows<ShopifyStoreDiscount, DiscountSortKey>(discounts, accessors);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Discounts</h2>
          <p className="text-sm text-gray-500 mt-0.5">Code and automatic discounts currently configured on the store.</p>
        </div>
        <button type="button" onClick={load} className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center self-end"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search title or code..." className="input-field pl-10" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select-field min-w-[9rem]">
          <option value="ACTIVE">Active</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="EXPIRED">Expired</option>
          <option value="ALL">All</option>
        </select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : error ? (
        <div className="page-card p-8 text-center"><p className="text-red-600 mb-4">{error}</p><button type="button" onClick={load} className="btn-primary">Retry</button></div>
      ) : discounts.length === 0 ? (
        <EmptyState icon={<Ticket className="w-6 h-6" />} title="No discounts found" description="Try another status or search." />
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead><tr>
              <SortableTh label="Discount" column="title" sort={sort} onSort={toggleSort} />
              <SortableTh label="Type" column="type" sort={sort} onSort={toggleSort} />
              <SortableTh label="Status" column="status" sort={sort} onSort={toggleSort} />
              <SortableTh label="Value" column="value" sort={sort} onSort={toggleSort} />
              <SortableTh label="Usage" column="usage" sort={sort} onSort={toggleSort} />
              <SortableTh label="Dates" column="dates" sort={sort} onSort={toggleSort} />
            </tr></thead>
            <tbody>
              {sortedRows.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="flex items-start gap-2">
                      <Percent className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{d.title}</p>
                        {d.codes.length > 0 && <p className="text-xs text-gray-400 font-mono truncate">{d.codes.slice(0, 3).join(', ')}</p>}
                        {d.summary && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{d.summary}</p>}
                      </div>
                    </div>
                  </td>
                  <td><StatusPill label={d.type === 'code' ? 'Code' : 'Automatic'} tone={d.type === 'code' ? 'info' : 'neutral'} /></td>
                  <td><StatusPill label={d.status || '—'} tone={(d.status || '').toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'} /></td>
                  <td className="text-sm text-ink">{d.valueLabel || '—'}</td>
                  <td className="text-sm tabular-nums text-gray-600">{formatNumber(d.usageCount)}{d.usageLimit != null ? ` / ${formatNumber(d.usageLimit)}` : ''}</td>
                  <td className="text-xs text-gray-500 whitespace-nowrap">
                    {d.startsAt ? formatDate(d.startsAt) : '—'}
                    {d.endsAt ? ` → ${formatDate(d.endsAt)}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DiscountsTab;
