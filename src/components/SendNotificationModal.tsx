import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Users, AlertCircle } from 'lucide-react';
import { Notification, executeNotification } from '../lib/api';
import { formatUserGroup } from '../lib/notificationUtils';
import { resolveAudienceTokens } from '../lib/audienceUtils';
import LoadingButton from './LoadingButton';
import ModalBusyOverlay from './ModalBusyOverlay';
import Toast from './Toast';

interface SendNotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SendNotificationModal = ({
  notification,
  isOpen,
  onClose,
  onSuccess,
}: SendNotificationModalProps) => {
  const [isSending, setIsSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    if (isOpen && notification) {
      setLoadingCount(true);
      setRecipientCount(null);
      resolveAudienceTokens(notification.userGroup || 'allUsers')
        .then((tokens) => setRecipientCount(tokens.length))
        .catch(() => setRecipientCount(0))
        .finally(() => setLoadingCount(false));
    }
  }, [isOpen, notification]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const handleSend = async () => {
    if (!notification) return;

    try {
      setIsSending(true);
      const tokens = await resolveAudienceTokens(notification.userGroup || 'allUsers');

      if (tokens.length === 0) {
        showToast('No recipients found for this audience', 'error');
        return;
      }

      const result = await executeNotification({
        notificationId: notification.id,
        targetTokens: tokens,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        userGroup: notification.userGroup || 'allUsers',
        trigger: 'manual',
        sentBy: 'admin',
      });

      const msg =
        (result.failureCount ?? 0) > 0
          ? `Sent to ${result.sentCount} devices (${result.failureCount} failed)`
          : `Campaign sent to ${result.sentCount} devices`;

      showToast(msg, (result.failureCount ?? 0) > 0 ? 'info' : 'success');

      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1200);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to send campaign', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!notification) return null;

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
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
                <ModalBusyOverlay
                  show={isSending}
                  label="Sending campaign..."
                />
                {loadingCount && !isSending && (
                  <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                  </div>
                )}
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-ink">Send Campaign</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Review before sending — this cannot be undone.</p>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div className="bg-surface-muted rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Title</p>
                      <p className="text-sm font-semibold text-ink">{notification.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{notification.body}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                      <Users className="w-4 h-4 text-accent" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Audience</p>
                        <p className="text-sm font-medium text-ink">
                          {formatUserGroup(notification.userGroup)}
                          {loadingCount ? (
                            <span className="text-gray-400 font-normal ml-1">· counting...</span>
                          ) : recipientCount !== null ? (
                            <span className="text-gray-500 font-normal ml-1">· {recipientCount} devices</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>

                  {recipientCount === 0 && !loadingCount && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">No devices found for this audience. Check your user groups.</p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-surface-muted flex justify-end gap-3">
                  <LoadingButton variant="secondary" onClick={onClose} disabled={isSending || loadingCount}>
                    Cancel
                  </LoadingButton>
                  <LoadingButton
                    variant="primary"
                    onClick={handleSend}
                    loading={isSending}
                    loadingText="Sending..."
                    disabled={loadingCount || recipientCount === 0}
                    icon={<Send className="w-4 h-4" />}
                  >
                    Send Now
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

export default SendNotificationModal;
