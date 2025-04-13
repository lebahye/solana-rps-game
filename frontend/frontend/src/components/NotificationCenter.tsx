import React, { useState, useEffect } from 'react';
import { TransactionNotification } from '../types';

// Unique ID generator
const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sample notifications for demonstration
const sampleNotifications: TransactionNotification[] = [
  {
    type: 'success',
    message: 'Successfully created game!',
    txId: '5UxV2MR7P5MCoGfKDv7W7DKjzJFSHtVhPzZtZJuQdMgWwQRXs9Vr5QZJwRrQkqBqomS3UBFTbwXN5FDdKzwUyELe',
    autoClose: true,
    duration: 5000,
  },
  {
    type: 'info',
    message: 'Waiting for other players to join...',
    autoClose: false,
  }
];

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<(TransactionNotification & { id: string })[]>([]);
  const [visible, setVisible] = useState(false);

  // For demo purposes, load sample notifications
  useEffect(() => {
    // Add sample notifications with IDs
    const notificationsWithIds = sampleNotifications.map(notification => ({
      ...notification,
      id: generateId(),
    }));
    
    setNotifications(notificationsWithIds);
    
    // Auto-close notifications that have autoClose set to true
    notificationsWithIds.forEach(notification => {
      if (notification.autoClose && notification.duration) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
    });
  }, []);

  // Remove a notification by ID
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Toggle notification center visibility
  const toggleVisibility = () => {
    setVisible(prev => !prev);
  };

  // Get icon based on notification type
  const getIcon = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  // If no notifications, don't render anything
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-center">
      {/* Notification indicator */}
      <button 
        className="notification-toggle"
        onClick={toggleVisibility}
        aria-label={`${notifications.length} notifications`}
      >
        <span className="notification-count">{notifications.length}</span>
        <span className="notification-icon">🔔</span>
      </button>

      {/* Notification panel */}
      {visible && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button 
              className="clear-all"
              onClick={() => setNotifications([])}
              aria-label="Clear all notifications"
            >
              Clear All
            </button>
          </div>

          <div className="notification-list">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item notification-${notification.type}`}
              >
                <div className="notification-icon">
                  {getIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  {notification.txId && (
                    <a 
                      href={`https://explorer.solana.com/tx/${notification.txId}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="notification-link"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
                <button 
                  className="notification-close"
                  onClick={() => removeNotification(notification.id)}
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
