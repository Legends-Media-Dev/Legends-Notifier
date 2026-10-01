import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  Loader2,
  Package,
  Receipt,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import {
  fetchShopifySales,
  fetchShopifyStore,
  ShopifySalesPeriod,
  ShopifySalesResponse,
  ShopifyTopProductsResponse,
} from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { ChangeBadge, StatusPill, formatCurrency, formatNumber } from './shopifyFormatters';
import { SortableTh, useSortableRows } from './sortableTable';
import type { ShopifyRecentOrder, ShopifyTopProduct } from '../../lib/api';

const PERIOD_OPTIONS: { value: ShopifySalesPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'last_90', label: 'Last 90 days' },
  { value: 'current_month', label: 'This month' },
  { value: 'last_12_months', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom' },
];

function fulfillmentTone(status: string | null): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  const s = (status || '').toUpperCase();
  if (s.includes('FULFILLED')) return 'success';
  if (s.includes('PARTIAL') || s.includes('UNFULFILLED')) return 'warning';
  if (s.includes('CANCEL')) return 'danger';
  return 'neutral';
}

function financialTone(status: string | null): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  const s = (status || '').toUpperCase();
  if (s.includes('PAID')) return 'success';
  if (s.includes('PENDING') || s.includes('AUTHORIZED')) return 'warning';
  if (s.includes('REFUND') || s.includes('VOID')) return 'danger';
  return 'info';
}

