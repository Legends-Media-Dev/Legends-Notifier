import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, XCircle, Users } from 'lucide-react';
import { Notification, updateOrCancelScheduledNotification } from '../lib/api';
import { formatUserGroup } from '../lib/notificationUtils';
import LoadingButton from './LoadingButton';
import ModalBusyOverlay from './ModalBusyOverlay';
import Toast from './Toast';

interface EditScheduleModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditScheduleModal = ({
  notification,
  isOpen,
  onClose,
  onSuccess,
}: EditScheduleModalProps) => {
  const [sendAtDate, setSendAtDate] = useState('');
  const [sendAtTime, setSendAtTime] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    if (isOpen && notification?.sendAt) {
      const d = new Date(notification.sendAt);
      setSendAtDate(d.toISOString().slice(0, 10));
      setSendAtTime(d.toTimeString().slice(0, 5));
    }
  }, [notification, isOpen]);

  const getMinDateTime = () => {
    const now = new Date();
    return { date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5) };
  };

  const minDateTime = getMinDateTime();

  const handleUpdate = async () => {
    if (!notification?.id || !sendAtDate || !sendAtTime) return;

    const sendAt = new Date(`${sendAtDate}T${sendAtTime}`);
    if (Number.isNaN(sendAt.getTime()) || sendAt.getTime() <= Date.now()) {
      showToast('Schedule time must be in the future', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      await updateOrCancelScheduledNotification({
        notificationId: notification.id,
        updates: { sendAt: sendAt.toISOString() },
      });
      showToast('Schedule updated', 'success');
      setTimeout(() => { onClose(); onSuccess?.(); }, 900);
    } catch {
      showToast('Failed to update schedule', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!notification?.id) return;
    if (!window.confirm(`Cancel the scheduled send for "${notification.title}"?`)) return;

    try {
      setIsCanceling(true);
      await updateOrCancelScheduledNotification({
        notificationId: notification.id,
        updates: { status: 'cancelled' },
      });
      showToast('Schedule cancelled — moved back to drafts', 'success');
      setTimeout(() => { onClose(); onSuccess?.(); }, 900);
    } catch {
      showToast('Failed to cancel', 'error');
    } finally {
      setIsCanceling(false);
    }
  };

  if (!notification || !isOpen) return null;

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
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
                <ModalBusyOverlay
                  show={isUpdating || isCanceling}
                  label={isCanceling ? 'Canceling schedule...' : 'Updating schedule...'}
                />
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Edit Schedule</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{notification.title}</p>
                  </div>
                  <button onClick={onClose} disabled={isUpdating || isCanceling} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg disabled:opacity-50"><X className="w-5 h-5" /></button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  <div className="bg-accent-light/50 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
                    <Users className="w-4 h-4 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Audience</p>
                      <p className="text-sm font-medium text-ink">{formatUserGroup(notification.userGroup)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-field">Date</label>
                      <input type="date" value={sendAtDate} onChange={(e) => setSendAtDate(e.target.value)} min={minDateTime.date} className="input-field" />
                    </div>
                    <div>
                      <label className="label-field">Time</label>
                      <input type="time" value={sendAtTime} onChange={(e) => setSendAtTime(e.target.value)} min={sendAtDate === minDateTime.date ? minDateTime.time : undefined} className="input-field" />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-surface-muted flex justify-between items-center">
                  <LoadingButton
                    variant="danger"
                    onClick={handleCancel}
                    loading={isCanceling}
                    loadingText="Canceling..."
                    disabled={isUpdating}
                    icon={<XCircle className="w-4 h-4" />}
                  >
                    Cancel Schedule
                  </LoadingButton>
                  <div className="flex gap-2">
                    <LoadingButton variant="secondary" onClick={onClose} disabled={isUpdating || isCanceling}>
                      Close
                    </LoadingButton>
                    <LoadingButton
                      variant="primary"
                      onClick={handleUpdate}
                      loading={isUpdating}
                      loadingText="Saving..."
                      disabled={isCanceling || !sendAtDate || !sendAtTime}
                      icon={<Calendar className="w-4 h-4" />}
                    >
                      Update
                    </LoadingButton>
                  </div>
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

export default EditScheduleModal;
