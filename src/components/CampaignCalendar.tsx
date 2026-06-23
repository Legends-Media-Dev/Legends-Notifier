import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Clock, GripVertical, Loader2 } from 'lucide-react';
import { Notification } from '../lib/api';
import { formatUserGroup, normalizeStatus } from '../lib/notificationUtils';
import { truncateText } from '../lib/utils';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateKeyLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function reschedulePreserveTime(sendAt: string, targetDateKey: string): string {
  const original = new Date(sendAt);
  const [year, month, day] = targetDateKey.split('-').map(Number);
  const updated = new Date(original);
  updated.setFullYear(year, month - 1, day);
  return updated.toISOString();
}

function getCalendarDays(viewYear: number, viewMonth: number) {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      dateKey: formatDateKeyLocal(date),
      inMonth: date.getMonth() === viewMonth,
    };
  });
}

interface CampaignCalendarProps {
  notifications: Notification[];
  reschedulingId?: string | null;
  onReschedule: (notificationId: string, sendAt: string) => Promise<void>;
  onSelect: (notification: Notification) => void;
  onError: (message: string) => void;
}

function DraggableCampaignChip({
  notification,
  isRescheduling,
  onSelect,
}: {
  notification: Notification;
  isRescheduling: boolean;
  onSelect: (notification: Notification) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: notification.id,
    data: { notification },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(notification)}
      className={`w-full text-left rounded-lg border px-2 py-1.5 transition-all group ${
        isDragging
          ? 'opacity-40 border-accent/30 bg-accent-light/50'
          : 'border-accent/20 bg-accent-light/80 hover:bg-accent-light hover:border-accent/40 hover:shadow-sm'
      } ${isRescheduling ? 'pointer-events-none opacity-60' : ''}`}
    >
      <div className="flex items-start gap-1.5">
        <span
          {...listeners}
          {...attributes}
          className="mt-0.5 text-accent/50 hover:text-accent cursor-grab active:cursor-grabbing shrink-0 touch-none"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reschedule"
        >
          <GripVertical className="w-3 h-3" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-ink leading-tight line-clamp-2">
            {notification.title}
          </p>
          <p className="text-[10px] text-accent font-medium mt-0.5 flex items-center gap-1">
            {isRescheduling ? (
              <>
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Clock className="w-2.5 h-2.5" />
                {notification.sendAt ? formatTimeLabel(notification.sendAt) : '—'}
              </>
            )}
          </p>
        </div>
      </div>
    </button>
  );
}

function CampaignDragPreview({ notification }: { notification: Notification }) {
  return (
    <div className="rounded-xl border border-accent/30 bg-white shadow-card-hover px-3 py-2.5 w-[200px] cursor-grabbing">
      <p className="text-xs font-semibold text-ink line-clamp-2">{notification.title}</p>
      <p className="text-[10px] text-accent font-medium mt-1 flex items-center gap-1">
        <Clock className="w-2.5 h-2.5" />
        {notification.sendAt ? formatTimeLabel(notification.sendAt) : '—'}
      </p>
      <p className="text-[10px] text-gray-400 mt-1">{formatUserGroup(notification.userGroup)}</p>
    </div>
  );
}

