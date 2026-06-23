import { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Loader2,
  Calendar,
  CalendarDays,
  LayoutList,
  Plus,
  Pencil,
  Copy,
  Search,
  Megaphone,
  Clock,
  CheckCircle2,
  FileEdit,
} from 'lucide-react';
import {
  fetchNotifications,
  Notification,
  deleteNotification,
  duplicateNotification,
  updateOrCancelScheduledNotification,
} from '../lib/api';
import { formatDate, truncateText } from '../lib/utils';
import {
  filterByTab,
  getStatusConfig,
  formatUserGroup,
  canEditContent,
  canSend,
  canSchedule,
  canEditSchedule,
  normalizeStatus,
  getTotalRecipientCount,
  formatRecipientCount,
} from '../lib/notificationUtils';
import SendNotificationModal from '../components/SendNotificationModal';
import ScheduleNotificationModal from '../components/ScheduleNotificationModal';
import EditScheduleModal from '../components/EditScheduleModal';
import EditNotificationModal from '../components/EditNotificationModal';
import NotificationDetailModal from '../components/NotificationDetailModal';
import CreateCampaignModal from '../components/CreateCampaignModal';
import DuplicateSuccessModal from '../components/DuplicateSuccessModal';
import LoadingButton from '../components/LoadingButton';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import CampaignCalendar from '../components/CampaignCalendar';

type TabType = 'all' | 'drafts' | 'scheduled' | 'sent';
type ViewMode = 'list' | 'calendar';

const TABS: { id: TabType; label: string; icon: typeof Megaphone }[] = [
  { id: 'all', label: 'All', icon: Megaphone },
  { id: 'drafts', label: 'Drafts', icon: FileEdit },
  { id: 'scheduled', label: 'Scheduled', icon: Clock },
  { id: 'sent', label: 'Sent', icon: CheckCircle2 },
];

