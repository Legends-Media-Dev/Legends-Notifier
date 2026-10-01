import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Package, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { fetchShopifyProducts, ShopifyProduct } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import EmptyState from '../EmptyState';
import { StatusPill, formatCurrency, formatNumber } from './shopifyFormatters';
import {
  SortLoadingBanner,
  SortableTh,
  fetchAllRemainingPages,
  useSortableRows,
} from './sortableTable';

type StatusFilter = 'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

function statusTone(status: string): 'success' | 'warning' | 'neutral' | 'info' {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'success';
  if (s === 'DRAFT') return 'warning';
  if (s === 'ARCHIVED') return 'neutral';
  return 'info';
}

function priceLabel(product: ShopifyProduct): string {
  if (product.priceMin == null) return '—';
  if (product.priceMax != null && product.priceMax !== product.priceMin) {
    return `${formatCurrency(product.priceMin)} – ${formatCurrency(product.priceMax)}`;
  }
  return formatCurrency(product.priceMin);
}

const ProductsTab = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [sortTruncated, setSortTruncated] = useState(false);

  const load = useCallback(
    async (opts: { append?: boolean; cursor?: string | null } = {}) => {
      const append = opts.append ?? false;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      setSortTruncated(false);

      try {
        const result = await fetchShopifyProducts({
          search: search || undefined,
          status,
          cursor: opts.cursor ?? null,
          limit: 50,
        });
        setProducts((prev) => (append ? [...prev, ...result.products] : result.products));
        setCursor(result.pageInfo.endCursor);
        setHasNextPage(result.pageInfo.hasNextPage);
      } catch (err) {
        console.error(err);
        setError('Unable to load products. Deploy fetchShopifyProductsHandler if it is not live yet.');
        if (!append) setProducts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, status]
  );

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
      currentItems: products,
      fetchPage: async (pageCursor) => {
        const page = await fetchShopifyProducts({
          search: search || undefined,
          status,
          cursor: pageCursor,
          limit: 100,
        });
        return { items: page.products, pageInfo: page.pageInfo };
      },
    });
    setProducts(result.items);
    setCursor(result.cursor);
    setHasNextPage(result.hasNextPage);
    setSortTruncated(result.truncated);
  }, [hasNextPage, cursor, products, search, status]);

  type ProductSortKey = 'title' | 'status' | 'inventory' | 'type' | 'vendor' | 'price' | 'updated';
  const accessors = useMemo(() => ({
    title: (row: ShopifyProduct) => row.title,
    status: (row: ShopifyProduct) => row.status,
    inventory: (row: ShopifyProduct) => row.totalInventory,
    type: (row: ShopifyProduct) => row.productType || '',
    vendor: (row: ShopifyProduct) => row.vendor || '',
    price: (row: ShopifyProduct) => row.priceMin ?? -1,
    updated: (row: ShopifyProduct) => row.updatedAt || '',
  }), []);
  const { sortedRows, sort, toggleSort, loadingAll } = useSortableRows<ShopifyProduct, ProductSortKey>(
    products,
    accessors,
    { hasMore: hasNextPage, loadAll: loadAllForSort }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Browse the full Shopify catalog to help with merchandising and support.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center self-end"
          aria-label="Refresh products"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products by title, vendor, SKU..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="select-field min-w-[9rem]"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <SortLoadingBanner loading={loadingAll} count={products.length} />

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
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title="No products found"
          description={
            search || status !== 'ALL'
              ? 'Try adjusting your search or status filter.'
              : 'Products from the Shopify store will appear here.'
          }
        />
      ) : (
        <>
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-ink">{formatNumber(products.length)}</span>{' '}
            products
            {sort.key ? ' · sorted across full loaded set' : ''}
            {sortTruncated ? ' · sort capped at max pages' : ''}
            {hasNextPage && !sort.key ? ' (more available)' : ''}
          </div>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr>
                  <SortableTh label="Product" column="title" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                  <SortableTh label="Status" column="status" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                  <SortableTh label="Inventory" column="inventory" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                  <SortableTh label="Type" column="type" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                  <SortableTh label="Vendor" column="vendor" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                  <SortableTh label="Price" column="price" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                  <SortableTh label="Updated" column="updated" sort={sort} onSort={toggleSort} disabled={loadingAll} />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-surface-muted flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{product.title}</p>
                          <p className="text-xs text-gray-400 truncate">{product.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusPill label={product.status} tone={statusTone(product.status)} />
                    </td>
                    <td className="tabular-nums text-sm text-ink">
                      {formatNumber(product.totalInventory)}
                      <span className="text-gray-400 text-xs ml-1">
                        · {product.variantCount} var
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{product.productType || '—'}</td>
                    <td className="text-sm text-gray-500">{product.vendor || '—'}</td>
                    <td className="text-sm font-medium text-ink tabular-nums whitespace-nowrap">
                      {priceLabel(product)}
                    </td>
                    <td className="text-sm text-gray-500 whitespace-nowrap">
                      {product.updatedAt ? formatDate(product.updatedAt) : '—'}
                    </td>
                  </tr>
                ))}
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
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsTab;
