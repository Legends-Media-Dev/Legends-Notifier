import { useState, useEffect, useMemo } from 'react';
import { Eye, Send, Loader2, X, Calendar, Plus, Pencil } from 'lucide-react';
import { fetchNotifications, fetchScheduledNotifications, Notification, deleteNotification } from '../lib/api';
import { formatDate, truncateText } from '../lib/utils';
import NotificationModal from '../components/NotificationModal';
import SendNotificationModal from '../components/SendNotificationModal';
import ScheduleNotificationModal from '../components/ScheduleNotificationModal';
import EditScheduleModal from '../components/EditScheduleModal';
import Toast from '../components/Toast';

type TabType = 'all' | 'scheduled' | 'pending' | 'sent';

const Dashboard = () => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notificationToSend, setNotificationToSend] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [notificationToEditSchedule, setNotificationToEditSchedule] = useState<Notification | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (activeTab === 'scheduled') {
      loadScheduledNotifications();
    }
  }, [activeTab]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setAllNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setAllNotifications([]);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const data = await fetchScheduledNotifications();
      setScheduledNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
      setScheduledNotifications([]);
    }
  };

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  const handleSend = (notification: Notification) => {
    setNotificationToSend(notification);
    setIsSendModalOpen(true);
  };

  const handleSendSuccess = () => {
    loadNotifications();
    if (activeTab === 'scheduled') {
      loadScheduledNotifications();
    }
  };

  const handleScheduleSuccess = () => {
    loadNotifications();
    if (activeTab === 'scheduled') {
      loadScheduledNotifications();
    }
  };

  const handleEditSchedule = (notification: Notification) => {
    setNotificationToEditSchedule(notification);
    setIsEditScheduleModalOpen(true);
  };

  const handleEditScheduleSuccess = () => {
    loadNotifications();
    if (activeTab === 'scheduled') {
      loadScheduledNotifications();
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'scheduled') {
      return scheduledNotifications;
    }
    
    if (activeTab === 'pending') {
      return allNotifications.filter(n => (n.status || 'pending').toLowerCase() === 'pending');
    }
    
    if (activeTab === 'sent') {
      return allNotifications.filter(n => (n.status || '').toLowerCase() === 'sent');
    }
    
    // 'all' tab
    return allNotifications;
  }, [activeTab, allNotifications, scheduledNotifications]);

  const handleDelete = async (notification: Notification) => {
    if (!window.confirm(`Are you sure you want to delete "${notification.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(notification.id);
      await deleteNotification(notification.id);
      showToast('Notification deleted successfully', 'success');
      await loadNotifications();
    } catch (error) {
      showToast('Failed to delete notification', 'error');
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const getStatusBadge = (status?: string) => {
    const statusLower = (status || 'pending').toLowerCase();
    
    if (statusLower === 'sent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Sent
        </span>
      );
    }
    
    if (statusLower === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          Pending
        </span>
      );
    }
    
    // Default/unknown status
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
        {statusLower.charAt(0).toUpperCase() + statusLower.slice(1)}
      </span>
    );
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'pending', label: 'Pending' },
    { id: 'sent', label: 'Sent' },
  ];

  return (
    <>
      <div className="min-h-screen pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-gray-600">View and manage all notifications</p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Schedule Notification
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-apple-blue'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-apple-blue"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400 mt-2">
                {activeTab === 'scheduled' 
                  ? 'No scheduled notifications'
                  : activeTab === 'pending'
                  ? 'No pending notifications'
                  : activeTab === 'sent'
                  ? 'No sent notifications'
                  : 'Notifications will appear here once they\'re created'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all relative"
                >
                  <button
                    onClick={() => handleDelete(notification)}
                    disabled={deletingId === notification.id}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Delete notification"
                  >
                    {deletingId === notification.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex items-start justify-between gap-4 pr-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {getStatusBadge(notification.status)}
                      </div>
                      <p className="text-gray-600 mb-3">
                        {truncateText(notification.body, 100)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Created: {formatDate(notification.createdAt)}</span>
                        {notification.sendAt && (notification.status === 'pending' || !notification.status) && (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Scheduled: {formatDate(notification.sendAt)}
                            </span>
                            <button
                              onClick={() => handleEditSchedule(notification)}
                              className="p-1 text-gray-400 hover:text-apple-blue transition-colors rounded hover:bg-blue-50"
                              title="Edit or cancel schedule"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleView(notification)}
                        className="px-4 py-2 text-apple-blue hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center gap-2 w-full sm:w-auto"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleSend(notification)}
                        className="px-4 py-2 bg-apple-blue text-white hover:bg-blue-600 rounded-lg transition-colors font-medium flex items-center gap-2 w-full sm:w-auto"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NotificationModal
        notification={selectedNotification}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onResend={() => selectedNotification && handleSend(selectedNotification)}
        isResending={false}
      />

      <SendNotificationModal
        notification={notificationToSend}
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={handleSendSuccess}
      />

      <ScheduleNotificationModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />

      <EditScheduleModal
        notification={notificationToEditSchedule}
        isOpen={isEditScheduleModalOpen}
        onClose={() => setIsEditScheduleModalOpen(false)}
        onSuccess={handleEditScheduleSuccess}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </>
  );
};

export default Dashboard;

