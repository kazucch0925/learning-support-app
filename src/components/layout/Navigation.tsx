import React, { useState, useRef, useEffect } from 'react';
import { Home, User, LogOut, Bell, Users, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import Button from '../ui/Button';
import NotificationDropdown from './NotificationDropdown';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Navigation({ currentPath, onNavigate }: NavigationProps) {
  const { signOut } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOpenNotification = () => {
    setShowNotifications(!showNotifications);
    // ドロップダウンを開いたときに通知を既読に
    if (!showNotifications) {
      notifications.forEach(notification => {
        if (!notification.is_read) {
          markAsRead(notification.id);
        }
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('/')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                currentPath === '/' 
                  ? 'text-teal-600 bg-teal-50' 
                  : 'text-gray-600 hover:text-teal-600 hover:bg-gray-50'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>ダッシュボード</span>
            </button>
            
            <button
              onClick={() => onNavigate('/challenges')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                currentPath === '/challenges'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              <Award className="h-5 w-5" />
              <span>チャレンジ</span>
            </button>
            
            <button
              onClick={() => onNavigate('/friends')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                currentPath === '/friends'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>友だち</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleOpenNotification}
                className="relative rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-teal-600"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications}
                loading={loading}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
                deleteNotification={deleteNotification}
              />
            </div>
            
            <Button 
              variant="ghost" 
              onClick={signOut}
              icon={<LogOut className="h-5 w-5" />}
            >
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}