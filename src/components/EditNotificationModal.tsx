import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Calendar, Info } from 'lucide-react';
import { Notification, updateNotification, UpdateNotificationPayload, fetchUserGroups, UserGroup } from '../lib/api';
import { canSchedule } from '../lib/notificationUtils';
import LoadingButton from './LoadingButton';
import ModalBusyOverlay from './ModalBusyOverlay';
import Toast from './Toast';

interface EditNotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSavedAndSchedule?: (notificationId: string) => void;
  showGuidanceBanner?: boolean;
}

const EditNotificationModal = ({
  notification,
  isOpen,
  onClose,
  onSuccess,
  onSavedAndSchedule,
  showGuidanceBanner = false,
}: EditNotificationModalProps) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedUserGroup, setSelectedUserGroup] = useState('allUsers');
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'save' | 'schedule'>('save');
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const canScheduleDraft = notification ? canSchedule(notification) : false;

  useEffect(() => {
    if (notification && isOpen) {
      setTitle(notification.title || '');
      setBody(notification.body || '');
      setSelectedUserGroup(notification.userGroup || 'allUsers');
      setSaveMode('save');
      loadUserGroups();
    }
  }, [notification, isOpen]);

  const loadUserGroups = async () => {
    try {
      setLoadingGroups(true);
      const data = await fetchUserGroups();
      setUserGroups(Array.isArray(data) ? data : []);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSave = async (mode: 'save' | 'schedule') => {
    if (!title.trim() || !body.trim() || !notification?.id) return;

    try {
      setSaveMode(mode);
      setIsSaving(true);
      const updatePayload: UpdateNotificationPayload = {
        notificationId: notification.id,
        title: title.trim(),
        body: body.trim(),
        data: {},
        userGroup: selectedUserGroup,
      };
      await updateNotification(updatePayload);
      showToast(mode === 'schedule' ? 'Saved — pick a send time' : 'Campaign updated', 'success');
      onSuccess?.();
      setTimeout(() => {
        onClose();
        if (mode === 'schedule') {
          onSavedAndSchedule?.(notification.id);
        }
      }, 600);
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  if (!notification) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative">
                <ModalBusyOverlay show={isSaving} label="Saving changes..." />
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Edit Campaign</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {showGuidanceBanner ? 'Update your copy, then save or schedule' : 'Make changes to this draft'}
                    </p>
                  </div>
                  <button onClick={onClose} disabled={isSaving} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg disabled:opacity-50"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {showGuidanceBanner && (
                    <div className="flex gap-3 bg-accent-light/60 border border-accent/20 rounded-xl px-4 py-3">
                      <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <p className="text-sm text-accent-hover leading-relaxed">
                        This is a copy of a sent campaign. Update the title or message so subscribers don&apos;t get the exact same notification twice.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="label-field">Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" autoFocus={showGuidanceBanner} />
                  </div>
                  <div>
                    <label className="label-field">Message</label>
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="input-field resize-none" />
                  </div>
                  <div>
                    <label className="label-field">Audience</label>
                    <div className="relative">
                      <select
                        value={selectedUserGroup}
                        onChange={(e) => setSelectedUserGroup(e.target.value)}
                        disabled={loadingGroups}
                        className="input-field appearance-none pr-10"
                      >
                        <option value="allUsers">All Users</option>
                        {userGroups
                          .filter((g) => (g.metaName || g.name || g.id).toLowerCase() !== 'all users')
                          .map((g) => (
                            <option key={g.id} value={g.id}>{g.metaName || g.name || g.id}</option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-surface-muted flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <LoadingButton variant="secondary" onClick={onClose} disabled={isSaving}>
                    Cancel
                  </LoadingButton>
                  <LoadingButton
                    variant="secondary"
                    onClick={() => handleSave('save')}
                    loading={isSaving && saveMode === 'save'}
                    loadingText="Saving..."
                    disabled={!title.trim() || !body.trim() || isSaving}
                  >
                    Save
                  </LoadingButton>
                  {canScheduleDraft && (
                    <LoadingButton
                      variant="primary"
                      onClick={() => handleSave('schedule')}
                      loading={isSaving && saveMode === 'schedule'}
                      loadingText="Saving..."
                      disabled={!title.trim() || !body.trim() || isSaving}
                      icon={<Calendar className="w-4 h-4" />}
                    >
                      Save & Schedule
                    </LoadingButton>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
    </>
  );
};

export default EditNotificationModal;
