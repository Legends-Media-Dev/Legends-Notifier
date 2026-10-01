import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, Loader2, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { fetchShopifyStore, ShopifyStoreInventoryItem, ShopifyStoreInventoryResponse } from '../../lib/api';
import EmptyState from '../EmptyState';
import { StatusPill, formatCurrency, formatNumber } from './shopifyFormatters';
import {
  SortLoadingBanner,
  SortableTh,
  fetchAllRemainingPages,
  useSortableRows,
} from './sortableTable';

const InventoryTab = () => {
  const [items, setItems] = useState<ShopifyStoreInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [stock, setStock] = useState('ALL');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [threshold, setThreshold] = useState(5);
  const [sortTruncated, setSortTruncated] = useState(false);

  const load = useCallback(async (opts: { append?: boolean; cursor?: string | null } = {}) => {
    const append = opts.append ?? false;
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    setSortTruncated(false);
    try {
      const result = await fetchShopifyStore<ShopifyStoreInventoryResponse>({
        resource: 'inventory', search: search || undefined, stock, cursor: opts.cursor ?? null, limit: 50,
      });
      setItems((prev) => append ? [...prev, ...result.items] : result.items);
      setCursor(result.pageInfo.endCursor);
      setHasNextPage(result.pageInfo.hasNextPage);
      setThreshold(result.lowStockThreshold);
    } catch (err) {
      console.error(err);
      setError('Unable to load inventory.');
      if (!append) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, stock]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadAllForSort = useCallback(async () => {
    const result = await fetchAllRemainingPages({
      hasNextPage,
      cursor,
      currentItems: items,
      fetchPage: async (pageCursor) => {
        const page = await fetchShopifyStore<ShopifyStoreInventoryResponse>({
          resource: 'inventory',
          search: search || undefined,
          stock,
          cursor: pageCursor,
          limit: 100,
        });
        return { items: page.items, pageInfo: page.pageInfo };
      },
    });
    setItems(result.items);
    setCursor(result.cursor);
    setHasNextPage(result.hasNextPage);
    setSortTruncated(result.truncated);
  }, [hasNextPage, cursor, items, search, stock]);

  type InventorySortKey = 'product' | 'sku' | 'stock' | 'status' | 'price' | 'vendor';
  const accessors = useMemo(() => ({
    product: (row: ShopifyStoreInventoryItem) => row.product.title || row.title,
    sku: (row: ShopifyStoreInventoryItem) => row.sku || '',
    stock: (row: ShopifyStoreInventoryItem) => row.inventoryQuantity,
    status: (row: ShopifyStoreInventoryItem) => row.stockStatus,
    price: (row: ShopifyStoreInventoryItem) => row.price,
    vendor: (row: ShopifyStoreInventoryItem) => row.product.vendor || '',
  }), []);
  const { sortedRows, sort, toggleSort, loadingAll } = useSortableRows<ShopifyStoreInventoryItem, InventorySortKey>(
    items,
    accessors,
    { hasMore: hasNextPage, loadAll: loadAllForSort }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Inventory</h2>
          <p className="text-sm text-gray-500 mt-0.5">Variant-level stock. Low stock threshold: {threshold} units.</p>
        </div>
        <button type="button" onClick={() => load()} className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center self-end"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search product, SKU, barcode..." className="input-field pl-10" />
        </div>
        <select value={stock} onChange={(e) => setStock(e.target.value)} className="select-field min-w-[9rem]">
          <option value="ALL">All stock</option>
          <option value="OUT">Out of stock</option>
          <option value="LOW">Low stock</option>
          <option value="IN_STOCK">In stock</option>
        </select>
      </div>
      <SortLoadingBanner loading={loadingAll} count={items.length} />

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : error ? (
        <div className="page-card p-8 text-center"><p className="text-red-600 mb-4">{error}</p><button type="button" onClick={() => load()} className="btn-primary">Retry</button></div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Boxes className="w-6 h-6" />} title="No inventory rows" description="Try adjusting filters." />
      ) : (
        <>
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-ink">{formatNumber(items.length)}</span> variants
            {sort.key ? ' · sorted across full loaded set' : ''}
            {sortTruncated ? ' · sort capped at max pages' : ''}
            {hasNextPage && !sort.key ? ' (more available)' : ''}
          </div>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead><tr>
                <SortableTh label="Product / variant" column="product" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="SKU" column="sku" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Stock" column="stock" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Status" column="status" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Price" column="price" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                <SortableTh label="Vendor" column="vendor" sort={sort} onSort={toggleSort} disabled={loadingAll} />
              </tr></thead>
              <tbody>
                {sortedRows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-surface-muted flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-gray-400" /></div>}
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{item.product.title || 'Product'}</p>
                          <p className="text-xs text-gray-400 truncate">{item.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-500 font-mono">{item.sku || '—'}</td>
                    <td className="tabular-nums font-semibold text-ink">{formatNumber(item.inventoryQuantity)}</td>
                    <td><StatusPill label={item.stockStatus === 'out' ? 'Out' : item.stockStatus === 'low' ? 'Low' : 'OK'} tone={item.stockStatus === 'out' ? 'danger' : item.stockStatus === 'low' ? 'warning' : 'success'} /></td>
                    <td className="tabular-nums text-sm">{formatCurrency(item.price)}</td>
                    <td className="text-sm text-gray-500">{item.product.vendor || '—'}</td>
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

export default InventoryTab;
