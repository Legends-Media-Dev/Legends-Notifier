import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, Plus, FileText, ChevronLeft, ChevronDown } from 'lucide-react';
import { Notification, fetchNotifications, updateNotification, saveNotification, fetchUserGroups, UserGroup } from '../lib/api';
import { truncateText } from '../lib/utils';
import Toast from './Toast';

interface ScheduleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type FlowStep = 'choice' | 'new' | 'existing';

const ScheduleNotificationModal = ({
  isOpen,
  onClose,
  onSuccess,
}: ScheduleNotificationModalProps) => {
  const [step, setStep] = useState<FlowStep>('choice');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // User groups
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedUserGroup, setSelectedUserGroup] = useState<string>('');
  const [loadingUserGroups, setLoadingUserGroups] = useState(false);
  
  // New notification form fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [sendAtDate, setSendAtDate] = useState('');
  const [sendAtTime, setSendAtTime] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    if (isOpen) {
      setStep('choice');
      setTitle('');
      setBody('');
      setJsonData('');
      setJsonError('');
      setSendAtDate('');
      setSendAtTime('');
      setSelectedNotification(null);
      setSelectedUserGroup('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'existing' && notifications.length === 0) {
      loadNotifications();
    }
    if ((step === 'new' || step === 'existing') && userGroups.length === 0) {
      loadUserGroups();
    }
  }, [step]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoadingNotifications(false);
    }
  };

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

  const handleScheduleExisting = async () => {
    if (!selectedNotification) {
      showToast('Please select a notification', 'error');
      return;
    }

    if (!sendAtDate || !sendAtTime) {
      showToast('Please select a date and time', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const sendAt = new Date(`${sendAtDate}T${sendAtTime}`).toISOString();
      
      await updateNotification({
        notificationId: selectedNotification.id,
        sendAt,
        status: 'pending',
        userGroup: selectedUserGroup || 'allUsers',
      });

      showToast('Notification scheduled successfully!', 'success');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      showToast('Failed to schedule notification', 'error');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleNew = async () => {
    if (jsonError) {
      showToast('Please fix JSON errors before submitting', 'error');
      return;
    }

    if (!title.trim() || !body.trim()) {
      showToast('Title and body are required', 'error');
      return;
    }

    if (!sendAtDate || !sendAtTime) {
      showToast('Please select a date and time', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const sendAt = new Date(`${sendAtDate}T${sendAtTime}`).toISOString();
      
      const payload = {
        title: title.trim(),
        body: body.trim(),
        ...(jsonData.trim() && { data: JSON.parse(jsonData) }),
        sendAt,
        status: 'pending',
        userGroup: selectedUserGroup || 'allUsers',
      };

      await saveNotification(payload);
      
      showToast('Notification scheduled successfully!', 'success');
      
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      showToast('Failed to schedule notification', 'error');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  // Get minimum date/time (now)
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

  const minDateTime = getMinDateTime();

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
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                  <div className="flex items-center gap-3">
                    {step !== 'choice' && (
                      <button
                        onClick={() => setStep('choice')}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    <h2 className="text-xl font-semibold text-gray-900">
                      {step === 'choice' 
                        ? 'Schedule Notification'
                        : step === 'new'
                        ? 'Create & Schedule New Notification'
                        : 'Schedule Existing Notification'}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-6">
                  {step === 'choice' && (
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-6">Choose how you'd like to schedule a notification:</p>
                      <button
                        onClick={() => setStep('new')}
                        className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-apple-blue hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-apple-blue/10 flex items-center justify-center group-hover:bg-apple-blue/20 transition-colors">
                            <Plus className="w-6 h-6 text-apple-blue" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Create New Notification</h3>
                            <p className="text-sm text-gray-600 mt-1">Create a new notification and schedule it for later</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setStep('existing')}
                        className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-apple-blue hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-apple-blue/10 flex items-center justify-center group-hover:bg-apple-blue/20 transition-colors">
                            <FileText className="w-6 h-6 text-apple-blue" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Use Existing Notification</h3>
                            <p className="text-sm text-gray-600 mt-1">Schedule an existing saved notification</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {step === 'existing' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Notification
                        </label>
                        {loadingNotifications ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="bg-gray-50 rounded-xl p-8 text-center">
                            <p className="text-gray-500">No notifications found</p>
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2">
                            {notifications.map((notif) => (
                              <button
                                key={notif.id}
                                onClick={() => setSelectedNotification(notif)}
                                className={`w-full p-4 rounded-lg text-left transition-colors ${
                                  selectedNotification?.id === notif.id
                                    ? 'bg-apple-blue text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                                }`}
                              >
                                <h4 className="font-semibold">{notif.title}</h4>
                                <p className={`text-sm mt-1 ${selectedNotification?.id === notif.id ? 'text-blue-100' : 'text-gray-600'}`}>
                                  {truncateText(notif.body, 60)}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
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
                            <option value="">All Users (default)</option>
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
                  )}

                  {step === 'new' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter notification title"
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
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
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent resize-none"
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
                          className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent resize-none font-mono text-sm ${
                            jsonError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {jsonError && (
                          <p className="mt-2 text-sm text-red-600">{jsonError}</p>
                        )}
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
                            <option value="">All Users (default)</option>
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
                  )}
                </div>

                {(step === 'new' || step === 'existing') && (
                  <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                    <button
                      onClick={onClose}
                      disabled={isSaving}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={step === 'new' ? handleScheduleNew : handleScheduleExisting}
                      disabled={isSaving || !!jsonError || (step === 'existing' && !selectedNotification) || !sendAtDate || !sendAtTime}
                      className="px-6 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          Schedule Notification
                        </>
                      )}
                    </button>
                  </div>
                )}
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

