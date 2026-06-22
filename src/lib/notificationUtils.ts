import { Notification } from './api';

export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled' | 'error';

const STATUS_ALIASES: Record<string, NotificationStatus> = {
  inactive: 'draft',
  pending: 'scheduled',
  draft: 'draft',
  scheduled: 'scheduled',
  sent: 'sent',
  cancelled: 'cancelled',
  error: 'error',
};

export function normalizeStatus(status?: string): NotificationStatus {
  if (!status) return 'draft';
  return STATUS_ALIASES[status.toLowerCase()] ?? 'draft';
}

export function formatUserGroup(userGroup?: string): string {
  if (!userGroup?.trim()) return 'All Users';
  const lower = userGroup.toLowerCase();
  if (lower === 'allusers' || lower === 'all') return 'All Users';
  return userGroup.trim();
}

export function canEditContent(notification: Notification): boolean {
  const status = normalizeStatus(notification.status);
  return status === 'draft' || status === 'cancelled';
}

export function canSend(notification: Notification): boolean {
  const status = normalizeStatus(notification.status);
  return status === 'draft' || status === 'scheduled' || status === 'cancelled';
}

export function canSchedule(notification: Notification): boolean {
  if (!notification.id || notification.id.startsWith('notification-')) return false;
  const status = normalizeStatus(notification.status);
  return (status === 'draft' || status === 'cancelled') && !notification.sendAt;
}

export function canEditSchedule(notification: Notification): boolean {
  const status = normalizeStatus(notification.status);
  return status === 'scheduled' && !!notification.sendAt;
}

export function canDuplicate(notification: Notification): boolean {
  const status = normalizeStatus(notification.status);
  return status === 'sent' || status === 'error';
}

export function isResend(notification: Notification): boolean {
  return normalizeStatus(notification.status) === 'sent' || (notification.sendCount ?? 0) > 0;
}

export function isSchedulable(notification: Notification): boolean {
  return canSchedule(notification);
}

export interface StatusConfig {
  label: string;
  dotClass: string;
  badgeClass: string;
}

export function getStatusConfig(status?: string): StatusConfig {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case 'sent':
      return {
        label: 'Sent',
        dotClass: 'bg-green-500',
        badgeClass: 'bg-green-50 text-green-700 border-green-200',
      };
    case 'scheduled':
      return {
        label: 'Scheduled',
        dotClass: 'bg-blue-500',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        dotClass: 'bg-gray-400',
        badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
      };
    case 'error':
      return {
        label: 'Failed',
        dotClass: 'bg-red-500',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
      };
    default:
      return {
        label: 'Draft',
        dotClass: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
  }
}

export function filterByTab(notifications: Notification[], tab: 'all' | 'drafts' | 'scheduled' | 'sent'): Notification[] {
  if (tab === 'all') return notifications;

  if (tab === 'drafts') {
    return notifications.filter((n) => {
      const status = normalizeStatus(n.status);
      return status === 'draft' || status === 'cancelled';
    });
  }

  if (tab === 'scheduled') {
    return notifications.filter((n) => normalizeStatus(n.status) === 'scheduled');
  }

  if (tab === 'sent') {
    return notifications.filter((n) => normalizeStatus(n.status) === 'sent' || normalizeStatus(n.status) === 'error');
  }

  return notifications;
}

export function getTotalRecipientCount(notification: Notification): number | null {
  const history = notification.sendHistory ?? [];
  if (history.length > 0) {
    const total = history.reduce((sum, entry) => sum + (entry.recipientCount ?? 0), 0);
    if (total > 0) return total;
  }

  const status = normalizeStatus(notification.status);
  if (status === 'sent' && notification.targetTokens?.length) {
    return notification.targetTokens.length;
  }

  return null;
}

export function formatRecipientCount(count: number | null): string {
  if (count === null) return '—';
  return count.toLocaleString();
}

export function getTriggerLabel(trigger?: string): string {
  switch (trigger) {
    case 'resend':
      return 'Resent';
    case 'scheduled':
      return 'Scheduled send';
    case 'scheduled-early':
      return 'Sent early (was scheduled)';
    case 'manual':
      return 'Manual send';
    default:
      return trigger || 'Send';
  }
}
