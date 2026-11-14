import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertCircle, FileText, Info, BellOff } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import EmptyState from '../../components/common/EmptyState';
import PageTransition from '../../layouts/PageTransition';
import { formatRelativeTime } from '../../utils/helpers';

const typeIcons = {
  status_update: CheckCircle,
  document_verified: FileText,
  info: Info,
  draft_reminder: AlertCircle,
  new_assignment: Bell,
  resubmission: FileText,
  system: Info,
  new_registration: Bell,
};

const typeColors = {
  status_update: 'bg-success/10 text-success',
  document_verified: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  draft_reminder: 'bg-warning/10 text-warning',
  new_assignment: 'bg-primary/10 text-primary',
  resubmission: 'bg-accent/10 text-accent',
  system: 'bg-info/10 text-info',
  new_registration: 'bg-primary/10 text-primary',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, notificationsLoading, notificationsError, refreshNotifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const handleClick = async (notif) => {
    if (!notif.read && !(await markAsRead(notif.id))) return;
    if (notif.applicationId) {
      navigate(`/dashboard/applications/${notif.applicationId}`);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            <p className="text-text-secondary text-sm mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-ghost text-sm">Mark all as read</button>
          )}
        </div>

        {notificationsError && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 flex items-center justify-between gap-3">
            <p role="alert" className="text-sm text-error">{notificationsError}</p>
            <button onClick={refreshNotifications} className="btn-ghost text-sm shrink-0">Retry</button>
          </div>
        )}

        {notificationsLoading ? (
          <div role="status" className="card p-8 text-center text-sm text-text-secondary">Loading notifications…</div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const Icon = typeIcons[notif.type] || Bell;
              const colorClass = typeColors[notif.type] || 'bg-gray-100 text-gray-600';
              return (
                <motion.button key={notif.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => handleClick(notif)} className={`w-full text-left card p-4 flex items-start gap-4 transition-colors hover:bg-gray-50 ${!notif.read ? 'border-l-3 border-l-primary' : ''}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.read ? 'font-semibold text-text-primary' : 'font-medium text-text-primary/80'}`}>{notif.title}</p>
                      {!notif.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-text-secondary/60 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={BellOff} title="No Notifications" description="You're all caught up! Notifications will appear here." />
        )}
      </div>
    </PageTransition>
  );
}

