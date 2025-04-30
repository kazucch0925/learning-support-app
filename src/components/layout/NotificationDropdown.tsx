import React from 'react';
import { Bell, Check, Trash2, CheckCircle, Clock, Link } from 'lucide-react';
// import { useNotifications } from '../../hooks/useNotifications'; // 削除
import Button from '../ui/Button';
import Card from '../ui/Card';
import type { Notification } from '../../hooks/useNotifications'; // 型だけインポート

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[]; // props で受け取る
  loading: boolean;            // props で受け取る
  markAsRead: (notificationId: string) => Promise<void>; // props で受け取る
  markAllAsRead: () => Promise<void>;                  // props で受け取る
  deleteNotification: (notificationId: string) => Promise<void>; // props で受け取る
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications, // props を展開
  loading,
  markAsRead,
  markAllAsRead,
  deleteNotification
}: NotificationDropdownProps) {
  // const { ... } = useNotifications(); // 削除

  // console.log(...) // 削除

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'anchoring':
        return <Link className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  return (
    <div className="absolute right-0 mt-2 w-80 z-50">
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">通知</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              icon={<CheckCircle className="h-4 w-4" />}
            >
              すべて既読
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              通知はありません
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg ${
                    notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        <div className="flex space-x-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              icon={<Check className="h-4 w-4" />}
                            >
                              <></>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            icon={<Trash2 className="h-4 w-4" />}
                          >
                            <></>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}