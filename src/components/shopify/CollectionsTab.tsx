import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Loader2, RefreshCw, Search, ShoppingBag, Sparkles } from 'lucide-react';
import { fetchShopifyAdminCollections, ShopifyAdminCollection } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import EmptyState from '../EmptyState';
import { StatusPill, formatNumber } from './shopifyFormatters';

const CollectionsTab = () => {
  const [collections, setCollections] = useState<ShopifyAdminCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const load = useCallback(
    async (opts: { append?: boolean; cursor?: string | null } = {}) => {
      const append = opts.append ?? false;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await fetchShopifyAdminCollections({
          search: search || undefined,
          cursor: opts.cursor ?? null,
          limit: 50,
        });
        setCollections((prev) =>
          append ? [...prev, ...result.collections] : result.collections
        );
        setCursor(result.pageInfo.endCursor);
        setHasNextPage(result.pageInfo.hasNextPage);
      } catch (err) {
        console.error(err);
        setError(
          'Unable to load collections. Deploy fetchShopifyCollectionsHandler if it is not live yet.'
        );
        if (!append) setCollections([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Collections</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            View all Shopify collections — smart and manual — for store assistance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="btn-secondary !h-10 !w-10 !p-0 inline-flex items-center justify-center self-end"
          aria-label="Refresh collections"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search collections..."
          className="input-field pl-10"
        />
      </div>

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
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-6 h-6" />}
          title="No collections found"
          description={
            search
              ? 'Try a different search term.'
              : 'Shopify collections will appear here once loaded.'
          }
        />
      ) : (
        <>
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-ink">{formatNumber(collections.length)}</span>{' '}
            collections
            {hasNextPage ? ' (more available)' : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <div key={collection.id} className="page-card overflow-hidden flex flex-col">
                <div className="aspect-[16/9] bg-surface-muted relative">
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink truncate">{collection.title}</h3>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{collection.handle}</p>
                    </div>
                    <StatusPill
                      label={collection.type === 'smart' ? 'Smart' : 'Manual'}
                      tone={collection.type === 'smart' ? 'info' : 'neutral'}
                    />
                  </div>
                  {collection.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{collection.description}</p>
                  )}
                  <div className="mt-auto pt-2 flex items-center justify-between text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      {collection.type === 'smart' ? (
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <FolderOpen className="w-3.5 h-3.5" />
                      )}
                      {collection.productsCount != null
                        ? `${formatNumber(collection.productsCount)} products`
                        : 'Products n/a'}
                    </span>
                    <span className="text-xs">
                      {collection.updatedAt ? formatDate(collection.updatedAt) : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasNextPage && (
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

export default CollectionsTab;
