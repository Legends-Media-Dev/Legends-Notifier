import axios from 'axios';
import { normalizeStatus } from './notificationUtils';
import { setDashboardCache } from './dashboardCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface SendHistoryEntry {
  id: string;
  sentAt: string;
  sentBy?: string;
  trigger?: 'manual' | 'resend' | 'scheduled' | 'scheduled-early';
  userGroup?: string;
  recipientCount?: number;
  successCount?: number;
  failureCount?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  targetTokens?: string[];
  status?: string;
  sendAt?: string;
  userGroup?: string;
  sendCount?: number;
  lastSentAt?: string;
  sendHistory?: SendHistoryEntry[];
  duplicatedFrom?: string;
}

export interface User {
  id?: string;
  userId?: string;
  email?: string;
  brand?: string;
  modelName?: string;
  platform?: string;
  osVersion?: string;
  token?: string;
  updatedAt?: string;
  groups?: string[] | { id?: string; name?: string }[];
}

function transformNotification(notif: any): Notification {
  const status = normalizeStatus(notif.status);
  return {
    id: notif.id || notif.docId || '',
    title: notif.title || '',
    body: notif.body || '',
    data: notif.data || {},
    createdAt: notif.createdAt || notif.created_at || '',
    updatedAt: notif.updatedAt,
    createdBy: notif.createdBy || 'admin',
    targetTokens: notif.targetTokens || [],
    status,
    sendAt: notif.sendAt || undefined,
    userGroup: notif.userGroup || undefined,
    sendCount: notif.sendCount ?? (notif.executedAt ? 1 : 0),
    lastSentAt: notif.lastSentAt || notif.executedAt || undefined,
    sendHistory: Array.isArray(notif.sendHistory) ? notif.sendHistory : [],
    duplicatedFrom: notif.duplicatedFrom,
  };
}

export interface UserGroup {
  id: string;
  name?: string;
  metaName?: string;
  tokens?: string[];
  [key: string]: any;
}

export interface SaveNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  targetTokens?: string[];
  userGroup?: string;
  createdBy?: string;
  sendAt?: string; // ISO date string for scheduled notifications
  status?: string;
}

export interface SaveNotificationResponse {
  success: boolean;
  id: string;
  message: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get('/fetchUsersHandler');
    // Handle different response structures
    const data = response.data;
    
    // If data is already an array, return it
    if (Array.isArray(data)) {
      return data;
    }
    
    // If data is an object with a users array property
    if (data && typeof data === 'object' && Array.isArray(data.users)) {
      return data.users;
    }
    
    // If data is an object with a data array property
    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return data.data;
    }
    
    // If no array found, return empty array
    console.warn('Unexpected response format from fetchUsersHandler:', data);
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return empty array on error instead of throwing
    return [];
  }
};

export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get('/fetchNotificationsHandler');
    // Handle different response structures
    const data = response.data;
    
    let notifications: any[] = [];
    
    // If data is already an array, use it
    if (Array.isArray(data)) {
      notifications = data;
    }
    // If data is an object with a notifications array property
    else if (data && typeof data === 'object' && Array.isArray(data.notifications)) {
      notifications = data.notifications;
    }
    // If data is an object with a data array property
    else if (data && typeof data === 'object' && Array.isArray(data.data)) {
      notifications = data.data;
    }
    else {
      console.warn('Unexpected response format from fetchNotiHandler:', data);
      return [];
    }
    
    return notifications
      .map((notif) => transformNotification(notif))
      .filter((n) => n.id);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const fetchScheduledNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get('/fetchScheduledNotificationsHandler');
    const data = response.data;
    
    let notifications: any[] = [];
    
    // Handle response structure
    if (data && typeof data === 'object' && Array.isArray(data.notifications)) {
      notifications = data.notifications;
    } else if (Array.isArray(data)) {
      notifications = data;
    } else {
      console.warn('Unexpected response format from fetchScheduledNotificationsHandler:', data);
      return [];
    }
    
    return notifications
      .map((notif) => transformNotification(notif))
      .filter((n) => n.id);
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    return [];
  }
};

