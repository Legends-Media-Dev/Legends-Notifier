import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { fetchShopifyStore, ShopifyStoreOrder, ShopifyStoreOrdersResponse } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import EmptyState from '../EmptyState';
import { StatusPill, formatCurrency, formatNumber } from './shopifyFormatters';
import {
  SortLoadingBanner,
  SortableTh,
  fetchAllRemainingPages,
  useSortableRows,
} from './sortableTable';

function fulfillmentTone(status: string | null) {
  const s = (status || '').toUpperCase();
  if (s.includes('FULFILLED') && !s.includes('UN')) return 'success' as const;
  if (s.includes('PARTIAL') || s.includes('UNFULFILLED')) return 'warning' as const;
  return 'neutral' as const;
}
function financialTone(status: string | null) {
  const s = (status || '').toUpperCase();
  if (s.includes('PAID')) return 'success' as const;
  if (s.includes('PENDING') || s.includes('AUTHORIZED')) return 'warning' as const;
  if (s.includes('REFUND') || s.includes('VOID')) return 'danger' as const;
  return 'info' as const;
}

const OrdersTab = () => {
  const [orders, setOrders] = useState<ShopifyStoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fulfillment, setFulfillment] = useState('ALL');
  const [financial, setFinancial] = useState('ALL');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortTruncated, setSortTruncated] = useState(false);

  const load = useCallback(async (opts: { append?: boolean; cursor?: string | null } = {}) => {
    const append = opts.append ?? false;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    setSortTruncated(false);
    try {
      const result = await fetchShopifyStore<ShopifyStoreOrdersResponse>({
        resource: 'orders',
        search: search || undefined,
        fulfillment,
        financial,
        cursor: opts.cursor ?? null,
        limit: 40,
      });
      setOrders((prev) => (append ? [...prev, ...result.orders] : result.orders));
      setCursor(result.pageInfo.endCursor);
      setHasNextPage(result.pageInfo.hasNextPage);
    } catch (err) {
      console.error(err);
      setError('Unable to load orders.');
      if (!append) setOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, fulfillment, financial]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadAllForSort = useCallback(async () => {
    const result = await fetchAllRemainingPages({
      hasNextPage,
      cursor,
      currentItems: orders,
      fetchPage: async (pageCursor) => {
        const page = await fetchShopifyStore<ShopifyStoreOrdersResponse>({
          resource: 'orders',
          search: search || undefined,
          fulfillment,
          financial,
          cursor: pageCursor,
          limit: 100,
        });
        return { items: page.orders, pageInfo: page.pageInfo };
      },
    });
    setOrders(result.items);
    setCursor(result.cursor);
    setHasNextPage(result.hasNextPage);
    setSortTruncated(result.truncated);
  }, [hasNextPage, cursor, orders, search, fulfillment, financial]);

  type OrderSortKey = 'name' | 'date' | 'customer' | 'payment' | 'fulfillment' | 'total';
  const accessors = useMemo(
    () => ({
      name: (row: ShopifyStoreOrder) => row.name,
      date: (row: ShopifyStoreOrder) => row.createdAt,
      customer: (row: ShopifyStoreOrder) => row.customer?.name || row.customer?.email || '',
      payment: (row: ShopifyStoreOrder) => row.financialStatus || '',
      fulfillment: (row: ShopifyStoreOrder) => row.fulfillmentStatus || '',
      total: (row: ShopifyStoreOrder) => row.total,
    }),
    []
  );
  const { sortedRows, sort, toggleSort, loadingAll } = useSortableRows<
    ShopifyStoreOrder,
    OrderSortKey
  >(orders, accessors, {
    hasMore: hasNextPage,
    loadAll: loadAllForSort,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Search by order number or customer email. Expand a row for line items. Sorting loads the
            full result set.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center self-end"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order #, email, name..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={fulfillment}
          onChange={(e) => setFulfillment(e.target.value)}
          className="select-field min-w-[10rem]"
        >
          <option value="ALL">All fulfillment</option>
          <option value="UNFULFILLED">Unfulfilled</option>
          <option value="PARTIAL">Partial</option>
          <option value="FULFILLED">Fulfilled</option>
        </select>
        <select
          value={financial}
          onChange={(e) => setFinancial(e.target.value)}
          className="select-field min-w-[9rem]"
        >
          <option value="ALL">All payment</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <SortLoadingBanner loading={loadingAll} count={orders.length} />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : error ? (
        <div className="page-card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button type="button" onClick={() => load()} className="btn-primary">
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6" />}
          title="No orders found"
          description="Try a different search or filter."
        />
      ) : (
        <>
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-ink">{formatNumber(orders.length)}</span>{' '}
            orders
            {sort.key ? ' · sorted across full loaded set' : ''}
            {sortTruncated ? ' · sort capped at max pages' : ''}
            {hasNextPage && !sort.key ? ' (more available)' : ''}
          </div>
          <div className="table-shell overflow-x-auto relative">
            {loadingAll && (
              <div className="absolute inset-0 bg-white/50 z-10 pointer-events-none" />
            )}
            <table className="w-full min-w-[980px]">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <SortableTh
                    label="Order"
                    column="name"
                    sort={sort}
                    onSort={toggleSort}
                    disabled={loadingAll}
                  />
                  <SortableTh
                    label="Date"
                    column="date"
                    sort={sort}
                    onSort={toggleSort}
                    disabled={loadingAll}
                  />
                  <SortableTh
                    label="Customer"
                    column="customer"
                    sort={sort}
                    onSort={toggleSort}
                    disabled={loadingAll}
                  />
                  <SortableTh
                    label="Payment"
                    column="payment"
                    sort={sort}
                    onSort={toggleSort}
                    disabled={loadingAll}
                  />
                  <SortableTh
                    label="Fulfillment"
                    column="fulfillment"
                    sort={sort}
                    onSort={toggleSort}
                    disabled={loadingAll}
                  />
                  <SortableTh
                    label="Total"
                    column="total"
                    sort={sort}
                    onSort={toggleSort}
                    align="right"
                    className="text-right"
                    disabled={loadingAll}
                  />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((order) => {
                  const open = expanded === order.id;
                  return (
                    <Fragment key={order.id}>
                      <tr
                        className="cursor-pointer"
                        onClick={() => setExpanded(open ? null : order.id)}
                      >
                        <td>
                          {open ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td className="font-medium text-ink">{order.name}</td>
                        <td className="text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                        <td>
                          <div className="min-w-0">
                            <p className="text-sm text-ink truncate">
                              {order.customer?.name || 'Guest'}
                            </p>
                            {order.customer?.email && (
                              <p className="text-xs text-gray-400 truncate">
                                {order.customer.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <StatusPill
                            label={order.financialStatus || '—'}
                            tone={financialTone(order.financialStatus)}
                          />
                        </td>
                        <td>
                          <StatusPill
                            label={order.fulfillmentStatus || '—'}
                            tone={fulfillmentTone(order.fulfillmentStatus)}
                          />
                        </td>
                        <td className="text-right font-semibold tabular-nums">
                          {formatCurrency(order.total, order.currency)}
                        </td>
                      </tr>
                      {open && (
                        <tr className="!bg-surface-muted/40">
                          <td colSpan={7} className="!px-6 !py-4">
                            <div className="grid md:grid-cols-[1fr_220px] gap-4">
                              <div className="space-y-2">
                                {order.lineItems.map((li) => (
                                  <div key={li.id} className="flex items-center gap-3">
                                    {li.image ? (
                                      <img
                                        src={li.image}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-100" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-ink truncate">
                                        {li.title}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        Qty {li.quantity}
                                        {li.variantTitle ? ` · ${li.variantTitle}` : ''}
                                        {li.sku ? ` · ${li.sku}` : ''}
                                      </p>
                                    </div>
                                    <p className="text-sm tabular-nums text-ink">
                                      {formatCurrency(li.total, order.currency)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="text-sm space-y-1.5 bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Subtotal</span>
                                  <span className="tabular-nums">
                                    {formatCurrency(order.subtotal, order.currency)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Shipping</span>
                                  <span className="tabular-nums">
                                    {formatCurrency(order.shipping, order.currency)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Tax</span>
                                  <span className="tabular-nums">
                                    {formatCurrency(order.tax, order.currency)}
                                  </span>
                                </div>
                                {order.refunded > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Refunded</span>
                                    <span className="tabular-nums">
                                      {formatCurrency(order.refunded, order.currency)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between font-semibold border-t border-gray-100 pt-2">
                                  <span>Total</span>
                                  <span className="tabular-nums">
                                    {formatCurrency(order.total, order.currency)}
                                  </span>
                                </div>
                                {order.shippingLocation && (
                                  <p className="text-xs text-gray-400 pt-2">
                                    {order.shippingLocation}
                                  </p>
                                )}
                                {order.channel && (
                                  <p className="text-xs text-gray-400">Channel: {order.channel}</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {hasNextPage && !sort.key && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => load({ append: true, cursor })}
                disabled={loadingMore}
                className="btn-secondary inline-flex items-center gap-2"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />} Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersTab;
