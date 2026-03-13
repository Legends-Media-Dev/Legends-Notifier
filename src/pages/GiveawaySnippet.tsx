import { useState, useEffect } from 'react';
import { Loader2, ImageIcon } from 'lucide-react';
import Toast from '../components/Toast';
import { fetchGiveawayCompInfo, pushGiveawayCompInfo } from '../lib/api';

const defaultSnippet = {
  badgeLabel: 'PAST GIVEAWAYS',
  title: 'HONDA S2000',
  header: 'CHECK OUT PAST GIVEAWAYS',
  buttonText: 'View Past Winners →',
  imageLink: '',
};

const GiveawaySnippet = () => {
  const [form, setForm] = useState(defaultSnippet);
  const [docId, setDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { items } = await fetchGiveawayCompInfo();
        if (cancelled) return;
        const item = items?.[0];
        if (item) {
          setDocId(item.id);
          setForm({
            badgeLabel: item.badgeLabel ?? defaultSnippet.badgeLabel,
            title: item.title ?? defaultSnippet.title,
            header: item.header ?? defaultSnippet.header,
            buttonText: item.buttonText ?? defaultSnippet.buttonText,
            imageLink: item.imageLink ?? '',
          });
        }
      } catch (error) {
        if (!cancelled) showToast('Failed to load giveaway snippet', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Parameters<typeof pushGiveawayCompInfo>[0] = {
        badgeLabel: form.badgeLabel,
        title: form.title,
        header: form.header,
        buttonText: form.buttonText,
        imageLink: form.imageLink || undefined,
      };
      if (docId) payload.docId = docId;
      const result = await pushGiveawayCompInfo(payload);
      if (result.created && result.id) setDocId(result.id);
      showToast('Giveaway snippet saved.');
    } catch (error) {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-apple-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Giveaway Snippet</h1>
          <p className="mt-2 text-gray-600">
            Edit the card that appears on the app home (badge, title, header, button, and image). Save to update in the app.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-apple-blue/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-apple-blue" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Card content</h2>
                <p className="text-sm text-gray-500">Labels, button text, and image link for the giveaway snippet</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge label</label>
                <input
                  type="text"
                  value={form.badgeLabel}
                  onChange={handleChange('badgeLabel')}
                  placeholder="e.g. PAST GIVEAWAYS"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header</label>
                <input
                  type="text"
                  value={form.header}
                  onChange={handleChange('header')}
                  placeholder="e.g. CHECK OUT PAST GIVEAWAYS"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={handleChange('title')}
                  placeholder="e.g. HONDA S2000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button text</label>
                <input
                  type="text"
                  value={form.buttonText}
                  onChange={handleChange('buttonText')}
                  placeholder="e.g. View Past Winners →"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image link</label>
                <input
                  type="url"
                  value={form.imageLink}
                  onChange={handleChange('imageLink')}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                />
              </div>
            </div>
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
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
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

export default GiveawaySnippet;
