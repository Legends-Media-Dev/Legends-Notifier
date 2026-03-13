import { useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchCollections, fetchAppCollectionsInfo, flattenCollectionMap, pushAppCollectionsInfo, ShopCollection } from '../lib/api';
import Toast from '../components/Toast';

/** Selected item: key = stable COLLECTION_MAP key; customDisplayName = optional override for UI (DISPLAY_NAMES). */
export interface SelectedCollection {
  key: string;
  handle: string;
  order: number;
  customDisplayName?: string;
}

function SortableCollectionRow({
  item,
  index,
  getCollectionByHandle,
  moveUp,
  moveDown,
  removeCollection,
  onDisplayNameChange,
  isLast,
}: {
  item: SelectedCollection;
  index: number;
  getCollectionByHandle: (handle: string) => ShopCollection | undefined;
  moveUp: (i: number) => void;
  moveDown: (i: number) => void;
  removeCollection: (handle: string) => void;
  onDisplayNameChange: (handle: string, value: string) => void;
  isLast: boolean;
}) {
  const col = getCollectionByHandle(item.handle);
  const displayLabel = item.customDisplayName ?? item.key;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.handle });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`px-6 py-4 flex items-center gap-3 transition-colors ${
        isDragging ? 'opacity-50 shadow-lg bg-white rounded-lg z-10' : 'hover:bg-gray-50/50'
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => moveUp(index)}
          disabled={index === 0}
          className="p-1 text-gray-400 hover:text-apple-blue disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => moveDown(index)}
          disabled={isLast}
          className="p-1 text-gray-400 hover:text-apple-blue disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div
        className="touch-none cursor-grab active:cursor-grabbing flex items-center p-1 -m-1 rounded text-gray-400 hover:text-apple-blue hover:bg-apple-blue/5"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5 flex-shrink-0" />
      </div>
      {col?.image?.src ? (
        <img src={col.image.src} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <input
          type="text"
          value={displayLabel}
          onChange={(e) => onDisplayNameChange(item.handle, e.target.value)}
          placeholder="Display name"
          className="w-full px-3 py-1.5 text-sm font-medium text-gray-900 bg-transparent border border-transparent rounded hover:border-gray-200 focus:border-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue"
        />
        <p className="text-xs text-gray-500 truncate">{item.handle}</p>
      </div>
      <span className="text-sm text-gray-400 tabular-nums w-8">{index + 1}</span>
      <button
        type="button"
        onClick={() => removeCollection(item.handle)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Remove"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

const ShopCollections = () => {
  const [availableCollections, setAvailableCollections] = useState<ShopCollection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedCollection[]>([]);
  const [appCollectionsDocId, setAppCollectionsDocId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingCollections(true);
        setLoadError(null);
        const [shopifyData, appData] = await Promise.all([
          fetchCollections(),
          fetchAppCollectionsInfo().catch(() => ({ collections: [], total: 0 })),
        ]);
        if (cancelled) return;
        setAvailableCollections(Array.isArray(shopifyData) ? shopifyData : []);
        const firstDoc = appData.collections?.[0];
        if (firstDoc?.id) setAppCollectionsDocId(firstDoc.id);
        const ordered = flattenCollectionMap(appData.collections);
        const selectedFromFirestore: SelectedCollection[] = ordered.map((item, i) => ({
          key: item.key,
          handle: item.handle,
          order: i,
          customDisplayName: item.displayName !== item.key ? item.displayName : undefined,
        }));
        setSelected(selectedFromFirestore);
      } catch (error: unknown) {
        if (!cancelled) {
          setAvailableCollections([]);
          const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : 'Request failed';
          setLoadError(msg);
          setToast({ isVisible: true, message: 'Failed to load collections', type: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingCollections(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const getCollectionByHandle = (handle: string): ShopCollection | undefined =>
    availableCollections.find((c) => c.handle.toLowerCase() === handle.toLowerCase());

  const selectedSorted = [...selected].sort((a, b) => a.order - b.order);

  const addCollection = (collection: ShopCollection) => {
    const nextOrder = selected.length > 0 ? Math.max(...selected.map((s) => s.order)) + 1 : 0;
    setSelected([...selected, { key: collection.title, handle: collection.handle, order: nextOrder }]);
    setAddModalOpen(false);
  };

  const onDisplayNameChange = (handle: string, value: string) => {
    setSelected(selected.map((s) => (s.handle === handle ? { ...s, customDisplayName: value.trim() || undefined } : s)));
  };

  const removeCollection = (handle: string) => {
    const next = selected.filter((s) => s.handle !== handle).map((s, i) => ({ ...s, order: i }));
    setSelected(next);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...selectedSorted];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setSelected(next.map((s, i) => ({ ...s, order: i })));
  };

  const moveDown = (index: number) => {
    if (index >= selectedSorted.length - 1) return;
    const next = [...selectedSorted];
    [next[index], next[index + 1]] = [next[index], next[index]];
    setSelected(next.map((s, i) => ({ ...s, order: i })));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedSorted.findIndex((s) => s.handle === active.id);
    const newIndex = selectedSorted.findIndex((s) => s.handle === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(selectedSorted, oldIndex, newIndex);
    setSelected(next.map((s, i) => ({ ...s, order: i })));
  };

  const selectedHandles = new Set(selected.map((s) => s.handle.toLowerCase()));
  const canAdd = availableCollections.filter((c) => !selectedHandles.has(c.handle.toLowerCase()));

  const handleSave = async () => {
    setSaving(true);
    try {
      const sorted = [...selected].sort((a, b) => a.order - b.order);
      const COLLECTION_MAP: Record<string, string> = {};
      const ORDER: string[] = [];
      const DISPLAY_NAMES: Record<string, string> = {};
      for (const item of sorted) {
        COLLECTION_MAP[item.key] = item.handle;
        ORDER.push(item.key);
        DISPLAY_NAMES[item.key] = item.customDisplayName ?? item.key;
      }
      const payload = appCollectionsDocId
        ? { docId: appCollectionsDocId, COLLECTION_MAP, ORDER, DISPLAY_NAMES }
        : { COLLECTION_MAP, ORDER, DISPLAY_NAMES };
      const result = await pushAppCollectionsInfo(payload);
      if (result.id && !appCollectionsDocId) setAppCollectionsDocId(result.id);
      showToast(result.created ? 'Collections saved.' : 'Collections updated.');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop Collections</h1>
          <p className="mt-2 text-gray-600">
            Choose which collections appear in the app and the order they’re shown. Collections are loaded from your Shopify store.
          </p>
        </div>

        {loadingCollections ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-apple-blue animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Loading collections...</p>
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-8 text-center">
              <p className="text-red-600 font-medium">Could not load collections</p>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Your backend needs <code className="bg-gray-100 px-1 rounded">GET /fetchCollectionsHandler</code> (Shopify) and <code className="bg-gray-100 px-1 rounded">GET /fetchAppCollectionsInfoHandler</code> (Firestore). Same-origin requests avoid CORS.
              </p>
              <p className="text-xs text-gray-400 mt-3">Error: {loadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-apple-blue/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-apple-blue" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Collections shown in app</h2>
                  <p className="text-sm text-gray-500">Add, remove, and reorder from {availableCollections.length} available</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(true)}
                disabled={canAdd.length === 0}
                className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add collection
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {selectedSorted.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="font-medium">No collections selected</p>
                  <p className="text-sm mt-1">Click “Add collection” to pick from your Shopify collections.</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={selectedSorted.map((s) => s.handle)} strategy={verticalListSortingStrategy}>
                    <div className="divide-y divide-gray-200">
                      {selectedSorted.map((item, index) => (
                        <SortableCollectionRow
                          key={item.handle}
                          item={item}
                          index={index}
                          getCollectionByHandle={getCollectionByHandle}
                          moveUp={moveUp}
                          moveDown={moveDown}
                          removeCollection={removeCollection}
                          onDisplayNameChange={onDisplayNameChange}
                          isLast={index === selectedSorted.length - 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {selectedSorted.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save settings'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {addModalOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setAddModalOpen(false)}
              aria-hidden
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add collection</h3>
                  <button
                    onClick={() => setAddModalOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {canAdd.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">All collections are already added.</p>
                  ) : (
                    <ul className="space-y-1">
                      {canAdd.map((col) => (
                        <li key={col.id}>
                          <button
                            type="button"
                            onClick={() => addCollection(col)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-gray-100 transition-colors"
                          >
                            {col.image?.src ? (
                              <img src={col.image.src} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{col.title}</p>
                              <p className="text-xs text-gray-500 truncate">{col.handle}</p>
                            </div>
                            <Plus className="w-4 h-4 text-apple-blue flex-shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default ShopCollections;
