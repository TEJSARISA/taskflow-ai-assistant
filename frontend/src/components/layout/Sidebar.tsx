import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    Columns,
    Video,
    Users,
    Calendar,
    Sparkles,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    BarChart2,
    Zap,
    History
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { notificationService } from '@/services/notification.service';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { logout, user } = useAuth();
    const { isSidebarOpen, setIsSidebarOpen } = useUI();
    const location = useLocation();

    useEffect(() => {
        const fetchUnread = async () => {
            const notifications = await notificationService.getNotifications();
            setUnreadCount(notifications.filter(n => !n.read).length);
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [location.pathname]);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsSidebarOpen]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname, setIsSidebarOpen]);

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Projects', icon: FolderKanban, path: '/projects' },
        { name: 'Kanban', icon: Columns, path: '/tasks' },
        { name: 'Gantt', icon: BarChart2, path: '/gantt' },
        { name: 'Meetings', icon: Video, path: '/meetings' },
        { name: 'Team', icon: Users, path: '/team' },
        { name: 'Calendar', icon: Calendar, path: '/calendar' },
        { name: 'Analytics', icon: BarChart2, path: '/analytics' },
        { name: 'Activity', icon: History, path: '/activity' },
        { name: 'Notifications', icon: Zap, path: '/notifications' }
    ];

    const sidebarVariants = {
        expanded: { width: 280 },
        collapsed: { width: 88 },
        mobileOpen: { x: 0, width: 280 },
        mobileClosed: { x: -280, width: 280 }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className='fixed inset-0 bg-background/60 backdrop-blur-md z-[150] lg:hidden'
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={
                    window.innerWidth < 1024
                        ? isSidebarOpen
                            ? 'mobileOpen'
                            : 'mobileClosed'
                        : isCollapsed
                          ? 'collapsed'
                          : 'expanded'
                }
                variants={sidebarVariants}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className='fixed inset-y-0 left-0 lg:relative flex flex-col bg-sidebar border-r border-sidebar-border z-[160] lg:z-[100] h-full overflow-hidden'
            >
                {/* Logo Section */}
                <div className='h-20 flex items-center px-6 shrink-0 border-b border-sidebar-border/50'>
                    <div className='flex items-center gap-3 overflow-hidden'>
                        <div className='w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0'>
                            <Sparkles className='text-primary-foreground w-5 h-5' />
                        </div>
                        <AnimatePresence mode='wait'>
                            {(!isCollapsed || isSidebarOpen) && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className='flex flex-col'
                                >
                                    <span className='font-black text-lg tracking-tight text-sidebar-foreground leading-none'>
                                        TaskFlow
                                    </span>
                                    <span className='text-[10px] font-bold text-primary tracking-[0.2em] uppercase mt-1'>
                                        Intelligence
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className='ml-auto p-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-all border border-sidebar-border hidden lg:flex'
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Navigation Section */}
                <nav className='flex-1 px-3 py-6 overflow-y-auto custom-scrollbar space-y-1'>
                    {navItems.map(item => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${
                    isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }
              `}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={20}
                                        className='shrink-0'
                                    />
                                    <AnimatePresence>
                                        {(!isCollapsed || isSidebarOpen) && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className='font-bold text-sm tracking-tight whitespace-nowrap overflow-hidden'
                                            >
                                                {item.name}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    {item.name === 'Notifications' && unreadCount > 0 && (
                                        <span
                                            className={`absolute ${isCollapsed && !isSidebarOpen ? 'top-2 right-2' : 'right-4'} flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background shadow-sm`}
                                        >
                                            {unreadCount}
                                        </span>
                                    )}
                                    {isActive && !isCollapsed && (
                                        <motion.div
                                            layoutId='active-pill'
                                            className='absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground'
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Pro / Usage Section */}
                {(!isCollapsed || isSidebarOpen) && (
                    <div className='px-6 py-4'>
                        <div className='bg-primary/5 rounded-2xl p-4 border border-primary/10'>
                            <div className='flex items-center gap-2 mb-3'>
                                <Zap
                                    size={14}
                                    className='text-primary'
                                />
                                <span className='text-[10px] font-black uppercase tracking-widest text-primary'>
                                    Pro Capacity
                                </span>
                            </div>
                            <div className='w-full bg-primary/10 h-1.5 rounded-full overflow-hidden'>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '75%' }}
                                    className='bg-primary h-full rounded-full'
                                />
                            </div>
                            <p className='text-[10px] font-bold text-muted-foreground mt-2'>
                                75% of compute credits used
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Section */}
                <div className='p-4 mt-auto border-t border-sidebar-border/50 space-y-4'>
                    <div
                        className={`flex items-center gap-3 px-2 py-2 ${isCollapsed && !isSidebarOpen ? 'justify-center' : ''}`}
                    >
                        <div className='relative shrink-0'>
                            <img
                                src={
                                    user?.avatar ||
                                    `https://api.dicebear.com/7.x/initials/svg?seed=male-${user?.name || user?.email}`
                                }
                                alt='Avatar'
                                className='w-10 h-10 rounded-xl border border-sidebar-border p-0.5 bg-sidebar-accent object-cover'
                            />
                            <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-foreground rounded-full border-2 border-sidebar'></div>
                        </div>
                        <AnimatePresence>
                            {(!isCollapsed || isSidebarOpen) && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className='flex flex-col overflow-hidden'
                                >
                                    <span className='font-bold text-sm tracking-tight truncate text-sidebar-foreground'>
                                        {user?.name || 'User'}
                                    </span>
                                    <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate'>
                                        {user?.role || 'Member'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className='grid gap-1'>
                        <NavLink
                            to='/settings'
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'}
              `}
                        >
                            <Settings
                                size={18}
                                className='shrink-0'
                            />
                            {(!isCollapsed || isSidebarOpen) && (
                                <span className='font-bold text-[10px] uppercase tracking-widest'>Preferences</span>
                            )}
                        </NavLink>

                        <button
                            onClick={logout}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground hover:bg-foreground/10 transition-all ${isCollapsed && !isSidebarOpen ? 'justify-center' : ''}`}
                        >
                            <LogOut
                                size={18}
                                className='shrink-0'
                            />
                            {(!isCollapsed || isSidebarOpen) && (
                                <span className='font-bold text-[10px] uppercase tracking-widest'>Sign Out</span>
                            )}
                        </button>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
