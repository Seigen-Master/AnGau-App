"use client";
import { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/use-notifications';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification as NotificationType } from '@/types';
import type { Timestamp } from 'firebase/firestore';

const isFirestoreTimestamp = (value: unknown): value is Timestamp => {
  return typeof value === 'object' && value !== null && typeof (value as Timestamp).toDate === 'function';
};

const formatNotificationTimestamp = (timestamp?: NotificationType['timestamp']): string => {
  if (!timestamp) {
    return '';
  }

  if (isFirestoreTimestamp(timestamp)) {
    return timestamp.toDate().toLocaleString();
  }

  if (timestamp instanceof Date) {
    return timestamp.toLocaleString();
  }

  const parsedDate = new Date(timestamp as unknown as string | number);
  return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleString();
};

const getNotificationContent = (notification: NotificationType): string => {
  switch (notification.type) {
    case 'message':
      return `${notification.senderName ?? 'Someone'} sent you a message.`;
    case 'overtime_request':
      return 'Overtime request';
    case 'cancellation_request':
      return 'Cancellation request';
    case 'request_approved':
      return notification.content || 'Your request has been approved.';
    case 'request_denied':
      return notification.content || 'Your request has been denied.';
    default:
      return `New notification: ${notification.type}`;
  }
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const router = useRouter();
  const { role } = useAuth();

  const handleNotificationClick = (notification: NotificationType) => {
    void markAsRead(notification.id);

    let path = '/';

    if (role === 'admin') {
      switch (notification.type) {
        case 'message':
          path = '/admin/messaging';
          break;
        case 'overtime_request':
        case 'cancellation_request':
          path = '/admin/requests';
          break;
        default:
          break;
      }
    } else if (role === 'caregiver') {
      switch (notification.type) {
        case 'message':
          path = '/caregiver/messaging';
          break;
        case 'overtime_request':
        case 'cancellation_request':
        case 'request_approved':
        case 'request_denied':
          path = '/caregiver/my-requests';
          break;
        default:
          break;
      }
    }

    router.push(path);
  };

  const formattedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        formattedTimestamp: formatNotificationTimestamp(notification.timestamp),
        content: getNotificationContent(notification),
      })),
    [notifications],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="p-4">
          <h4 className="font-semibold mb-2">Notifications</h4>
          {formattedNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No new notifications</p>
          ) : (
            <ul>
              {formattedNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`border-b last:border-b-0 py-2 ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="text-left w-full space-y-1"
                  >
                    <p className="text-sm font-semibold">{notification.senderName ?? 'Notification'}</p>
                    <p className="text-sm text-muted-foreground">{notification.content}</p>
                    <p className="text-xs text-muted-foreground">{notification.formattedTimestamp}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
