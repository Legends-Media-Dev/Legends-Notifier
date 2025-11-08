import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Notification } from '../lib/api';
import { formatDate } from '../lib/utils';

interface NotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onResend: () => void;
  isResending?: boolean;
}

const NotificationModal = ({
  notification,
  isOpen,
  onClose,
  onResend,
  isResending = false,
}: NotificationModalProps) => {
  if (!notification) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-semibold text-gray-900">Notification Details</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Title
                  </label>
                  <p className="mt-2 text-lg text-gray-900">{notification.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Body
                  </label>
                  <p className="mt-2 text-gray-900 whitespace-pre-wrap">{notification.body}</p>
                </div>

                {notification.data && Object.keys(notification.data).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Data
                    </label>
                    <pre className="mt-2 p-4 bg-gray-50 rounded-xl text-sm text-gray-800 overflow-x-auto border border-gray-200">
                      {JSON.stringify(notification.data, null, 2)}
                    </pre>
                  </div>
                )}

                {notification.status && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </label>
                    <p className="mt-2 text-gray-900 capitalize">{notification.status}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Created Date
                  </label>
                  <p className="mt-2 text-gray-900">{formatDate(notification.createdAt)}</p>
                </div>

                {notification.createdBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Created By
                    </label>
                    <p className="mt-2 text-gray-900">{notification.createdBy}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={onResend}
                  disabled={isResending}
                  className="px-6 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isResending ? 'Sending...' : 'Resend Notification'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;

