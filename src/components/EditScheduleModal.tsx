import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, XCircle, Loader2, ChevronDown } from 'lucide-react';
import { Notification, updateOrCancelScheduledNotification, fetchUserGroups, UserGroup } from '../lib/api';
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
  
  // User groups
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedUserGroup, setSelectedUserGroup] = useState<string>('');
  const [loadingUserGroups, setLoadingUserGroups] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    if (isOpen) {
      loadUserGroups();
      
      if (notification?.sendAt) {
        const sendAtDateObj = new Date(notification.sendAt);
        const year = sendAtDateObj.getFullYear();
        const month = String(sendAtDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(sendAtDateObj.getDate()).padStart(2, '0');
        const hours = String(sendAtDateObj.getHours()).padStart(2, '0');
        const minutes = String(sendAtDateObj.getMinutes()).padStart(2, '0');
        
        setSendAtDate(`${year}-${month}-${day}`);
        setSendAtTime(`${hours}:${minutes}`);
      }
      
      // Initialize selected user group from notification (if it exists)
      const notificationUserGroup = (notification as any)?.userGroup;
      setSelectedUserGroup(notificationUserGroup || 'allUsers');
    }
  }, [notification, isOpen]);

  const loadUserGroups = async () => {
    try {
      setLoadingUserGroups(true);
      const data = await fetchUserGroups();
      setUserGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load user groups:', error);
      showToast('Failed to load user groups', 'error');
    } finally {
      setLoadingUserGroups(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
    };
  };

  const handleUpdate = async () => {
    if (!notification?.id) {
      showToast('Notification ID not found', 'error');
      return;
    }

    if (!sendAtDate || !sendAtTime) {
      showToast('Please select a date and time', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      const sendAt = new Date(`${sendAtDate}T${sendAtTime}`).toISOString();
      
      await updateOrCancelScheduledNotification({
        notificationId: notification.id,
        updates: {
          sendAt,
          userGroup: selectedUserGroup || 'allUsers',
        },
      });

      showToast('Schedule updated successfully!', 'success');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      showToast('Failed to update schedule', 'error');
      console.error('Error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!notification?.id) {
      showToast('Notification ID not found', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel the scheduled notification "${notification.title}"?`)) {
      return;
    }

    try {
      setIsCanceling(true);
      
      await updateOrCancelScheduledNotification({
        notificationId: notification.id,
        updates: {
          status: 'cancelled',
        },
      });

      showToast('Scheduled notification cancelled successfully!', 'success');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      showToast('Failed to cancel schedule', 'error');
      console.error('Error:', error);
    } finally {
      setIsCanceling(false);
    }
  };

  const minDateTime = getMinDateTime();

  if (!notification || !isOpen) return null;

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
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Schedule</h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      <span className="font-semibold">{notification.title}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      User Group
                    </label>
                    <div className="relative">
                      <select
                        value={selectedUserGroup}
                        onChange={(e) => setSelectedUserGroup(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent appearance-none pr-10"
                      >
                        <option value="allUsers">All Users (default)</option>
                        {loadingUserGroups ? (
                          <option disabled>Loading groups...</option>
                        ) : (
                          userGroups
                            .filter((group) => {
                              const displayName = (group.metaName || group.name || group.id).toLowerCase();
                              return displayName !== 'all users';
                            })
                            .map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.metaName || group.name || group.id} {group.tokens ? `(${group.tokens.length} users)` : ''}
                              </option>
                            ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Select a user group to target specific users, or leave as "All Users" to send to everyone
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Schedule Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={sendAtDate}
                        onChange={(e) => setSendAtDate(e.target.value)}
                        min={minDateTime.date}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Schedule Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={sendAtTime}
                        onChange={(e) => setSendAtTime(e.target.value)}
                        min={sendAtDate === minDateTime.date ? minDateTime.time : undefined}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center rounded-b-2xl">
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating || isCanceling}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {isCanceling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Cancel Schedule
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      disabled={isUpdating || isCanceling}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating || isCanceling || !sendAtDate || !sendAtTime}
                      className="px-6 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          Update Schedule
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

export default EditScheduleModal;

