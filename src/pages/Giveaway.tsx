import { useState, useEffect } from 'react';
import { Loader2, Gift, RefreshCw, Save } from 'lucide-react';
import { fetchGiveawayInfo, pushGiveawayInfo, type Giveaway as GiveawayType } from '../lib/api';
import Toast from '../components/Toast';

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const toDatetimeLocal = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocal = (local: string) => {
  if (!local) return '';
  return new Date(local).toISOString();
};

const GiveawayPage = () => {
  const [giveaways, setGiveaways] = useState<GiveawayType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ start_date: '', end_date: '', entries_multiplier: 1 });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const loadGiveaways = async () => {
    try {
      setLoading(true);
      const data = await fetchGiveawayInfo();
      setGiveaways(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load giveaways:', error);
      setGiveaways([]);
      showToast('Failed to load giveaway info', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGiveaways();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const startEdit = (g: GiveawayType) => {
    setEditingId(g.id);
    setForm({
      start_date: toDatetimeLocal(g.start_date),
      end_date: toDatetimeLocal(g.end_date),
      entries_multiplier: g.entries_multiplier ?? 1,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ start_date: '', end_date: '', entries_multiplier: 1 });
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      await pushGiveawayInfo(
        {
          giveawayId: editingId,
          start_date: fromDatetimeLocal(form.start_date),
          end_date: fromDatetimeLocal(form.end_date),
          entries_multiplier: form.entries_multiplier,
        },
        'PUT'
      );
      showToast('Giveaway updated successfully', 'success');
      cancelEdit();
      await loadGiveaways();
    } catch (error) {
      console.error('Failed to update giveaway:', error);
      showToast('Failed to update giveaway', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Giveaway</h1>
              <p className="mt-2 text-gray-600">View and update current giveaway dates and settings</p>
            </div>
            <button
              onClick={loadGiveaways}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
          </div>
        ) : giveaways.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No giveaway configured</p>
            <p className="text-gray-400 mt-2">Create a giveaway in Firestore or via the API to see it here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {giveaways.map((g: GiveawayType) => (
              <div
                key={g.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {editingId === g.id ? (
                  <div className="p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Edit giveaway</h3>
                    <p className="text-xs text-gray-400 font-mono">ID: {g.id}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start date & time</label>
                        <input
                          type="datetime-local"
                          value={form.start_date}
                          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End date & time</label>
                        <input
                          type="datetime-local"
                          value={form.end_date}
                          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entries multiplier</label>
                      <input
                        type="number"
                        min={1}
                        value={form.entries_multiplier}
                        onChange={(e) => setForm((f) => ({ ...f, entries_multiplier: Number(e.target.value) || 1 }))}
                        className="w-full max-w-[120px] px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-apple-blue/10 flex items-center justify-center">
                          <Gift className="w-6 h-6 text-apple-blue" />
                        </div>
                        <div>
                          <p className="text-xs font-mono text-gray-500">ID: {g.id}</p>
                          <p className="text-sm font-medium text-gray-700 mt-1">Entries multiplier: {g.entries_multiplier ?? 1}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(g)}
                        className="px-3 py-1.5 text-sm font-medium text-apple-blue hover:bg-apple-blue/10 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Start</dt>
                        <dd className="mt-0.5 text-gray-900">{formatDate(g.start_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">End</dt>
                        <dd className="mt-0.5 text-gray-900">{formatDate(g.end_date)}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </div>
  );
};

export default GiveawayPage;