const SalesReportingTab = () => {
  const [period, setPeriod] = useState<ShopifySalesPeriod>('last_30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<ShopifySalesResponse | null>(null);
  const [topProducts, setTopProducts] = useState<ShopifyTopProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (period === 'custom' && (!customStart || !customEnd)) {
      setError('Select a start and end date for the custom range.');
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const salesParams = {
        period,
        start: period === 'custom' ? customStart : undefined,
        end: period === 'custom' ? customEnd : undefined,
      };
      const [result, top] = await Promise.all([
        fetchShopifySales(salesParams),
        fetchShopifyStore<ShopifyTopProductsResponse>({
          resource: 'top_products',
          ...salesParams,
        }).catch(() => null),
      ]);
      setData(result);
      setTopProducts(top);
    } catch (err) {
      console.error(err);
      setError('Unable to load sales data. Deploy fetchShopifySalesHandler if it is not live yet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const chartMax = useMemo(() => {
    if (!data?.chart.buckets.length) return 1;
    return Math.max(...data.chart.buckets.map((b) => b.sales), 1);
  }, [data]);

  const currency = data?.sales.currency ?? 'USD';

  type TopProductSortKey = 'title' | 'units' | 'revenue';
  const topProductAccessors = useMemo(
    () => ({
      title: (row: ShopifyTopProduct) => row.title,
      units: (row: ShopifyTopProduct) => row.unitsSold,
      revenue: (row: ShopifyTopProduct) => row.revenue,
    }),
    []
  );
  const {
    sortedRows: sortedTopProducts,
    sort: topSort,
    toggleSort: toggleTopSort,
  } = useSortableRows<ShopifyTopProduct, TopProductSortKey>(
    topProducts?.products ?? [],
    topProductAccessors
  );

  type RecentOrderSortKey =
    | 'name'
    | 'date'
    | 'customer'
    | 'channel'
    | 'payment'
    | 'fulfillment'
    | 'total';
  const recentOrderAccessors = useMemo(
    () => ({
      name: (row: ShopifyRecentOrder) => row.name,
      date: (row: ShopifyRecentOrder) => row.createdAt,
      customer: (row: ShopifyRecentOrder) => row.customerName || row.customerEmail || '',
      channel: (row: ShopifyRecentOrder) => row.channel || '',
      payment: (row: ShopifyRecentOrder) => row.financialStatus || '',
      fulfillment: (row: ShopifyRecentOrder) => row.fulfillmentStatus || '',
      total: (row: ShopifyRecentOrder) => row.total,
    }),
    []
  );
  const {
    sortedRows: sortedRecentOrders,
    sort: recentSort,
    toggleSort: toggleRecentSort,
  } = useSortableRows<ShopifyRecentOrder, RecentOrderSortKey>(
    data?.recentOrders ?? [],
    recentOrderAccessors
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Sales & reporting</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Store-wide paid orders with period filters similar to Shopify Analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label-field">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ShopifySalesPeriod)}
              className="select-field min-w-[10.5rem]"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {period === 'custom' && (
            <>
              <div>
                <label className="label-field">Start</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="input-field !py-2 !h-10"
                />
              </div>
              <div>
                <label className="label-field">End</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="input-field !py-2 !h-10"
                />
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              load();
            }}
            disabled={refreshing}
            className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center shrink-0"
            aria-label="Refresh sales"
            title="Refresh sales"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : error && !data ? (
        <div className="page-card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button type="button" onClick={() => load()} className="btn-primary">
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          {data.sales.notice && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {data.sales.notice}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            Showing <span className="font-medium text-ink">{data.period.dateRangeLabel}</span>
            {data.period.comparisonLabel && (
              <> — compared to {data.period.comparisonLabel}</>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: DollarSign,
                label: 'Total sales',
                value: formatCurrency(data.sales.totalSales, currency),
                change: data.sales.salesChange,
              },
              {
                icon: ShoppingBag,
                label: 'Orders',
                value: formatNumber(data.sales.orders),
                change: data.sales.ordersChange,
              },
              {
                icon: Receipt,
                label: 'Average order value',
                value: formatCurrency(data.sales.averageOrderValue, currency),
                change: data.sales.aovChange,
              },
            ].map(({ icon: Icon, label, value, change }) => (
              <div key={label} className="page-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="section-icon !w-9 !h-9">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
                  <ChangeBadge value={change} />
                </div>
              </div>
            ))}
          </div>

          <div className="page-card p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-ink">Sales over time</h3>
              <p className="text-sm text-gray-500">
                By {data.chart.granularity} · {data.period.label}
              </p>
            </div>
            {data.chart.buckets.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No sales in this period</div>
            ) : (
              <div className="flex items-end gap-1.5 sm:gap-2 min-h-[220px] pb-2 overflow-x-auto">
                {data.chart.buckets.map((bucket) => {
                  const heightPct = (bucket.sales / chartMax) * 100;
                  return (
                    <div
                      key={bucket.date}
                      className="flex-1 min-w-[18px] flex flex-col items-center justify-end h-[220px] group"
                    >
                      <div
                        className="w-full max-w-[40px] rounded-t-md bg-accent transition-all duration-300 group-hover:bg-accent-hover"
                        style={{ height: `${Math.max(heightPct, bucket.sales > 0 ? 4 : 0)}%` }}
                        title={`${bucket.label}: ${formatCurrency(bucket.sales, currency)} · ${formatNumber(bucket.orders)} orders`}
                      />
                      <span className="text-[10px] text-gray-400 mt-2 truncate w-full text-center">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {topProducts && topProducts.products.length > 0 && (
            <div className="table-shell overflow-x-auto">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-ink">Top products</h3>
                <p className="text-sm text-gray-500">
                  Best sellers by revenue · {topProducts.period.label}
                  {topProducts.truncated ? ' (partial sample)' : ''}
                </p>
              </div>
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th>#</th>
                    <SortableTh label="Product" column="title" sort={topSort} onSort={toggleTopSort} />
                    <SortableTh label="Units" column="units" sort={topSort} onSort={toggleTopSort} />
                    <SortableTh
                      label="Revenue"
                      column="revenue"
                      sort={topSort}
                      onSort={toggleTopSort}
                      align="right"
                      className="text-right"
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedTopProducts.slice(0, 10).map((product, index) => (
                    <tr key={product.productId || `${product.title}-${index}`}>
                      <td className="text-sm text-gray-400 tabular-nums">{index + 1}</td>
                      <td>
                        <div className="flex items-center gap-3 min-w-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-surface-muted shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{product.title}</p>
                            {product.handle && (
                              <p className="text-xs text-gray-400 truncate">{product.handle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="tabular-nums text-sm text-ink">
                        {formatNumber(product.unitsSold)}
                      </td>
                      <td className="text-right font-semibold tabular-nums text-ink">
                        {formatCurrency(product.revenue, product.currency || currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="table-shell relative">
            {refreshing && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
            )}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">Recent orders</h3>
                <p className="text-sm text-gray-500">Latest paid orders in this period</p>
              </div>
              <Package className="w-4 h-4 text-gray-400" />
            </div>
            {data.recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr>
                      <SortableTh label="Order" column="name" sort={recentSort} onSort={toggleRecentSort} />
                      <SortableTh label="Date" column="date" sort={recentSort} onSort={toggleRecentSort} />
                      <SortableTh label="Customer" column="customer" sort={recentSort} onSort={toggleRecentSort} />
                      <SortableTh label="Channel" column="channel" sort={recentSort} onSort={toggleRecentSort} />
                      <SortableTh label="Payment" column="payment" sort={recentSort} onSort={toggleRecentSort} />
                      <SortableTh
                        label="Fulfillment"
                        column="fulfillment"
                        sort={recentSort}
                        onSort={toggleRecentSort}
                      />
                      <SortableTh
                        label="Total"
                        column="total"
                        sort={recentSort}
                        onSort={toggleRecentSort}
                        align="right"
                        className="text-right"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-medium text-ink">{order.name}</td>
                        <td className="text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                        <td>
                          <div className="min-w-0">
                            <p className="text-sm text-ink truncate">
                              {order.customerName || 'Guest'}
                            </p>
                            {order.customerEmail && (
                              <p className="text-xs text-gray-400 truncate">{order.customerEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-sm text-gray-500">{order.channel || '—'}</td>
                        <td>
                          <StatusPill
                            label={order.financialStatus || 'Unknown'}
                            tone={financialTone(order.financialStatus)}
                          />
                        </td>
                        <td>
                          <StatusPill
                            label={order.fulfillmentStatus || 'Unfulfilled'}
                            tone={fulfillmentTone(order.fulfillmentStatus)}
                          />
                        </td>
                        <td className="text-right font-semibold text-ink tabular-nums">
                          {formatCurrency(order.total, order.currency || currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SalesReportingTab;
