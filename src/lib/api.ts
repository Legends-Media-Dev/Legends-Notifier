import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface User {
  id?: string; // Firestore document ID (may be in the document or as the key)
  userId?: string;
  email?: string;
  brand?: string;
  modelName?: string;
  platform?: string;
  osVersion?: string;
  token?: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
  targetTokens?: string[];
  status?: string;
  sendAt?: string; // ISO date string for scheduled notifications
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
    
    // Transform the notifications to ensure they have the correct structure
    // Handle Firestore documents where id might be in the document or as a separate field
    return notifications.map((notif, index) => {
      // If the notification is a Firestore document, it might have id as a property
      // or the id might be passed separately
      return {
        id: notif.id || notif.docId || `notification-${index}`,
        title: notif.title || '',
        body: notif.body || '',
        data: notif.data || {},
        createdAt: notif.createdAt || notif.created_at || '',
        createdBy: notif.createdBy || 'system',
        targetTokens: notif.targetTokens || [],
        status: notif.status || 'pending',
        sendAt: notif.sendAt || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty array on error instead of throwing
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
    
    // Transform notifications
    return notifications.map((notif, index) => ({
      id: notif.id || notif.docId || `notification-${index}`,
      title: notif.title || '',
      body: notif.body || '',
      data: notif.data || {},
      createdAt: notif.createdAt || notif.created_at || '',
      createdBy: notif.createdBy || 'system',
      targetTokens: notif.targetTokens || [],
      status: notif.status || 'pending',
      sendAt: notif.sendAt || undefined,
    }));
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
  notificationId?: string; // Optional: if provided, fetches notification from Firestore
  targetTokens: string[]; // Required: array of Expo push tokens (sent as overrideTokens in backend)
  title?: string; // Optional: only needed if no notificationId
  body?: string; // Optional: only needed if no notificationId
  data?: Record<string, any>; // Optional: only needed if no notificationId
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

export const executeNotification = async (payload: ExecuteNotificationPayload | string): Promise<void> => {
  try {
    // Handle both old format (just notificationId string) and new format (payload object)
    if (typeof payload === 'string') {
      // Old format - just notificationId, backend will use saved tokens
      await api.post('/executeNotificationHandler', { notificationId: payload });
    } else {
      // New format - send with targetTokens (and optionally title/body/data if no notificationId)
      await api.post('/executeNotificationHandler', payload);
    }
  } catch (error) {
    console.error('Error executing notification:', error);
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

