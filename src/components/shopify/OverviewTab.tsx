import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Boxes, FolderOpen, Loader2, Package, RefreshCw, ShoppingCart, Users } from 'lucide-react';
import { fetchShopifyStore, ShopifyStoreOverviewResponse } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { StatusPill, formatCurrency, formatNumber } from './shopifyFormatters';

const OverviewTab = () => {
  const [data, setData] = useState<ShopifyStoreOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShopifyStore<ShopifyStoreOverviewResponse>({ resource: 'overview' });
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Unable to load store overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
  }

  if (error && !data) {
    return (
      <div className="page-card p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button type="button" onClick={load} className="btn-primary">Retry</button>
      </div>
    );
  }

  if (!data) return null;
  const { health } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Store overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Quick health check for inventory, fulfillment, and catalog status.</p>
        </div>
        <button type="button" onClick={load} className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Active products', value: formatNumber(health.activeProducts), sub: `${formatNumber(health.draftProducts)} drafts` },
          { icon: ShoppingCart, label: 'Unfulfilled orders', value: formatNumber(health.unfulfilledOrders), sub: 'Need attention' },
          { icon: AlertTriangle, label: 'Low / out of stock', value: formatNumber(health.lowStockCount + health.outOfStockCount), sub: `${formatNumber(health.outOfStockCount)} out of stock` },
          { icon: Users, label: 'Customers', value: formatNumber(health.totalCustomers), sub: `${formatNumber(health.totalCollections)} collections` },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="page-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="section-icon !w-9 !h-9"><Icon className="w-4 h-4 text-accent" /></div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="table-shell">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-accent" />
            <div>
              <h3 className="font-semibold text-ink">Inventory alerts</h3>
              <p className="text-sm text-gray-500">Out of stock and low stock variants</p>
            </div>
          </div>
          {[...data.outOfStock, ...data.lowStock].length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">No inventory alerts</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
              {[...data.outOfStock.map((i) => ({ ...i, kind: 'out' as const })), ...data.lowStock.map((i) => ({ ...i, kind: 'low' as const }))].slice(0, 40).map((item) => (
                <div key={`${item.kind}-${item.id}`} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{item.productTitle || item.title}</p>
                    <p className="text-xs text-gray-400 truncate">{item.title}{item.sku ? ` · ${item.sku}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm tabular-nums text-ink">{item.inventoryQuantity}</span>
                    <StatusPill label={item.kind === 'out' ? 'Out' : 'Low'} tone={item.kind === 'out' ? 'danger' : 'warning'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="table-shell">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-accent" />
            <div>
              <h3 className="font-semibold text-ink">Unfulfilled orders</h3>
              <p className="text-sm text-gray-500">Most recent orders waiting fulfillment</p>
            </div>
          </div>
          {data.recentUnfulfilled.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">No unfulfilled orders</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
              {data.recentUnfulfilled.map((order) => (
                <div key={order.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{order.name}</p>
                    <p className="text-xs text-gray-400 truncate">{order.customerName || order.customerEmail || 'Guest'} · {formatDate(order.createdAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink tabular-nums shrink-0">{formatCurrency(order.total, order.currency)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
