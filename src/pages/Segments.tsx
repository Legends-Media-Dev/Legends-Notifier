import { useState, useEffect } from 'react';
import { Loader2, FolderTree, Search, RefreshCw } from 'lucide-react';
import { fetchSegments, syncSegments, Segment } from '../lib/api';
import Toast from '../components/Toast';
import SegmentUsersModal from '../components/SegmentUsersModal';

const Segments = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      const data = await fetchSegments();
      setSegments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load segments:', error);
      setSegments([]);
      showToast('Failed to load segments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSegments = async () => {
    try {
      setSyncing(true);
      await syncSegments();
      showToast('Segments synced successfully', 'success');
      // Reload segments after sync
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
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Segments</h1>
              <p className="mt-2 text-gray-600">View and manage user segments from Shopify</p>
            </div>
            <button
              onClick={handleSyncSegments}
              disabled={syncing || loading}
              className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Segments
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search segments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
            />
          </div>
        </div>

        {(loading || syncing) ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
          </div>
        ) : filteredSegments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FolderTree className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No segments found matching your search' : 'No segments found'}
            </p>
            <p className="text-gray-400 mt-2">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Segments from Shopify will appear here once they\'re available'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Segment Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSegments.map((segment, index) => (
                    <tr key={segment.id || `segment-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSegmentClick(segment)}
                          className="w-full flex items-center gap-2 text-left hover:text-apple-blue transition-colors group"
                        >
                          <FolderTree className="w-4 h-4 text-gray-400 group-hover:text-apple-blue transition-colors" />
                          <span className="text-gray-900 font-medium group-hover:text-apple-blue">
                            {segment.name || segment.segmentName || 'Unnamed Segment'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default Segments;

