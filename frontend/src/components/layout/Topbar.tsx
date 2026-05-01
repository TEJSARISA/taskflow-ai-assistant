import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Bell, HelpCircle, Sun, Moon, X, Clock, Menu, Sparkles } from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { Notification } from '@/types';
import TimeTracker from '../ui/TimeTracker';
import { useUI } from '@/context/UIContext';

interface TopbarProps {
    theme?: string;
    toggleTheme?: () => void;
}

const Topbar = ({ theme, toggleTheme }: TopbarProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const { toggleSidebar } = useUI();

    useEffect(() => {
        const fetchNotifications = async () => {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = (id: string) => {
        notificationService.markAsRead(id);
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    };

    return (
        <header className='h-20 border-b border-border flex items-center justify-between px-4 lg:px-10 bg-background/80 backdrop-blur-md sticky top-0 z-[90]'>
            {/* Left Section: Menu & Search */}
            <div className='flex items-center gap-4 w-1/3'>
                <button
                    onClick={toggleSidebar}
                    className='lg:hidden p-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all'
                >
                    <Menu size={20} />
                </button>

                <div className='lg:hidden flex items-center gap-2'>
                    <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20'>
                        <Sparkles className='text-primary-foreground w-4 h-4' />
                    </div>
                </div>

                <div className='hidden md:flex w-full max-w-xs items-center gap-4'>
                    <div className='relative group flex-1'>
                        <Search
                            className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-300'
                            size={18}
                        />
                        <input
                            type='text'
                            placeholder='Search...'
                            className='w-full bg-secondary border border-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all text-sm font-medium placeholder:text-muted-foreground'
                        />
                    </div>
                </div>

                {/* Mobile Search Icon */}
                <div className='flex md:hidden items-center gap-2'>
                    <button className='p-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all'>
                        <Search size={20} />
                    </button>
                </div>
            </div>

            {/* Center Section: AI Assistant */}
            <div className='hidden md:flex flex-1 justify-center px-4'>
                <NavLink
                    to='/ai'
                    className={({ isActive }) => `
            flex items-center gap-2 px-8 py-3 rounded-2xl border transition-all duration-300 whitespace-nowrap group/ai
            ${
                isActive
                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }
          `}
                >
                    {({ isActive }) => (
                        <>
                            <Sparkles
                                size={18}
                                className={`${isActive ? 'animate-pulse' : 'group-hover/ai:text-primary transition-colors'}`}
                            />
                            <span className='text-xs font-black uppercase tracking-widest'>
                                AI Management Assistant
                            </span>
                        </>
                    )}
                </NavLink>
            </div>

            {/* Mobile AI Button (hidden on desktop) */}
            <div className='flex md:hidden items-center gap-2'>
                <NavLink
                    to='/ai'
                    className={({ isActive }) => `
            p-2 rounded-xl border transition-all
            ${isActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary border-border text-muted-foreground'}
          `}
                >
                    <Sparkles size={20} />
                </NavLink>
            </div>

            {/* Right Section: Utilities */}
            <div className='flex items-center justify-end gap-2 md:gap-4 w-1/3'>
                <div className='hidden sm:block'>
                    <TimeTracker />
                </div>

                <div className='hidden xl:flex items-center gap-3 bg-secondary border border-border px-4 py-2 rounded-2xl'>
                    <div className='flex -space-x-1.5'>
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className='w-5 h-5 rounded-full border border-background bg-primary/20 flex items-center justify-center text-[6px] font-bold text-primary'
                            >
                                AI
                            </div>
                        ))}
                    </div>
                    <span className='text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                        Neural Link Active
                    </span>
                </div>

                <div className='flex items-center gap-2 relative'>
                    <button
                        onClick={toggleTheme}
                        className='w-10 h-10 flex items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all'
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className='relative'>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className='w-10 h-10 flex items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all relative group'
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className='absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background group-hover:animate-ping'></span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className='absolute right-0 mt-4 w-[calc(100vw-32px)] sm:w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]'>
                                <div className='p-4 border-b border-border flex items-center justify-between'>
                                    <h3 className='text-xs font-black uppercase tracking-widest text-foreground'>
                                        Communications
                                    </h3>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className='text-muted-foreground hover:text-foreground'
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className='max-h-[400px] overflow-y-auto custom-scrollbar'>
                                    {notifications.length === 0 ? (
                                        <div className='p-8 text-center'>
                                            <p className='text-xs text-muted-foreground font-medium'>
                                                Clear frequencies. No new updates.
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`p-4 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                                                onClick={() => handleMarkAsRead(n.id)}
                                            >
                                                <div className='flex gap-3'>
                                                    <div
                                                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary animate-pulse' : 'bg-transparent'}`}
                                                    ></div>
                                                    <div>
                                                        <p className='text-[11px] font-bold text-foreground leading-relaxed'>
                                                            {n.message}
                                                        </p>
                                                        <div className='flex items-center gap-2 mt-2'>
                                                            <Clock
                                                                size={10}
                                                                className='text-muted-foreground'
                                                            />
                                                            <span className='text-[9px] text-muted-foreground font-medium'>
                                                                {new Date(n.timestamp).toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => {
                                            notificationService.clearAll();
                                            setNotifications([]);
                                        }}
                                        className='w-full py-3 bg-secondary/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-t border-border'
                                    >
                                        Purge All Data
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <button className='hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all'>
                        <HelpCircle size={18} />
                    </button>
                </div>

                <div className='hidden md:block h-6 w-px bg-border mx-2'></div>

                <div className='hidden md:flex items-center gap-3'>
                    <div className='flex flex-col items-end'>
                        <span className='text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none'>
                            System Live
                        </span>
                        <span className='text-[8px] font-medium text-muted-foreground mt-1 uppercase tracking-tighter'>
                            Latency: 24ms
                        </span>
                    </div>
                    <div className='w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse'></div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