export const fetchUserGroups = async (): Promise<UserGroup[]> => {
  try {
    const response = await api.get('/fetchUserGroupsHandler');
    const data = response.data;
    
    // Handle response structure
    if (data && typeof data === 'object' && Array.isArray(data.groups)) {
      return data.groups;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('Unexpected response format from fetchUserGroupsHandler:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
};

export const saveNotification = async (payload: SaveNotificationPayload): Promise<SaveNotificationResponse> => {
  try {
    const response = await api.post('/saveNotificationHandler', payload);
    return response.data;
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
};

export interface ExecuteNotificationPayload {
  notificationId?: string;
  targetTokens: string[];
  title?: string;
  body?: string;
  data?: Record<string, any>;
  sentBy?: string;
  trigger?: 'manual' | 'resend' | 'scheduled' | 'scheduled-early';
  userGroup?: string;
}

export interface ExecuteNotificationResponse {
  success: boolean;
  message: string;
  sentCount: number;
  successCount?: number;
  failureCount?: number;
  sendHistoryEntry?: SendHistoryEntry;
}

export interface UpdateNotificationPayload {
  notificationId: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  status?: string;
  targetTokens?: string[];
  userGroup?: string;
  sendAt?: string;
  [key: string]: any; // Allow other fields to be updated
}

export interface UpdateNotificationResponse {
  success: boolean;
  message: string;
  updatedFields: Record<string, any>;
}

export const updateNotification = async (payload: UpdateNotificationPayload): Promise<UpdateNotificationResponse> => {
  try {
    const response = await api.patch('/updateNotificationHandler', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
};

export const executeNotification = async (payload: ExecuteNotificationPayload | string): Promise<ExecuteNotificationResponse> => {
  try {
    if (typeof payload === 'string') {
      const response = await api.post('/executeNotificationHandler', { notificationId: payload });
      return response.data;
    }
    const response = await api.post('/executeNotificationHandler', payload);
    return response.data;
  } catch (error) {
    console.error('Error executing notification:', error);
    throw error;
  }
};

export interface DuplicateNotificationResponse {
  success: boolean;
  id: string;
  message: string;
  duplicatedFrom: string;
}

export const duplicateNotification = async (notificationId: string): Promise<DuplicateNotificationResponse> => {
  try {
    const response = await api.post('/duplicateNotificationHandler', { notificationId });
    return response.data;
  } catch (error) {
    console.error('Error duplicating notification:', error);
    throw error;
  }
};

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}

export const deleteNotification = async (notificationId: string): Promise<DeleteNotificationResponse> => {
  try {
    // Backend accepts both DELETE and POST, using POST for consistency
    const response = await api.post('/deleteNotificationHandler', { notificationId });
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export interface UpdateOrCancelScheduledPayload {
  notificationId: string;
  updates: {
    sendAt?: string;
    title?: string;
    body?: string;
    data?: Record<string, any>;
    status?: string;
    [key: string]: any;
  };
}

export interface UpdateOrCancelScheduledResponse {
  success: boolean;
  notificationId: string;
  message: string;
}

export const updateOrCancelScheduledNotification = async (
  payload: UpdateOrCancelScheduledPayload
): Promise<UpdateOrCancelScheduledResponse> => {
  try {
    const response = await api.patch('/updateOrCancelScheduledNotificationHandler', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating/canceling scheduled notification:', error);
    throw error;
  }
};

export interface Segment {
  id: string;
  name: string;
  segmentId: string;
  segmentName: string;
  [key: string]: any; // Allow additional properties from Shopify
}

export const fetchSegments = async (): Promise<Segment[]> => {
  try {
    const response = await axios.get('https://us-central1-premier-ikon.cloudfunctions.net/fetchSegmentNamesHandler');
    const data = response.data;
    
    // Handle the response structure with segmentsWithIds array
    if (data && typeof data === 'object' && Array.isArray(data.segmentsWithIds)) {
      return data.segmentsWithIds.map((segment: any) => ({
        id: segment.id || '',
        name: segment.segmentName || segment.name || '',
        segmentId: segment.segmentId || '',
        segmentName: segment.segmentName || '',
        ...segment,
      }));
    }
    
    // Fallback: If data is already an array
    if (Array.isArray(data)) {
      return data.map((segment, index) => ({
        id: segment.id || segment.segmentId || `segment-${index}`,
        name: segment.segmentName || segment.name || '',
        segmentId: segment.segmentId || '',
        segmentName: segment.segmentName || segment.name || '',
        ...segment,
      }));
    }
    
    // If data is an object with a segments array property
    if (data && typeof data === 'object' && Array.isArray(data.segments)) {
      return data.segments.map((segment: any, index: number) => ({
        id: segment.id || segment.segmentId || `segment-${index}`,
        name: segment.segmentName || segment.name || '',
        segmentId: segment.segmentId || '',
        segmentName: segment.segmentName || segment.name || '',
        ...segment,
      }));
    }
    
    console.warn('Unexpected response format from fetchSegmentNamesHandler:', data);
    return [];
  } catch (error) {
    console.error('Error fetching segments:', error);
    return [];
  }
};

export const syncSegments = async (): Promise<void> => {
  try {
    await axios.get('https://us-central1-premier-ikon.cloudfunctions.net/fetchCustomerSegmentsHandler');
  } catch (error) {
    console.error('Error syncing segments:', error);
    throw error;
  }
};

const GIVEAWAY_FETCH_URL = 'https://us-central1-premier-ikon.cloudfunctions.net/fetchGiveawayInfoHandler';
const GIVEAWAY_PUSH_URL = 'https://us-central1-premier-ikon.cloudfunctions.net/pushGiveawayInfoHandler';

export interface Giveaway {
  id: string;
  entries_multiplier: number;
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
}

export interface FetchGiveawayResponse {
  giveaways: Giveaway[];
  total: number;
}

export interface PushGiveawayPayload {
  giveawayId?: string;
  id?: string;
  start_date?: string;
  end_date?: string;
  entries_multiplier?: number;
}

export interface PushGiveawayResponse {
  id: string;
  created: boolean;
}

export const fetchGiveawayInfo = async (): Promise<Giveaway[]> => {
  try {
    const response = await axios.get<FetchGiveawayResponse>(GIVEAWAY_FETCH_URL);
    const data = response.data;
    if (data?.giveaways && Array.isArray(data.giveaways)) {
      return data.giveaways.map((g: any) => ({
        id: g.id || '',
        entries_multiplier: g.entries_multiplier ?? 1,
        start_date: typeof g.start_date?.toDate === 'function' ? g.start_date.toDate().toISOString() : (g.start_date || ''),
        end_date: typeof g.end_date?.toDate === 'function' ? g.end_date.toDate().toISOString() : (g.end_date || ''),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching giveaway info:', error);
    return [];
  }
};

export const pushGiveawayInfo = async (payload: PushGiveawayPayload, method: 'POST' | 'PUT' = 'POST'): Promise<PushGiveawayResponse> => {
  const response = await axios.request<PushGiveawayResponse>({
    url: GIVEAWAY_PUSH_URL,
    method,
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

export const fetchSegmentUsers = async (segmentId: string): Promise<User[]> => {
  try {
    const response = await axios.get('https://us-central1-premier-ikon.cloudfunctions.net/matchUsersToSegmentsHandler', {
      params: {
        segmentName: segmentId,
      },
    });
    const data = response.data;
    
    // Handle different response structures
    if (Array.isArray(data)) {
      return data;
    }
    
    // If data is an object with a users array property
    if (data && typeof data === 'object' && Array.isArray(data.users)) {
      return data.users;
    }
    
    // If data is an object with a data array property
    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return data.data;
    }
    
    console.warn('Unexpected response format from matchUsersToSegmentsHandler:', data);
    return [];
  } catch (error) {
    console.error('Error fetching segment users:', error);
    return [];
  }
};

// Shop collections: use same backend as other handlers to avoid CORS (backend can proxy to Shopify/Cloud Function)
export interface ShopCollection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  image?: { src: string } | null;
}

export const fetchCollections = async (): Promise<ShopCollection[]> => {
  try {
    const response = await api.get<ShopCollection[] | { collections: ShopCollection[] }>('/fetchCollectionsHandler');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as any).collections)) return (data as any).collections;
    console.warn('Unexpected response format from fetchCollectionsHandler:', data);
    return [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};

// App collections config from Firestore – response shape from fetchAppCollectionsInfoHandler
//
// Response: { collections: [ { id, COLLECTION_MAP, ORDER, DISPLAY_NAMES, updatedAt } ], total }
// - COLLECTION_MAP: { [key]: handle } (stable key → Shopify handle)
// - ORDER: string[] – keys in display order (only these are shown; keys in MAP but not in ORDER are omitted)
// - DISPLAY_NAMES: { [key]: label } – optional; UI uses DISPLAY_NAMES[key] || key
export interface AppCollectionsDoc {
  id: string;
  COLLECTION_MAP?: Record<string, string> | Array<Record<string, string>>;
  ORDER?: string[];
  DISPLAY_NAMES?: Record<string, string>;
  updatedAt?: string;
}

export interface AppCollectionsResponse {
  collections: AppCollectionsDoc[];
  total: number;
}

function collectionMapToRecord(map: AppCollectionsDoc['COLLECTION_MAP']): Record<string, string> {
  if (map == null) return {};
  if (Array.isArray(map)) {
    const record: Record<string, string> = {};
    for (const obj of map) {
      if (obj && typeof obj === 'object') {
        for (const [displayName, handle] of Object.entries(obj)) {
          if (typeof handle === 'string' && handle.trim()) record[displayName.trim()] = handle.trim();
        }
      }
    }
    return record;
  }
  if (typeof map === 'object') {
    return Object.fromEntries(
      Object.entries(map)
        .filter(([, handle]) => typeof handle === 'string' && (handle as string).trim())
        .map(([displayName, handle]) => [displayName.trim(), (handle as string).trim()])
    );
  }
  return {};
}

/**
 * Flatten API response into ordered list for the UI.
 * Only keys present in ORDER are included (keys in COLLECTION_MAP but not in ORDER are omitted).
 * displayName = DISPLAY_NAMES[key] ?? key.
 */
export function flattenCollectionMap(docs: AppCollectionsDoc[]): Array<{ key: string; handle: string; displayName: string }> {
  const out: Array<{ key: string; handle: string; displayName: string }> = [];
  for (const doc of docs) {
    const record = collectionMapToRecord(doc.COLLECTION_MAP);
    const displayNames = doc.DISPLAY_NAMES && typeof doc.DISPLAY_NAMES === 'object' ? doc.DISPLAY_NAMES : {};
    const order = doc.ORDER && Array.isArray(doc.ORDER) ? doc.ORDER : Object.keys(record);
    for (const key of order) {
      const handle = record[key];
      if (handle) {
        out.push({ key: key.trim(), handle, displayName: (displayNames[key] ?? key).trim() });
      }
    }
  }
  return out;
}

export const fetchAppCollectionsInfo = async (): Promise<AppCollectionsResponse> => {
  try {
    const response = await api.get<AppCollectionsResponse>('/fetchAppCollectionsInfoHandler');
    const data = response.data;
    if (data && typeof data === 'object' && Array.isArray(data.collections)) {
      return { collections: data.collections, total: data.total ?? data.collections.length };
    }
    console.warn('Unexpected response format from fetchAppCollectionsInfoHandler:', data);
    return { collections: [], total: 0 };
  } catch (error) {
    console.error('Error fetching app collections info:', error);
    throw error;
  }
};

// Push app collections to Firestore (create or update)
export interface PushAppCollectionsPayload {
  docId?: string;
  id?: string;
  COLLECTION_MAP: Record<string, string>;
  /** Keys in the desired display order. */
  ORDER?: string[];
  /** Optional display name overrides; keys must exist in COLLECTION_MAP. Omit or {} to use key as label. */
  DISPLAY_NAMES?: Record<string, string>;
}

export interface PushAppCollectionsResponse {
  id: string;
  created: boolean;
}

export const pushAppCollectionsInfo = async (payload: PushAppCollectionsPayload): Promise<PushAppCollectionsResponse> => {
  try {
    const response = await api.post<PushAppCollectionsResponse>('/pushAppCollectionsInfoHandler', payload);
    return response.data;
  } catch (error) {
    console.error('Error pushing app collections:', error);
    throw error;
  }
};

// Giveaway Comp (home snippet) – fetch/push via Cloud Functions
const GIVEAWAY_COMP_FETCH_URL = 'https://us-central1-premier-ikon.cloudfunctions.net/fetchGiveawayCompInfoHandler';
const GIVEAWAY_COMP_PUSH_URL = 'https://us-central1-premier-ikon.cloudfunctions.net/pushGiveawayCompInfoHandler';

export interface GiveawayCompItem {
  id: string;
  badgeLabel?: string;
  title?: string;
  header?: string;
  buttonText?: string;
  imageLink?: string;
  updatedAt?: string;
}

export interface FetchGiveawayCompResponse {
  items: GiveawayCompItem[];
  total: number;
}

export interface PushGiveawayCompPayload {
  docId?: string;
  badgeLabel?: string;
  title?: string;
  header?: string;
  buttonText?: string;
  imageLink?: string;
}

export interface PushGiveawayCompResponse {
  id: string;
  created: boolean;
}

export const fetchGiveawayCompInfo = async (docId?: string): Promise<FetchGiveawayCompResponse> => {
  try {
    const url = docId
      ? `${GIVEAWAY_COMP_FETCH_URL}?docId=${encodeURIComponent(docId)}`
      : GIVEAWAY_COMP_FETCH_URL;
    const response = await axios.get<FetchGiveawayCompResponse>(url);
    const data = response.data;
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return { items: data.items, total: data.total ?? data.items.length };
    }
    return { items: [], total: 0 };
  } catch (error) {
    console.error('Error fetching giveaway comp info:', error);
    throw error;
  }
};

export const pushGiveawayCompInfo = async (payload: PushGiveawayCompPayload): Promise<PushGiveawayCompResponse> => {
  const response = await axios.post<PushGiveawayCompResponse>(GIVEAWAY_COMP_PUSH_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Category Snippet / Category Grid Comp (home) – section title + ordered collections (even count required)
const CATEGORY_GRID_FETCH_URL = 'https://us-central1-premier-ikon.cloudfunctions.net/fetchCategoryGridCompInfoHandler';
const CATEGORY_GRID_PUSH_URL = 'https://us-central1-premier-ikon.cloudfunctions.net/pushCategoryGridCompInfoHandler';

export interface CategorySnippetDoc {
  id: string;
  sectionTitle?: string;
  COLLECTION_MAP?: Record<string, string>;
  ORDER?: string[];
  DISPLAY_NAMES?: Record<string, string>;
  updatedAt?: string;
}

export interface FetchCategorySnippetResponse {
  items: CategorySnippetDoc[];
  total: number;
}

export interface DashboardChartBucket {
  date: string;
  label: string;
  totalRevenue: number;
  mobileAppRevenue: number;
  otherRevenue: number;
  totalOrders: number;
  mobileAppOrders: number;
  otherOrders: number;
  pushRecipients: number;
}

export interface DashboardRecentCampaign {
  id: string;
  title: string;
  status: string;
  lastSentAt: string | null;
  recipientCount: number;
  userGroup: string | null;
}

export interface DashboardStats {
  success: boolean;
  salesChannel: string;
  period: {
    type: 'current_month' | 'days' | 'lifetime';
    days: number | null;
    label: string;
    dateRangeLabel: string;
    comparisonLabel: string | null;
    start: string;
    end: string;
  };
  chartPeriod: {
    months: number;
    granularity: 'monthly';
    label: string;
    dateRangeLabel: string;
    start: string;
    end: string;
  };
  sales: {
    currency: string;
    source: 'orders' | 'unavailable';
    notice: string | null;
    totalRevenue: number;
    totalOrders: number;
    revenueChange: number | null;
    ordersChange: number | null;
    mobileAppRevenue: number;
    mobileAppOrders: number;
    mobileAppRevenueChange: number | null;
    mobileAppOrdersChange: number | null;
    mobileAppShare: number;
    ordersTruncated?: boolean;
    definitions: {
      mobileAppRevenue: string;
      totalRevenue: string;
      mobileAppShare: string;
    };
  };
  app: {
    totalUsers: number;
    usersWithEmail: number;
    sendEventsInPeriod: number;
    totalRecipientsInPeriod: number;
    scheduledCount: number;
    draftCount: number;
    sentCampaignCount: number;
    totalCampaigns: number;
  };
  chart: DashboardChartBucket[];
  recentCampaigns: DashboardRecentCampaign[];
}

export interface FetchDashboardStatsParams {
  period?: 'current_month' | '7' | '30' | '90' | 'lifetime';
  forceRefresh?: boolean;
}

export const fetchDashboardStats = async (
  params: FetchDashboardStatsParams = {}
): Promise<DashboardStats> => {
  const period = params.period ?? 'current_month';

  const response = await api.get<DashboardStats>('/fetchDashboardStatsHandler', {
    params: { period },
  });

  setDashboardCache(period, response.data);

  return response.data;
};

export interface PushCategorySnippetPayload {
  docId?: string;
  id?: string;
  sectionTitle?: string;
  COLLECTION_MAP?: Record<string, string>;
  ORDER?: string[];
  DISPLAY_NAMES?: Record<string, string>;
}

export interface PushCategorySnippetResponse {
  id: string;
  created: boolean;
}

export const fetchCategorySnippetInfo = async (): Promise<FetchCategorySnippetResponse> => {
  try {
    const response = await axios.get<FetchCategorySnippetResponse>(CATEGORY_GRID_FETCH_URL);
    const data = response.data;
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return { items: data.items, total: data.total ?? data.items.length };
    }
    return { items: [], total: 0 };
  } catch (error) {
    console.error('Error fetching category grid comp info:', error);
    throw error;
  }
};

export const pushCategorySnippetInfo = async (payload: PushCategorySnippetPayload): Promise<PushCategorySnippetResponse> => {
  const response = await axios.post<PushCategorySnippetResponse>(CATEGORY_GRID_PUSH_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