const Campaigns = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notificationToSend, setNotificationToSend] = useState<Notification | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulePreselect, setSchedulePreselect] = useState<Notification | null>(null);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [notificationToEditSchedule, setNotificationToEditSchedule] = useState<Notification | null>(null);
  const [notificationToEdit, setNotificationToEdit] = useState<Notification | null>(null);
  const [isEditNotificationModalOpen, setIsEditNotificationModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [duplicatedDraft, setDuplicatedDraft] = useState<Notification | null>(null);
  const [isDuplicateSuccessOpen, setIsDuplicateSuccessOpen] = useState(false);
  const [editFromDuplicate, setEditFromDuplicate] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      if (hasLoadedOnce) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      setHasLoadedOnce(true);
    } catch {
      setNotifications([]);
      showToast('Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const filteredNotifications = useMemo(() => {
    let list = filterByTab(notifications, activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, activeTab, searchQuery]);

  const tabCounts = useMemo(() => ({
    all: notifications.length,
    drafts: filterByTab(notifications, 'drafts').length,
    scheduled: filterByTab(notifications, 'scheduled').length,
    sent: filterByTab(notifications, 'sent').length,
  }), [notifications]);

  const calendarNotifications = useMemo(() => {
    let list = filterByTab(notifications, 'scheduled');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notifications, searchQuery]);

  const handleRefresh = () => loadNotifications();

  const isPageActionPending =
    duplicatingId !== null || deletingId !== null || reschedulingId !== null;

  const handleCalendarReschedule = async (notificationId: string, sendAt: string) => {
    const previous = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, sendAt } : n))
    );
    try {
      setReschedulingId(notificationId);
      await updateOrCancelScheduledNotification({
        notificationId,
        updates: { sendAt },
      });
      showToast('Campaign rescheduled', 'success');
    } catch {
      if (previous) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? previous : n))
        );
      }
      showToast('Failed to reschedule campaign', 'error');
    } finally {
      setReschedulingId(null);
    }
  };

  const openScheduleModal = (notification?: Notification | null) => {
    setSchedulePreselect(notification ?? null);
    setIsScheduleModalOpen(true);
  };

  const openDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
  };

  const handleSend = (notification: Notification) => {
    setIsDetailOpen(false);
    setNotificationToSend(notification);
    setIsSendModalOpen(true);
  };

  const handleSchedule = (notification: Notification) => {
    setIsDetailOpen(false);
    openScheduleModal(notification);
  };

  const handleEditSchedule = (notification: Notification) => {
    setIsDetailOpen(false);
    setNotificationToEditSchedule(notification);
    setIsEditScheduleModalOpen(true);
  };

  const handleEdit = (notification: Notification, fromDuplicate = false) => {
    setIsDetailOpen(false);
    setEditFromDuplicate(fromDuplicate);
    setNotificationToEdit(notification);
    setIsEditNotificationModalOpen(true);
  };

  const handleDuplicateEdit = (notification: Notification) => {
    setIsDuplicateSuccessOpen(false);
    setDuplicatedDraft(null);
    handleEdit(notification, true);
  };

  const handleKeepDuplicateAsDraft = () => {
    setIsDuplicateSuccessOpen(false);
    setDuplicatedDraft(null);
  };

  const handleSavedAndSchedule = async (notificationId: string) => {
    setEditFromDuplicate(false);
    setActiveTab('drafts');
    try {
      setIsRefreshing(true);
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      setHasLoadedOnce(true);
      const draft = data.find((n) => n.id === notificationId);
      if (draft) openScheduleModal(draft);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDuplicate = async (notification: Notification) => {
    try {
      setDuplicatingId(notification.id);
      const result = await duplicateNotification(notification.id);
      setIsDetailOpen(false);
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      setActiveTab('drafts');
      if (result.id) {
        const copy = data.find((n) => n.id === result.id);
        if (copy) {
          setDuplicatedDraft(copy);
          setIsDuplicateSuccessOpen(true);
        }
      }
    } catch {
      showToast('Failed to duplicate campaign', 'error');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (!window.confirm(`Delete "${notification.title}"? This cannot be undone.`)) return;
    try {
      setDeletingId(notification.id);
      await deleteNotification(notification.id);
      showToast('Campaign deleted', 'success');
      setIsDetailOpen(false);
      await loadNotifications();
    } catch {
      showToast('Failed to delete campaign', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getDateLabel = (notification: Notification, status: ReturnType<typeof normalizeStatus>) => {
    if (status === 'scheduled' && notification.sendAt) {
      return { label: 'Scheduled', value: formatDate(notification.sendAt), className: 'text-accent' };
    }
    if (status === 'sent' && notification.lastSentAt) {
      return { label: 'Sent', value: formatDate(notification.lastSentAt), className: 'text-green-600' };
    }
    return { label: 'Created', value: formatDate(notification.createdAt), className: 'text-gray-500' };
  };

  return (
    <>
      <PageLayout
        title="Campaigns"
        description="Create and manage push notification campaigns"
        actions={
          <>
            <button
              onClick={() => openScheduleModal()}
              disabled={isPageActionPending}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isPageActionPending}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </>
        }
      >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={viewMode === 'calendar' ? 'Search scheduled campaigns...' : 'Search campaigns...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 bg-surface-muted rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-accent shadow-sm'
                      : 'text-gray-500 hover:text-ink'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-accent shadow-sm'
                      : 'text-gray-500 hover:text-ink'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </button>
              </div>
              {viewMode === 'list' && (
                <div className="flex gap-1 border-b border-gray-200 lg:border-0 lg:pb-0">
                  {TABS.map((tab) => {
                    const count = tabCounts[tab.id];
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                          isActive
                            ? 'border-accent text-accent'
                            : 'border-transparent text-gray-500 hover:text-ink-light'
                        }`}
                      >
                        {tab.label}
                        <span className={`ml-1.5 text-xs ${isActive ? 'text-accent/70' : 'text-gray-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="relative">
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
              )}
              <CampaignCalendar
                notifications={calendarNotifications}
                reschedulingId={reschedulingId}
                onReschedule={handleCalendarReschedule}
                onSelect={openDetail}
                onError={(message) => showToast(message, 'error')}
              />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-7 h-7 text-accent" />
              </div>
              <p className="text-ink font-semibold text-lg">
                {searchQuery ? 'No matching campaigns' : `No ${activeTab === 'all' ? '' : activeTab} campaigns yet`}
              </p>
              <p className="text-gray-400 mt-2 text-sm max-w-sm mx-auto">
                {activeTab === 'drafts' || activeTab === 'all'
                  ? 'Create your first push notification campaign to get started.'
                  : activeTab === 'scheduled'
                  ? 'Schedule a draft campaign to send it later.'
                  : 'Sent campaigns will appear here with delivery history.'}
              </p>
              {(activeTab === 'all' || activeTab === 'drafts') && !searchQuery && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create campaign
                  </button>
                  <button
                    onClick={() => openScheduleModal()}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule draft
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden relative">
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-surface-muted/60">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[36%]">
                        Campaign
                      </th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Audience
                      </th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Recipients
                      </th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredNotifications.map((notification) => {
                      const statusConfig = getStatusConfig(notification.status);
                      const status = normalizeStatus(notification.status);
                      const dateInfo = getDateLabel(notification, status);
                      const recipientCount = getTotalRecipientCount(notification);

                      return (
                        <tr
                          key={notification.id}
                          onClick={() => openDetail(notification)}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors line-clamp-1">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {truncateText(notification.body, 80)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-600 bg-surface-muted px-2.5 py-1 rounded-full whitespace-nowrap">
                              {formatUserGroup(notification.userGroup)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${statusConfig.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {recipientCount !== null ? (
                              <span className="text-sm font-semibold text-ink tabular-nums">
                                {formatRecipientCount(recipientCount)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-xs text-gray-400">{dateInfo.label}</p>
                            <p className={`text-sm font-medium mt-0.5 ${dateInfo.className}`}>
                              {dateInfo.value}
                            </p>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {canEditContent(notification) && (
                                <button
                                  onClick={() => handleEdit(notification)}
                                  disabled={isPageActionPending}
                                  className="px-2.5 py-1.5 text-gray-500 hover:text-accent hover:bg-accent-light rounded-lg transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                              )}
                              {canSchedule(notification) && (
                                <button
                                  onClick={() => handleSchedule(notification)}
                                  disabled={isPageActionPending}
                                  className="px-2.5 py-1.5 text-gray-600 hover:text-accent hover:bg-accent-light rounded-lg transition-colors text-xs font-medium flex items-center gap-1 border border-gray-200 disabled:opacity-50"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  Schedule
                                </button>
                              )}
                              {canEditSchedule(notification) && (
                                <button
                                  onClick={() => handleEditSchedule(notification)}
                                  disabled={isPageActionPending}
                                  className="px-2.5 py-1.5 text-gray-600 hover:text-accent hover:bg-accent-light rounded-lg transition-colors text-xs font-medium flex items-center gap-1 border border-gray-200 disabled:opacity-50"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Reschedule
                                </button>
                              )}
                              {status === 'sent' && (
                                <LoadingButton
                                  variant="outline-sm"
                                  onClick={() => handleDuplicate(notification)}
                                  loading={duplicatingId === notification.id}
                                  loadingText="Duplicating..."
                                  disabled={isPageActionPending && duplicatingId !== notification.id}
                                  icon={<Copy className="w-3.5 h-3.5" />}
                                  className="!px-2.5 !py-1.5 !text-gray-500 hover:!text-ink hover:!bg-gray-100 !border-0"
                                >
                                  Duplicate
                                </LoadingButton>
                              )}
                              {canSend(notification) && (
                                <LoadingButton
                                  variant="accent-sm"
                                  onClick={() => handleSend(notification)}
                                  disabled={isPageActionPending}
                                  icon={<Send className="w-3.5 h-3.5" />}
                                >
                                  Send
                                </LoadingButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </PageLayout>

      <DuplicateSuccessModal
        notification={duplicatedDraft}
        isOpen={isDuplicateSuccessOpen}
        onClose={handleKeepDuplicateAsDraft}
        onEdit={handleDuplicateEdit}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
        onSavedAndSchedule={handleSavedAndSchedule}
      />

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSend={handleSend}
        onEdit={handleEdit}
        onSchedule={handleSchedule}
        onEditSchedule={handleEditSchedule}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        isDuplicating={duplicatingId === selectedNotification?.id}
        isDeleting={deletingId === selectedNotification?.id}
        isActionPending={duplicatingId !== null || deletingId !== null}
      />

      <SendNotificationModal
        notification={notificationToSend}
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <ScheduleNotificationModal
        isOpen={isScheduleModalOpen}
        preselectedNotification={schedulePreselect}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSchedulePreselect(null);
        }}
        onSuccess={handleRefresh}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      <EditScheduleModal
        notification={notificationToEditSchedule}
        isOpen={isEditScheduleModalOpen}
        onClose={() => setIsEditScheduleModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <EditNotificationModal
        notification={notificationToEdit}
        isOpen={isEditNotificationModalOpen}
        onClose={() => {
          setIsEditNotificationModalOpen(false);
          setNotificationToEdit(null);
          setEditFromDuplicate(false);
        }}
        onSuccess={handleRefresh}
        onSavedAndSchedule={handleSavedAndSchedule}
        showGuidanceBanner={editFromDuplicate}
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

export default Campaigns;
