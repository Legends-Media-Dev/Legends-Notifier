import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Notification, updateNotification } from '../lib/api';
import Toast from './Toast';

interface EditNotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditNotificationModal = ({
  notification,
  isOpen,
  onClose,
  onSuccess,
}: EditNotificationModalProps) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    if (notification && isOpen) {
      setTitle(notification.title || '');
      setBody(notification.body || '');
      setJsonData(notification.data ? JSON.stringify(notification.data, null, 2) : '');
      setJsonError('');
    }
  }, [notification, isOpen]);

  const validateJson = (jsonString: string): boolean => {
    if (!jsonString.trim()) return true;
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonData(value);
    if (value.trim() && !validateJson(value)) {
      setJsonError('Invalid JSON format');
    } else {
      setJsonError('');
    }
  };

  const handleSave = async () => {
    if (jsonError) {
      showToast('Please fix JSON errors before saving', 'error');
      return;
    }

    if (!title.trim() || !body.trim()) {
      showToast('Title and body are required', 'error');
      return;
    }

    if (!notification?.id) {
      showToast('Cannot save: notification ID not found', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const updatePayload: Record<string, unknown> = {
        notificationId: notification.id,
        title: title.trim(),
        body: body.trim(),
      };

      if (jsonData.trim()) {
        updatePayload.data = JSON.parse(jsonData);
      } else {
        updatePayload.data = {};
      }

      await updateNotification(updatePayload);

      showToast('Notification saved successfully!', 'success');

      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      showToast('Failed to save notification', 'error');
      console.error('Error:', error);
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
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Notification</h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter notification title"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Body <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={4}
                      placeholder="Enter notification body"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Optional Data (JSON)
                    </label>
                    <textarea
                      value={jsonData}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      rows={4}
                      placeholder='{"key": "value"}'
                      className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all resize-none font-mono text-sm ${
                        jsonError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                    />
                    {jsonError && (
                      <p className="mt-2 text-sm text-red-600">{jsonError}</p>
                    )}
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center rounded-b-2xl">
                  <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !!jsonError || !title.trim() || !body.trim()}
                    className="px-6 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
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

export default EditNotificationModal;
