import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mockNotifications } from '../data/mockData';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const NOTIF_STORAGE_KEY = 'ayush_setu_notifications';

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      try {
        const stored = localStorage.getItem(`${NOTIF_STORAGE_KEY}_${user.id}`);
        if (stored) {
          setNotifications(JSON.parse(stored));
        } else {
          const userNotifs = mockNotifications.filter(n => n.userId === user.id);
          setNotifications(userNotifs);
          localStorage.setItem(`${NOTIF_STORAGE_KEY}_${user.id}`, JSON.stringify(userNotifs));
        }
      } catch {
        const userNotifs = mockNotifications.filter(n => n.userId === user.id);
        setNotifications(userNotifs);
      }
    } else {
      setNotifications([]);
    }
  }, [user]);

  const saveNotifications = useCallback((notifs) => {
    setNotifications(notifs);
    if (user) {
      localStorage.setItem(`${NOTIF_STORAGE_KEY}_${user.id}`, JSON.stringify(notifs));
    }
  }, [user]);

  const markAsRead = useCallback((notifId) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notifId ? { ...n, read: true } : n);
      if (user) {
        localStorage.setItem(`${NOTIF_STORAGE_KEY}_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [user]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (user) {
        localStorage.setItem(`${NOTIF_STORAGE_KEY}_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [user]);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: `notif_${Date.now()}`,
      userId: user?.id,
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      if (user) {
        localStorage.setItem(`${NOTIF_STORAGE_KEY}_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
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

