import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mockNotifications } from '../data/mockData';
import { useAuth } from './AuthContext';
import { getApiErrorMessage, notificationAPI } from '../services/api';

const NotificationContext = createContext(null);
const NOTIF_STORAGE_KEY = 'ayush_setu_notifications';

function readApiData(response) {
  const body = response?.data;
  if (!body?.success || body.data === undefined || body.data === null) {
    throw new Error(body?.error || 'The notification service returned an unexpected response.');
  }
  return body.data;
}

function normalizeApiNotification(notification) {
  const type = (notification.type || 'info').toLowerCase();
  const isRead = Boolean(notification.isRead);
  return {
    ...notification,
    type: type === 'status_change' ? 'status_update' : type,
    isRead,
    read: isRead,
  };
}

export function NotificationProvider({ children }) {
  const { user, isApiSession, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState('');

  const saveDemoNotifications = useCallback((nextNotifications) => {
    setNotifications(nextNotifications);
    if (!user?.id) return;
    try {
      localStorage.setItem(`${NOTIF_STORAGE_KEY}_${user.id}`, JSON.stringify(nextNotifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage', error);
    }
  }, [user?.id]);

  const refreshNotifications = useCallback(async () => {
    if (!isApiSession || !user?.id) return [];
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const data = readApiData(await notificationAPI.getAll());
      if (!Array.isArray(data)) throw new Error('The notification service returned an invalid list.');
      const nextNotifications = data.map(normalizeApiNotification);
      setNotifications(nextNotifications);
      return nextNotifications;
    } catch (error) {
      setNotificationsError(error?.apiMessage || getApiErrorMessage(error, 'Unable to load notifications.'));
      setNotifications([]);
      return [];
    } finally {
      setNotificationsLoading(false);
    }
  }, [isApiSession, user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (user && isApiSession) {
      setNotifications([]);
      refreshNotifications();
      return;
    }

    setNotificationsError('');
    if (user) {
      try {
        const stored = localStorage.getItem(`${NOTIF_STORAGE_KEY}_${user.id}`);
        const saved = stored ? JSON.parse(stored) : null;
        const userNotifications = Array.isArray(saved)
          ? saved
          : mockNotifications.filter((notification) => notification.userId === user.id);
        setNotifications(userNotifications);
        if (!Array.isArray(saved)) saveDemoNotifications(userNotifications);
      } catch {
        setNotifications(mockNotifications.filter((notification) => notification.userId === user.id));
      }
    } else {
      setNotifications([]);
    }
    setNotificationsLoading(false);
  }, [authLoading, isApiSession, refreshNotifications, saveDemoNotifications, user]);

  const markAsRead = useCallback(async (notifId) => {
    if (isApiSession) {
      setNotificationsError('');
      try {
        await notificationAPI.markRead(notifId);
        setNotifications((current) => current.map((notification) => (
          notification.id === notifId ? { ...notification, isRead: true, read: true } : notification
        )));
        return true;
      } catch (error) {
        setNotificationsError(error?.apiMessage || getApiErrorMessage(error, 'Unable to update this notification.'));
        return false;
      }
    }

    saveDemoNotifications(notifications.map((notification) => (
      notification.id === notifId ? { ...notification, read: true } : notification
    )));
    return true;
  }, [isApiSession, notifications, saveDemoNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (isApiSession) {
      setNotificationsError('');
      try {
        await notificationAPI.markAllRead();
        setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true, read: true })));
        return true;
      } catch (error) {
        setNotificationsError(error?.apiMessage || getApiErrorMessage(error, 'Unable to update notifications.'));
        return false;
      }
    }

    saveDemoNotifications(notifications.map((notification) => ({ ...notification, read: true })));
    return true;
  }, [isApiSession, notifications, saveDemoNotifications]);

  const addNotification = useCallback((notification) => {
    if (isApiSession) return null;
    const newNotification = {
      id: `notif_${Date.now()}`,
      userId: user?.id,
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    };
    saveDemoNotifications([newNotification, ...notifications]);
    return newNotification;
  }, [isApiSession, notifications, saveDemoNotifications, user?.id]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const value = {
    notifications,
    notificationsLoading,
    notificationsError,
    refreshNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
