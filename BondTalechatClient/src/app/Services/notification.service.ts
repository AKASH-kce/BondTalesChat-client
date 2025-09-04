import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'call' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  data?: any;
}

export interface CallNotification extends Notification {
  type: 'call';
  callId: string;
  participantId: string;
  participantName: string;
  callType: 'audio' | 'video';
  isIncoming: boolean;
  data: {
    callId: string;
    participantId: string;
    participantName: string;
    callType: 'audio' | 'video';
    isIncoming: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notifications: Notification[] = [];

  constructor() {
    this.loadNotifications();
    this.updateUnreadCount();
  }

  // Add a new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): string {
    const id = this.generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      isRead: false
    };

    this.notifications.unshift(newNotification);
    this.notificationsSubject.next([...this.notifications]);
    this.updateUnreadCount();
    this.saveNotifications();

    // Show browser notification if permission is granted
    this.showBrowserNotification(newNotification);

    return id;
  }

  // Add call notification
  addCallNotification(callData: {
    callId: string;
    participantId: string;
    participantName: string;
    callType: 'audio' | 'video';
    isIncoming: boolean;
  }): string {
    const notification: CallNotification = {
      id: '',
      type: 'call',
      title: callData.isIncoming ? 'Incoming Call' : 'Outgoing Call',
      message: `${callData.isIncoming ? 'Incoming' : 'Outgoing'} ${callData.callType} call from ${callData.participantName}`,
      timestamp: new Date(),
      isRead: false,
      callId: callData.callId,
      participantId: callData.participantId,
      participantName: callData.participantName,
      callType: callData.callType,
      isIncoming: callData.isIncoming,
      actionUrl: `/call/${callData.callId}`,
      data: callData
    };

    return this.addNotification(notification);
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.notificationsSubject.next([...this.notifications]);
      this.updateUnreadCount();
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
    this.notificationsSubject.next([...this.notifications]);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Remove notification
  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notificationsSubject.next([...this.notifications]);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = [];
    this.notificationsSubject.next([]);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Get notifications by type
  getNotificationsByType(type: Notification['type']): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }

  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Show browser notification
  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: this.getNotificationIcon(notification.type),
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.type === 'call',
        silent: notification.type !== 'call'
      });

      // Auto close after 5 seconds for non-call notifications
      if (notification.type !== 'call') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      // Handle click on notification
      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        
        if (notification.actionUrl) {
          // Navigate to action URL
          window.location.href = notification.actionUrl;
        }
        
        browserNotification.close();
      };
    }
  }

  // Get notification icon based on type
  private getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'call':
        return '/assets/icons/phone.png';
      case 'message':
        return '/assets/icons/message.png';
      case 'system':
        return '/assets/icons/system.png';
      default:
        return '/favicon.ico';
    }
  }

  // Update unread count
  private updateUnreadCount(): void {
    const unreadCount = this.notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Load notifications from localStorage
  private loadNotifications(): void {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      this.notifications = JSON.parse(saved).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
      this.notificationsSubject.next([...this.notifications]);
    }
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  // Play notification sound
  playNotificationSound(type: Notification['type'] = 'message'): void {
    const audio = new Audio();
    
    switch (type) {
      case 'call':
        audio.src = '/assets/sounds/call-notification.mp3';
        break;
      case 'message':
        audio.src = '/assets/sounds/message-notification.mp3';
        break;
      case 'system':
        audio.src = '/assets/sounds/system-notification.mp3';
        break;
    }
    
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore errors if audio can't be played
    });
  }

  // Format notification time
  formatNotificationTime(timestamp: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }
}
