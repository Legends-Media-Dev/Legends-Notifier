import { useState, useEffect } from 'react';
import { Loader2, ImageIcon, Smartphone, Eye, Link2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SectionCard from '../components/SectionCard';
import LoadingButton from '../components/LoadingButton';
import ModalBusyOverlay from '../components/ModalBusyOverlay';
import Toast from '../components/Toast';
import { fetchGiveawayCompInfo, pushGiveawayCompInfo } from '../lib/api';

const defaultSnippet = {
  badgeLabel: 'PAST GIVEAWAYS',
  title: 'HONDA S2000',
  header: 'CHECK OUT PAST GIVEAWAYS',
  buttonText: 'View Past Winners →',
  imageLink: '',
};

const GiveawaySnippetPreview = ({
  badgeLabel,
  header,
  title,
  buttonText,
  imageLink,
}: typeof defaultSnippet) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageLink]);

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute -inset-3 bg-gradient-to-br from-accent/20 via-accent-light/40 to-transparent rounded-[2rem] blur-sm" />
      <div className="relative rounded-[1.75rem] border border-gray-200 bg-white shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-surface-muted/80">
          <Smartphone className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">App home preview</span>
        </div>

        <div className="p-4 bg-gradient-to-b from-surface-muted/50 to-surface">
          <div className="rounded-2xl overflow-hidden shadow-card border border-gray-200/80 bg-ink text-white min-h-[320px] flex flex-col">
            <div className="relative flex-1 min-h-[200px]">
              {imageLink && !imageError ? (
                <img
                  src={imageLink}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-ink-light via-ink to-ink flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-zinc-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

              <div className="relative z-10 p-5 flex flex-col justify-end h-full min-h-[200px]">
                {badgeLabel.trim() && (
                  <span className="inline-flex self-start px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm text-[10px] font-bold tracking-widest uppercase text-white/90 mb-3">
                    {badgeLabel}
                  </span>
                )}
                {header.trim() && (
                  <p className="text-sm font-semibold text-white/90 leading-snug">
                    {header}
                  </p>
                )}
                {title.trim() && (
                  <p className="text-2xl font-bold text-white mt-1 leading-tight">
                    {title}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-ink border-t border-white/10">
              <div className="w-full py-3 px-4 rounded-xl bg-white text-ink text-sm font-semibold text-center">
                {buttonText.trim() || 'Button text'}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            Updates here as you type
          </p>
        </div>
      </div>
    </div>
  );
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
      } catch {
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
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <PageLayout
      title="Giveaway Snippet"
      description="Customize the giveaway card shown on the app home screen"
      actions={
        <LoadingButton
          variant="primary"
          onClick={handleSave}
          loading={saving}
          loadingText="Saving..."
        >
          Save changes
        </LoadingButton>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        <SectionCard
          icon={<ImageIcon className="w-5 h-5" />}
          title="Edit card content"
          description="Each field maps to a part of the home screen card"
        >
          <div className="p-6 relative">
            <ModalBusyOverlay show={saving} label="Saving..." />

            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-4">Labels</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label-field">Badge label</label>
                    <input
                      type="text"
                      value={form.badgeLabel}
                      onChange={handleChange('badgeLabel')}
                      placeholder="e.g. PAST GIVEAWAYS"
                      className="input-field"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Small tag at the top of the card</p>
                  </div>
                  <div>
                    <label className="label-field">Header</label>
                    <input
                      type="text"
                      value={form.header}
                      onChange={handleChange('header')}
                      placeholder="e.g. SUBARU WRX (VB)"
                      className="input-field"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Line above the main title</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-4">Main content</p>
                <div className="space-y-5">
                  <div>
                    <label className="label-field">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={handleChange('title')}
                      placeholder="e.g. LAST GIVEAWAY"
                      className="input-field"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Large headline on the card</p>
                  </div>

                  <div>
                    <label className="label-field">Button text</label>
                    <input
                      type="text"
                      value={form.buttonText}
                      onChange={handleChange('buttonText')}
                      placeholder="e.g. View Past Winners →"
                      className="input-field"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Text on the tap action at the bottom</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-4">Background image</p>
                <div>
                  <label className="label-field">Image URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={form.imageLink}
                      onChange={handleChange('imageLink')}
                      placeholder="https://cdn.shopify.com/..."
                      className="input-field pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Paste a direct link to the giveaway image</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="xl:sticky xl:top-6">
          <div className="page-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Eye className="w-4 h-4 text-accent" />
              <h2 className="font-semibold text-ink">Live preview</h2>
            </div>
            <GiveawaySnippetPreview {...form} />
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </PageLayout>
  );
};

export default GiveawaySnippet;
