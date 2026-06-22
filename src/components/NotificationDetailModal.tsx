import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Copy,
  Calendar,
  Trash2,
  Pencil,
  Clock,
  Users,
  History,
} from 'lucide-react';
import { Notification } from '../lib/api';
import { formatDate } from '../lib/utils';
import LoadingButton from './LoadingButton';
import ModalBusyOverlay from './ModalBusyOverlay';
import {
  getStatusConfig,
  formatUserGroup,
  canEditContent,
  canSend,
  canSchedule,
  canEditSchedule,
  canDuplicate,
  getTriggerLabel,
  normalizeStatus,
} from '../lib/notificationUtils';

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (notification: Notification) => void;
  onEdit: (notification: Notification) => void;
  onSchedule: (notification: Notification) => void;
  onEditSchedule: (notification: Notification) => void;
  onDuplicate: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
  isDuplicating?: boolean;
  isDeleting?: boolean;
  isActionPending?: boolean;
}

const NotificationDetailModal = ({
  notification,
  isOpen,
  onClose,
  onSend,
  onEdit,
  onSchedule,
  onEditSchedule,
  onDuplicate,
  onDelete,
  isDuplicating = false,
  isDeleting = false,
  isActionPending = false,
}: NotificationDetailModalProps) => {
  if (!notification) return null;

  const statusConfig = getStatusConfig(notification.status);
  const status = normalizeStatus(notification.status);
  const history = [...(notification.sendHistory ?? [])].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
              <ModalBusyOverlay
                show={isActionPending}
                label={isDuplicating ? 'Duplicating campaign...' : isDeleting ? 'Deleting campaign...' : 'Working...'}
              />
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                      {statusConfig.label}
                    </span>
                    {(notification.sendCount ?? 0) > 0 && (
                      <span className="text-xs text-gray-500">
                        Sent {notification.sendCount} time{notification.sendCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{notification.title}</h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isActionPending}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Message</p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{notification.body}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Audience</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{formatUserGroup(notification.userGroup)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Created</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(notification.createdAt)}</p>
                  </div>
                  {notification.sendAt && status === 'scheduled' && (
                    <div className="bg-blue-50 rounded-xl p-4 col-span-2">
                      <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Scheduled for</span>
                      </div>
                      <p className="text-sm font-medium text-blue-900">{formatDate(notification.sendAt)}</p>
                    </div>
                  )}
                  {notification.lastSentAt && (
                    <div className="bg-green-50 rounded-xl p-4 col-span-2">
                      <div className="flex items-center gap-2 text-green-500 mb-1">
                        <Send className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Last sent</span>
                      </div>
                      <p className="text-sm font-medium text-green-900">{formatDate(notification.lastSentAt)}</p>
                    </div>
                  )}
                </div>

                {history.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <History className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Send history</p>
                    </div>
                    <div className="space-y-2">
                      {history.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getTriggerLabel(entry.trigger)}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(entry.sentAt)} · {formatUserGroup(entry.userGroup)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {entry.recipientCount ?? 0} recipients
                            </p>
                            {(entry.failureCount ?? 0) > 0 ? (
                              <p className="text-xs text-red-500">
                                {entry.failureCount} failed
                              </p>
                            ) : (
                              <p className="text-xs text-green-600">Delivered</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {status === 'sent' && (
                  <div className="bg-accent-light border border-accent/20 rounded-xl p-4">
                    <p className="text-sm text-accent-hover">
                      This campaign has been sent. To send a similar message again, use <strong>Duplicate</strong> to create a new draft.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
                <LoadingButton
                  variant="danger"
                  onClick={() => onDelete(notification)}
                  loading={isDeleting}
                  loadingText="Deleting..."
                  disabled={isActionPending && !isDeleting}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </LoadingButton>
                <div className="flex flex-wrap items-center gap-2">
                  {canDuplicate(notification) && (
                    <LoadingButton
                      variant="secondary"
                      onClick={() => onDuplicate(notification)}
                      loading={isDuplicating}
                      loadingText="Duplicating..."
                      disabled={isActionPending && !isDuplicating}
                      icon={<Copy className="w-4 h-4" />}
                      className="!rounded-lg !text-sm"
                    >
                      Duplicate
                    </LoadingButton>
                  )}
                  {canEditSchedule(notification) && (
                    <LoadingButton
                      variant="secondary"
                      onClick={() => onEditSchedule(notification)}
                      disabled={isActionPending}
                      icon={<Calendar className="w-4 h-4" />}
                      className="!rounded-lg !text-sm"
                    >
                      Edit Schedule
                    </LoadingButton>
                  )}
                  {canSchedule(notification) && (
                    <LoadingButton
                      variant="secondary"
                      onClick={() => onSchedule(notification)}
                      disabled={isActionPending}
                      icon={<Calendar className="w-4 h-4" />}
                      className="!rounded-lg !text-sm"
                    >
                      Schedule
                    </LoadingButton>
                  )}
                  {canEditContent(notification) && (
                    <LoadingButton
                      variant="secondary"
                      onClick={() => onEdit(notification)}
                      disabled={isActionPending}
                      icon={<Pencil className="w-4 h-4" />}
                      className="!rounded-lg !text-sm"
                    >
                      Edit
                    </LoadingButton>
                  )}
                  {canSend(notification) && (
                    <LoadingButton
                      variant="primary"
                      onClick={() => onSend(notification)}
                      disabled={isActionPending}
                      icon={<Send className="w-4 h-4" />}
                      className="!rounded-lg !text-sm !px-4 !py-2"
                    >
                      Send Now
                    </LoadingButton>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDetailModal;
