import { useState, useEffect } from 'react';
import { Loader2, Gift, RefreshCw, Save, Pencil } from 'lucide-react';
import { fetchGiveawayInfo, pushGiveawayInfo, type Giveaway as GiveawayType } from '../lib/api';
import PageLayout from '../components/PageLayout';
import EmptyState from '../components/EmptyState';
import SectionCard from '../components/SectionCard';
import LoadingButton from '../components/LoadingButton';
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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ start_date: '', end_date: '', entries_multiplier: 1 });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const loadGiveaways = async () => {
    try {
      if (hasLoadedOnce) setIsRefreshing(true);
      else setLoading(true);
      const data = await fetchGiveawayInfo();
      setGiveaways(Array.isArray(data) ? data : []);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('Failed to load giveaways:', error);
      setGiveaways([]);
      showToast('Failed to load giveaway info', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
    <PageLayout
      title="Giveaway"
      description="View and update current giveaway dates and entry settings"
      actions={
        <LoadingButton
          variant="secondary"
          onClick={loadGiveaways}
          loading={loading || isRefreshing}
          loadingText="Refreshing..."
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </LoadingButton>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : giveaways.length === 0 ? (
        <EmptyState
          icon={<Gift className="w-7 h-7" />}
          title="No giveaway configured"
          description="Create a giveaway in Firestore or via the API to manage it here."
        />
      ) : (
        <div className="space-y-6 relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-surface/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          )}
          {giveaways.map((g: GiveawayType) => (
            <SectionCard
              key={g.id}
              icon={<Gift className="w-5 h-5" />}
              title="Giveaway"
              description={`Entries multiplier: ${g.entries_multiplier ?? 1}`}
              action={
                editingId !== g.id ? (
                  <LoadingButton
                    variant="secondary"
                    onClick={() => startEdit(g)}
                    icon={<Pencil className="w-4 h-4" />}
                    className="!py-2"
                  >
                    Edit
                  </LoadingButton>
                ) : undefined
              }
            >
              {editingId === g.id ? (
                <div className="p-6 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label-field">Start date & time</label>
                      <input
                        type="datetime-local"
                        value={form.start_date}
                        onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label-field">End date & time</label>
                      <input
                        type="datetime-local"
                        value={form.end_date}
                        onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-field">Entries multiplier</label>
                    <input
                      type="number"
                      min={1}
                      value={form.entries_multiplier}
                      onChange={(e) => setForm((f) => ({ ...f, entries_multiplier: Number(e.target.value) || 1 }))}
                      className="input-field max-w-[140px]"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <LoadingButton
                      variant="primary"
                      onClick={handleSave}
                      loading={saving}
                      loadingText="Saving..."
                      icon={<Save className="w-4 h-4" />}
                    >
                      Save changes
                    </LoadingButton>
                    <LoadingButton variant="secondary" onClick={cancelEdit} disabled={saving}>
                      Cancel
                    </LoadingButton>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-surface-muted rounded-xl p-4">
                      <dt className="label-field !mb-1">Start</dt>
                      <dd className="text-sm font-medium text-ink">{formatDate(g.start_date)}</dd>
                    </div>
                    <div className="bg-surface-muted rounded-xl p-4">
                      <dt className="label-field !mb-1">End</dt>
                      <dd className="text-sm font-medium text-ink">{formatDate(g.end_date)}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </PageLayout>
  );
};

export default GiveawayPage;
