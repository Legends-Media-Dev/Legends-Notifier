import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Calendar, Users, X } from 'lucide-react';
import {
  Notification,
  fetchNotifications,
  updateOrCancelScheduledNotification,
} from '../lib/api';
import { isSchedulable, formatUserGroup } from '../lib/notificationUtils';
import { truncateText } from '../lib/utils';
import LoadingButton from './LoadingButton';
import ModalBusyOverlay from './ModalBusyOverlay';
import Toast from './Toast';

interface ScheduleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedNotification?: Notification | null;
  onCreateNew?: () => void;
}

const ScheduleNotificationModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedNotification,
  onCreateNew,
}: ScheduleNotificationModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [sendAtDate, setSendAtDate] = useState('');
  const [sendAtTime, setSendAtTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const schedulableNotifications = useMemo(
    () => notifications.filter(isSchedulable),
    [notifications]
  );

  const activeNotification = preselectedNotification ?? selectedNotification;

  useEffect(() => {
    if (isOpen) {
      setSendAtDate('');
      setSendAtTime('');
      setSelectedNotification(preselectedNotification ?? null);
      if (!preselectedNotification) loadNotifications();
    }
  }, [isOpen, preselectedNotification]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load campaigns', 'error');
    } finally {
      setLoadingNotifications(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    return {
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
    };
  };

  const minDateTime = getMinDateTime();

  const handleSchedule = async () => {
    if (!activeNotification) {
      showToast('Please select a campaign', 'error');
      return;
    }
    if (!sendAtDate || !sendAtTime) {
      showToast('Please select a date and time', 'error');
      return;
    }

    const sendAt = new Date(`${sendAtDate}T${sendAtTime}`);
    if (Number.isNaN(sendAt.getTime()) || sendAt.getTime() <= Date.now()) {
      showToast('Schedule time must be in the future', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await updateOrCancelScheduledNotification({
        notificationId: activeNotification.id,
        updates: {
          sendAt: sendAt.toISOString(),
        },
      });

      showToast(`Scheduled for ${sendAt.toLocaleString()}`, 'success');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 900);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to schedule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
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
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden relative">
                <ModalBusyOverlay show={isSaving} label="Scheduling campaign..." />
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Schedule Campaign</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Pick when to send — audience is already set.</p>
                  </div>
                  <button onClick={onClose} disabled={isSaving} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg disabled:opacity-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {!preselectedNotification && (
                    <div>
                      <label className="label-field">Select draft</label>
                      {loadingNotifications ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 text-accent animate-spin" />
                        </div>
                      ) : schedulableNotifications.length === 0 ? (
                        <div className="bg-surface-muted rounded-xl p-5 text-center border border-gray-200">
                          <p className="text-sm text-gray-600 font-medium">No drafts available</p>
                          {onCreateNew && (
                            <button
                              onClick={() => { onClose(); onCreateNew(); }}
                              className="mt-3 text-sm text-accent font-medium hover:underline"
                            >
                              Create a campaign first
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {schedulableNotifications.map((notif) => (
                            <button
                              key={notif.id}
                              type="button"
                              onClick={() => setSelectedNotification(notif)}
                              className={`w-full p-3 rounded-xl text-left border transition-colors ${
                                selectedNotification?.id === notif.id
                                  ? 'border-accent bg-accent-light'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <p className="text-sm font-semibold text-ink">{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{truncateText(notif.body, 50)}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeNotification && (
                    <div className="bg-accent-light/50 border border-accent/20 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-semibold text-ink">{activeNotification.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users className="w-3.5 h-3.5 text-accent" />
                        <span>Audience: <strong>{formatUserGroup(activeNotification.userGroup)}</strong></span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-field">Date</label>
                      <input
                        type="date"
                        value={sendAtDate}
                        onChange={(e) => setSendAtDate(e.target.value)}
                        min={minDateTime.date}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label-field">Time</label>
                      <input
                        type="time"
                        value={sendAtTime}
                        onChange={(e) => setSendAtTime(e.target.value)}
                        min={sendAtDate === minDateTime.date ? minDateTime.time : undefined}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-surface-muted flex justify-end gap-3">
                  <LoadingButton variant="secondary" onClick={onClose} disabled={isSaving}>
                    Cancel
                  </LoadingButton>
                  <LoadingButton
                    variant="primary"
                    onClick={handleSchedule}
                    loading={isSaving}
                    loadingText="Scheduling..."
                    disabled={!activeNotification || !sendAtDate || !sendAtTime}
                    icon={<Calendar className="w-4 h-4" />}
                  >
                    Confirm Schedule
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

export default ScheduleNotificationModal;
