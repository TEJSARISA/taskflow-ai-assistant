import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, MessageSquare, RefreshCcw, Clock, Trash2, Briefcase } from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { Notification } from '@/types';
import { useUI } from '@/context/UIContext';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useUI();

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        notificationService.markAsRead(id);
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    };

    const handleClearAll = () => {
        notificationService.clearAll();
        setNotifications([]);
        showToast('All notifications cleared');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'task_assigned':
                return (
                    <CheckCircle2
                        className='text-primary'
                        size={18}
                    />
                );
            case 'comment_added':
                return (
                    <MessageSquare
                        className='text-accent'
                        size={18}
                    />
                );
            case 'status_updated':
                return (
                    <RefreshCcw
                        className='text-emerald-500'
                        size={18}
                    />
                );
            case 'project_added':
                return (
                    <Briefcase
                        className='text-amber-500'
                        size={18}
                    />
                );
            default:
                return (
                    <Bell
                        className='text-primary'
                        size={18}
                    />
                );
        }
    };

    return (
        <div className='max-w-4xl mx-auto space-y-8 pb-20'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-black tracking-tight text-foreground'>Notifications</h1>
                    <p className='text-muted-foreground mt-1 text-sm font-medium italic'>
                        Stay updated with your team's activity
                    </p>
                </div>
                <button
                    onClick={handleClearAll}
                    className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors'
                >
                    <Trash2 size={14} />
                    Clear All
                </button>
            </div>

            <div className='space-y-4'>
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div
                            key={i}
                            className='card p-6 animate-pulse flex gap-4'
                        >
                            <div className='w-10 h-10 rounded-xl bg-secondary shrink-0'></div>
                            <div className='flex-1 space-y-2'>
                                <div className='h-4 bg-secondary rounded w-3/4'></div>
                                <div className='h-3 bg-secondary rounded w-1/4'></div>
                            </div>
                        </div>
                    ))
                ) : notifications.length === 0 ? (
                    <div className='card p-12 text-center flex flex-col items-center gap-4 border-dashed'>
                        <div className='w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground opacity-50'>
                            <Bell size={32} />
                        </div>
                        <div>
                            <h3 className='text-lg font-bold text-foreground'>All caught up!</h3>
                            <p className='text-sm text-muted-foreground'>You don't have any new notifications.</p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode='popLayout'>
                        {notifications.map(notification => (
                            <motion.div
                                key={notification.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`card p-6 flex gap-4 transition-all hover:shadow-lg group ${!notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border bg-card shadow-sm group-hover:scale-110 transition-transform`}
                                >
                                    {getIcon(notification.type)}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-start justify-between gap-4'>
                                        <p
                                            className={`text-sm md:text-base leading-relaxed ${!notification.read ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                                        >
                                            {notification.message}
                                        </p>
                                        {!notification.read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className='text-[10px] font-black uppercase tracking-widest text-primary hover:underline shrink-0'
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>
                                    <div className='flex items-center gap-2 mt-2 text-[10px] md:text-xs text-muted-foreground font-medium italic'>
                                        <Clock size={12} />
                                        <span>
                                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default Notifications;
