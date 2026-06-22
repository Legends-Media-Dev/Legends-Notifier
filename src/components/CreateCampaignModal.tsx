import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Megaphone, Calendar } from 'lucide-react';
import { saveNotification, fetchUserGroups, UserGroup } from '../lib/api';
import LoadingButton from './LoadingButton';
import ModalBusyOverlay from './ModalBusyOverlay';
import Toast from './Toast';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSavedAndSchedule?: (notificationId: string) => void;
}

const CreateCampaignModal = ({
  isOpen,
  onClose,
  onSuccess,
  onSavedAndSchedule,
}: CreateCampaignModalProps) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedUserGroup, setSelectedUserGroup] = useState('allUsers');
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'draft' | 'schedule'>('draft');
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setBody('');
      setSelectedUserGroup('allUsers');
      setSubmitMode('draft');
      loadUserGroups();
    }
  }, [isOpen]);

  const loadUserGroups = async () => {
    try {
      setLoadingGroups(true);
      const data = await fetchUserGroups();
      setUserGroups(Array.isArray(data) ? data : []);
    } finally {
      setLoadingGroups(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const handleSubmit = async (mode: 'draft' | 'schedule') => {
    if (!title.trim() || !body.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }

    try {
      setSubmitMode(mode);
      setIsSubmitting(true);
      const result = await saveNotification({
        title: title.trim(),
        body: body.trim(),
        userGroup: selectedUserGroup,
      });
      showToast(mode === 'schedule' ? 'Draft saved — pick a send time' : 'Campaign saved as draft', 'success');
      setTimeout(() => {
        onClose();
        onSuccess?.();
        if (mode === 'schedule' && result.id) {
          onSavedAndSchedule?.(result.id);
        }
      }, 600);
    } catch {
      showToast('Failed to create campaign', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative">
                <ModalBusyOverlay show={isSubmitting} label="Saving campaign..." />
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-ink">New Campaign</h2>
                      <p className="text-sm text-gray-500">Create a push notification draft</p>
                    </div>
                  </div>
                  <button onClick={onClose} disabled={isSubmitting} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg disabled:opacity-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  <div>
                    <label className="label-field">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Summer sale is live!"
                      className="input-field"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="label-field">Message <span className="text-red-500">*</span></label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={4}
                      placeholder="Tap to shop our biggest drop yet..."
                      className="input-field resize-none"
                    />
                  </div>

                  <div>
                    <label className="label-field">Audience <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        value={selectedUserGroup}
                        onChange={(e) => setSelectedUserGroup(e.target.value)}
                        disabled={loadingGroups}
                        className="input-field appearance-none pr-10 disabled:opacity-50"
                      >
                        <option value="allUsers">All Users</option>
                        {userGroups
                          .filter((g) => (g.metaName || g.name || g.id).toLowerCase() !== 'all users')
                          .map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.metaName || g.name || g.id}
                              {g.tokens ? ` (${g.tokens.length})` : ''}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Audience is set here and used when you send or schedule.
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-surface-muted flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <LoadingButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </LoadingButton>
                  <LoadingButton
                    variant="secondary"
                    onClick={() => handleSubmit('draft')}
                    loading={isSubmitting && submitMode === 'draft'}
                    loadingText="Saving..."
                    disabled={!title.trim() || !body.trim() || isSubmitting}
                  >
                    Save as Draft
                  </LoadingButton>
                  <LoadingButton
                    variant="primary"
                    onClick={() => handleSubmit('schedule')}
                    loading={isSubmitting && submitMode === 'schedule'}
                    loadingText="Saving..."
                    disabled={!title.trim() || !body.trim() || isSubmitting}
                    icon={<Calendar className="w-4 h-4" />}
                  >
                    Save & Schedule
                  </LoadingButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </>
  );
};

export default CreateCampaignModal;
