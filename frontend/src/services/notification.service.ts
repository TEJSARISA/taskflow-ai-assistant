import { Notification } from '../types';

let notifications: Notification[] = [
    {
        id: 'n1',
        userId: 'u1',
        message: 'Welcome to TaskFlow AI! Start by creating your first project.',
        type: 'project_added',
        read: true,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'n2',
        userId: 'u1',
        message: 'Taylor Swift mentioned you in a comment on "API Security Audit"',
        type: 'comment_added',
        read: false,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
        id: 'n3',
        userId: 'u1',
        message: 'You have been assigned the task "Marketing Strategy"',
        type: 'task_assigned',
        read: false,
        timestamp: new Date(Date.now() - 600000).toISOString()
    },
    {
        id: 'n4',
        userId: 'u1',
        message: 'Deadline approaching for "Design UI Mockups"',
        type: 'status_updated',
        read: false,
        timestamp: new Date(Date.now() - 300000).toISOString()
    }
];

export const notificationService = {
    getNotifications: async (): Promise<Notification[]> => {
        return [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },

    addNotification: (notification: Partial<Notification>) => {
        const newNotification: Notification = {
            id: `n${Date.now()}`,
            userId: notification.userId || 'u1',
            message: notification.message || '',
            type: notification.type || 'task_assigned',
            read: false,
            timestamp: new Date().toISOString(),
            ...notification
        } as Notification;
        notifications = [newNotification, ...notifications];
        return newNotification;
    },

    markAsRead: (id: string) => {
        notifications = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
    },

    clearAll: () => {
        notifications = [];
    }
};
