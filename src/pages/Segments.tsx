import { useState, useEffect } from 'react';
import { Loader2, FolderTree, Search, RefreshCw } from 'lucide-react';
import { fetchSegments, syncSegments, Segment } from '../lib/api';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';
import LoadingButton from '../components/LoadingButton';
import Toast from '../components/Toast';
import SegmentUsersModal from '../components/SegmentUsersModal';

const Segments = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSegments();
  }, []);

  const handleSegmentClick = (segment: Segment) => {
    setSelectedSegment(segment);
    setIsModalOpen(true);
  };

  const loadSegments = async () => {
    try {
      if (hasLoadedOnce) setIsRefreshing(true);
      else setLoading(true);
      const data = await fetchSegments();
      setSegments(Array.isArray(data) ? data : []);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('Failed to load segments:', error);
      setSegments([]);
      showToast('Failed to load segments', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSyncSegments = async () => {
    try {
      setSyncing(true);
      await syncSegments();
      showToast('Segments synced successfully', 'success');
      await loadSegments();
    } catch (error) {
      console.error('Failed to sync segments:', error);
      showToast('Failed to sync segments', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const filteredSegments = segments.filter((segment) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return segment.name?.toLowerCase().includes(query);
  });

  return (
    <PageLayout
      title="Segments"
      description="View and manage user segments synced from Shopify"
      actions={
        <LoadingButton
          variant="primary"
          onClick={handleSyncSegments}
          loading={syncing}
          loadingText="Syncing..."
          disabled={loading}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Sync Segments
        </LoadingButton>
      }
    >
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search segments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : filteredSegments.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="w-7 h-7" />}
          title={searchQuery ? 'No matching segments' : 'No segments yet'}
          description={
            searchQuery
              ? 'Try a different search term.'
              : 'Segments from Shopify will appear here. Use Sync Segments to pull the latest.'
          }
          action={
            !searchQuery ? (
              <LoadingButton
                variant="primary"
                onClick={handleSyncSegments}
                loading={syncing}
                loadingText="Syncing..."
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Sync Segments
              </LoadingButton>
            ) : undefined
          }
        />
      ) : (
        <div className="table-shell relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Segment Name</th>
                  <th className="text-right w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSegments.map((segment, index) => (
                  <tr key={segment.id || `segment-${index}`}>
                    <td>
                      <button
                        onClick={() => handleSegmentClick(segment)}
                        className="flex items-center gap-2.5 text-left group"
                      >
                        <FolderTree className="w-4 h-4 text-gray-400 group-hover:text-accent transition-colors shrink-0" />
                        <span className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                          {segment.name || segment.segmentName || 'Unnamed Segment'}
                        </span>
                      </button>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleSegmentClick(segment)}
                        className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                      >
                        View users →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SegmentUsersModal
        segmentName={selectedSegment?.name || selectedSegment?.segmentName || 'Segment'}
        segmentId={selectedSegment?.id || ''}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSegment(null);
        }}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </PageLayout>
  );
};

export default Segments;
