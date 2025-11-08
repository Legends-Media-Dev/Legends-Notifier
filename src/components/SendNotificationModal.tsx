import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, ChevronDown, Save } from 'lucide-react';
import { Notification, User, fetchUsers, executeNotification, updateNotification } from '../lib/api';
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
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [recipientOption, setRecipientOption] = useState<'all' | 'custom'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  
  // Track original values to detect if notification was edited
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalBody, setOriginalBody] = useState('');
  const [originalData, setOriginalData] = useState('');

  useEffect(() => {
    if (notification && isOpen) {
      const initialTitle = notification.title || '';
      const initialBody = notification.body || '';
      const initialData = notification.data ? JSON.stringify(notification.data, null, 2) : '';
      
      setTitle(initialTitle);
      setBody(initialBody);
      setJsonData(initialData);
      setOriginalTitle(initialTitle);
      setOriginalBody(initialBody);
      setOriginalData(initialData);
      setJsonError('');
      setRecipientOption('all');
      setSelectedUsers([]);
    }
  }, [notification, isOpen]);

  useEffect(() => {
    if (isOpen && recipientOption === 'custom') {
      loadUsers();
    }
  }, [isOpen, recipientOption]);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

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

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (jsonError) {
      showToast('Please fix JSON errors before sending', 'error');
      return;
    }

    if (!title.trim() || !body.trim()) {
      showToast('Title and body are required', 'error');
      return;
    }

    try {
      setIsSending(true);

      // Get target tokens based on selection
      let targetTokens: string[] = [];
      
      if (recipientOption === 'all') {
        // Fetch all users and get their tokens
        const allUsers = await fetchUsers();
        targetTokens = allUsers
          .filter((user) => user.token && typeof user.token === 'string')
          .map((user) => user.token as string);
      } else {
        // Get tokens for selected users
        const selectedUserObjects = users.filter((user) => {
          const userId = user.id || user.userId || '';
          return selectedUsers.includes(userId);
        });
        targetTokens = selectedUserObjects
          .filter((user) => user.token && typeof user.token === 'string')
          .map((user) => user.token as string);
      }

      if (targetTokens.length === 0) {
        showToast('No valid tokens found for selected users', 'error');
        return;
      }

      // Check if notification was edited
      const titleChanged = title.trim() !== originalTitle;
      const bodyChanged = body.trim() !== originalBody;
      const dataChanged = jsonData.trim() !== originalData;
      const wasEdited = titleChanged || bodyChanged || dataChanged;

      // If notification was edited and we have a notificationId, update it first
      if (wasEdited && notification?.id) {
        try {
          const updatePayload: any = {
            notificationId: notification.id,
          };

          if (titleChanged) {
            updatePayload.title = title.trim();
          }
          if (bodyChanged) {
            updatePayload.body = body.trim();
          }
          if (dataChanged) {
            updatePayload.data = jsonData.trim() ? JSON.parse(jsonData) : {};
          }

          await updateNotification(updatePayload);
        } catch (error) {
          console.error('Error updating notification:', error);
          // Continue with sending even if update fails
        }
      }

      // Prepare execution payload
      const payload: any = {
        targetTokens,
      };

      // Include notificationId if we're sending from a saved notification
      // This allows the backend to update the notification status after sending
      if (notification?.id) {
        payload.notificationId = notification.id;
      }

      // Include title, body, and data for the notification
      // If notificationId is provided, these will override the saved values
      // If no notificationId, these are required for ad-hoc sends
      payload.title = title.trim();
      payload.body = body.trim();
      if (jsonData.trim()) {
        payload.data = JSON.parse(jsonData);
      }

      await executeNotification(payload);
      
      showToast('Notification sent successfully!', 'success');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      showToast('Failed to send notification', 'error');
      console.error('Error:', error);
    } finally {
      setIsSending(false);
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

      const updatePayload: any = {
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
      
      // Update original values so we don't trigger update on next send
      setOriginalTitle(title.trim());
      setOriginalBody(body.trim());
      setOriginalData(jsonData.trim());
      
      showToast('Notification saved successfully!', 'success');
      
      // Refresh the notifications list in the parent component
      if (onSuccess) {
        onSuccess();
      }
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
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                  <h2 className="text-xl font-semibold text-gray-900">Send Notification</h2>
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Send To <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={recipientOption}
                        onChange={(e) => setRecipientOption(e.target.value as 'all' | 'custom')}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent appearance-none pr-10"
                      >
                        <option value="all">All Users</option>
                        <option value="custom">Select Users</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>

                    {recipientOption === 'custom' && (
                      <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-4">
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
                          </div>
                        ) : users.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No users found</p>
                        ) : (
                          <div className="space-y-2">
                            {users.map((user) => {
                              const userId = user.id || user.userId || '';
                              const isSelected = selectedUsers.includes(userId);
                              return (
                                <label
                                  key={userId}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-apple-blue/10 border-2 border-apple-blue'
                                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleUserToggle(userId)}
                                    className="w-4 h-4 text-apple-blue rounded focus:ring-apple-blue"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                      {user.email || user.userId || 'Unknown User'}
                                    </p>
                                    {user.modelName && (
                                      <p className="text-xs text-gray-500">{user.modelName}</p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center rounded-b-2xl">
                  <button
                    onClick={onClose}
                    disabled={isSending || isSaving}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSending || isSaving || !!jsonError || !title.trim() || !body.trim()}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <button
                      onClick={handleSend}
                      disabled={isSending || isSaving || !!jsonError || !title.trim() || !body.trim()}
                      className="px-6 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Notification
                        </>
                      )}
                    </button>
                  </div>
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