function CalendarDayCell({
  date,
  dateKey,
  inMonth,
  isToday,
  campaigns,
  reschedulingId,
  onSelect,
}: {
  date: Date;
  dateKey: string;
  inMonth: boolean;
  isToday: boolean;
  campaigns: Notification[];
  reschedulingId?: string | null;
  onSelect: (notification: Notification) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dateKey}` });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] border-r border-b border-gray-100 p-1.5 flex flex-col transition-colors ${
        inMonth ? 'bg-white' : 'bg-surface-muted/40'
      } ${isToday ? 'ring-2 ring-inset ring-accent/30 bg-accent-light/20' : ''} ${
        isOver ? 'bg-accent-light/60 ring-2 ring-inset ring-accent/50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span
          className={`text-xs font-semibold tabular-nums ${
            isToday
              ? 'w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[11px]'
              : inMonth
                ? 'text-ink'
                : 'text-gray-300'
          }`}
        >
          {date.getDate()}
        </span>
        {campaigns.length > 0 && (
          <span className="text-[10px] font-medium text-accent bg-accent-light px-1.5 py-0.5 rounded-full">
            {campaigns.length}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto max-h-[88px] scrollbar-thin">
        {campaigns.map((notification) => (
          <DraggableCampaignChip
            key={notification.id}
            notification={notification}
            isRescheduling={reschedulingId === notification.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

const CampaignCalendar = ({
  notifications,
  reschedulingId,
  onReschedule,
  onSelect,
  onError,
}: CampaignCalendarProps) => {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [activeDrag, setActiveDrag] = useState<Notification | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const scheduledCampaigns = useMemo(
    () =>
      notifications.filter(
        (n) => normalizeStatus(n.status) === 'scheduled' && n.sendAt
      ),
    [notifications]
  );

  const campaignsByDay = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const notification of scheduledCampaigns) {
      if (!notification.sendAt) continue;
      const key = formatDateKeyLocal(new Date(notification.sendAt));
      const list = map.get(key) ?? [];
      list.push(notification);
      map.set(key, list);
    }
    map.forEach((list, key) => {
      list.sort(
        (a, b) =>
          new Date(a.sendAt!).getTime() - new Date(b.sendAt!).getTime()
      );
      map.set(key, list);
    });
    return map;
  }, [scheduledCampaigns]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthLabel = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const todayKey = formatDateKeyLocal(new Date());

  const monthScheduledCount = useMemo(() => {
    return scheduledCampaigns.filter((n) => {
      if (!n.sendAt) return false;
      const d = new Date(n.sendAt);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    }).length;
  }, [scheduledCampaigns, viewYear, viewMonth]);

  const goToPrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const handleDragStart = (event: DragStartEvent) => {
    const notification = event.active.data.current?.notification as Notification | undefined;
    if (notification) setActiveDrag(notification);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const notification = active.data.current?.notification as Notification | undefined;
    if (!notification?.sendAt) return;

    const overId = String(over.id);
    if (!overId.startsWith('day-')) return;

    const targetDateKey = overId.replace('day-', '');
    const sourceDateKey = formatDateKeyLocal(new Date(notification.sendAt));
    if (targetDateKey === sourceDateKey) return;

    const newSendAt = reschedulePreserveTime(notification.sendAt, targetDateKey);
    if (new Date(newSendAt).getTime() <= Date.now()) {
      onError('Scheduled time must be in the future. Pick a later day or edit the time.');
      return;
    }

    await onReschedule(notification.id, newSendAt);
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
  };

  return (
    <div className="page-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-ink">Schedule calendar</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {monthScheduledCount} scheduled this month · drag campaigns to a new day to reschedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="btn-secondary !py-2 !px-3 text-xs"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-surface-muted rounded-xl p-1">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-white text-gray-500 hover:text-ink transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-ink min-w-[140px] text-center px-2">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-white text-gray-500 hover:text-ink transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {scheduledCampaigns.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-accent" />
          </div>
          <p className="font-medium text-ink">No scheduled campaigns</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Schedule a draft campaign and it will appear here on its send date.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="border-b border-gray-100 grid grid-cols-7 bg-surface-muted/60">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100 last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, dateKey, inMonth }) => (
              <CalendarDayCell
                key={dateKey}
                date={date}
                dateKey={dateKey}
                inMonth={inMonth}
                isToday={dateKey === todayKey}
                campaigns={campaignsByDay.get(dateKey) ?? []}
                reschedulingId={reschedulingId}
                onSelect={onSelect}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDrag ? <CampaignDragPreview notification={activeDrag} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {scheduledCampaigns.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-surface-muted/30 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-accent-light border border-accent/30" />
            Scheduled campaign
          </span>
          <span className="flex items-center gap-1.5">
            <GripVertical className="w-3 h-3 text-accent/60" />
            Drag to another day (keeps the same send time)
          </span>
          <span>Click a campaign for details</span>
        </div>
      )}

      {activeDrag && (
        <p className="sr-only">
          Moving {truncateText(activeDrag.title, 40)}
        </p>
      )}
    </div>
  );
};

export default CampaignCalendar;
