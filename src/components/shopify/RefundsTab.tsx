import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { fetchShopifyStore, ShopifySalesPeriod, ShopifyStoreRefund, ShopifyStoreRefundsResponse } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import EmptyState from '../EmptyState';
import { formatCurrency, formatNumber } from './shopifyFormatters';
import { SortableTh, useSortableRows } from './sortableTable';

const PERIOD_OPTIONS: { value: ShopifySalesPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'last_90', label: 'Last 90 days' },
  { value: 'current_month', label: 'This month' },
  { value: 'last_12_months', label: 'Last 12 months' },
];

const RefundsTab = () => {
  const [period, setPeriod] = useState<ShopifySalesPeriod>('last_30');
  const [data, setData] = useState<ShopifyStoreRefundsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShopifyStore<ShopifyStoreRefundsResponse>({ resource: 'refunds', period });
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Unable to load refunds.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  type RefundSortKey = 'order' | 'date' | 'customer' | 'items' | 'amount';
  const refundRows = data?.refunds ?? [];
  const accessors = useMemo(() => ({
    order: (row: ShopifyStoreRefund) => row.orderName,
    date: (row: ShopifyStoreRefund) => row.createdAt,
    customer: (row: ShopifyStoreRefund) => row.customerName || row.customerEmail || '',
    items: (row: ShopifyStoreRefund) => row.lineItems.map((i) => i.title).join(', '),
    amount: (row: ShopifyStoreRefund) => row.amount,
  }), []);
  const { sortedRows, sort, toggleSort } = useSortableRows<ShopifyStoreRefund, RefundSortKey>(refundRows, accessors);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Refunds & returns</h2>
          <p className="text-sm text-gray-500 mt-0.5">Refund activity for the selected period.</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="label-field">Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value as ShopifySalesPeriod)} className="select-field min-w-[10rem]">
              {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button type="button" onClick={load} className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : error && !data ? (
        <div className="page-card p-8 text-center"><p className="text-red-600 mb-4">{error}</p><button type="button" onClick={load} className="btn-primary">Retry</button></div>
      ) : data ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="page-card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total refunded</p>
              <p className="text-2xl font-bold text-ink tabular-nums mt-2">{formatCurrency(data.summary.totalRefunded, data.summary.currency)}</p>
              <p className="text-xs text-gray-400 mt-1">{data.period.dateRangeLabel}</p>
            </div>
            <div className="page-card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Refund count</p>
              <p className="text-2xl font-bold text-ink tabular-nums mt-2">{formatNumber(data.summary.refundCount)}</p>
              {data.summary.truncated && <p className="text-xs text-amber-600 mt-1">Results may be truncated for large periods.</p>}
            </div>
          </div>
          {data.refunds.length === 0 ? (
            <EmptyState icon={<RotateCcw className="w-6 h-6" />} title="No refunds in this period" />
          ) : (
            <div className="table-shell overflow-x-auto">
              <table className="w-full min-w-[880px]">
                <thead><tr>
                  <SortableTh label="Order" column="order" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Date" column="date" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Customer" column="customer" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Items" column="items" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Amount" column="amount" sort={sort} onSort={toggleSort} align="right" className="text-right" />
                </tr></thead>
                <tbody>
                  {sortedRows.map((r: ShopifyStoreRefund) => (
                    <tr key={r.id}>
                      <td className="font-medium text-ink">{r.orderName}</td>
                      <td className="text-sm text-gray-500">{formatDate(r.createdAt)}</td>
                      <td>
                        <p className="text-sm text-ink">{r.customerName || 'Guest'}</p>
                        {r.customerEmail && <p className="text-xs text-gray-400">{r.customerEmail}</p>}
                      </td>
                      <td className="text-xs text-gray-500 max-w-xs truncate">{r.lineItems.map((i) => `${i.quantity}× ${i.title}`).join(', ') || r.note || '—'}</td>
                      <td className="text-right font-semibold tabular-nums text-red-600">{formatCurrency(r.amount, r.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default RefundsTab;
