import React, { useState, useEffect, useCallback } from 'react';
import { Square, Timer } from 'lucide-react';
import { timeEntryService } from '@/services/timeEntry.service';
import { notificationService } from '@/services/notification.service';

const TimeTracker = () => {
    const [activeTimer, setActiveTimer] = useState<any>(null);
    const [elapsed, setElapsed] = useState(0);

    const fetchActiveTimer = useCallback(async () => {
        try {
            const timer = await timeEntryService.getActiveTimer();
            setActiveTimer(timer);
            if (timer) {
                const start = new Date(timer.startTime).getTime();
                const now = new Date().getTime();
                setElapsed(Math.floor((now - start) / 1000));
            } else {
                setElapsed(0);
            }
        } catch (error) {
            console.error('Error fetching active timer:', error);
        }
    }, []);

    useEffect(() => {
        fetchActiveTimer();
    }, [fetchActiveTimer]);

    useEffect(() => {
        let interval: any;
        if (activeTimer) {
            interval = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const handleStop = async () => {
        try {
            await timeEntryService.stopTimer();
            setActiveTimer(null);
            setElapsed(0);
            notificationService.addNotification({
                message: 'Time tracking stopped and saved.',
                type: 'status_updated'
            });
        } catch (error) {
            console.error('Error stopping timer:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!activeTimer) return null;

    return (
        <div className='flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl animate-in fade-in zoom-in duration-300'>
            <div className='w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary animate-pulse'>
                <Timer size={16} />
            </div>
            <div className='flex flex-col'>
                <span className='text-[10px] font-black text-primary uppercase tracking-widest leading-none'>
                    Tracking Time
                </span>
                <span className='text-[11px] font-bold text-foreground mt-1 truncate max-w-[120px]'>
                    {activeTimer.task?.title}
                </span>
            </div>
            <div className='h-6 w-px bg-primary/20 mx-2'></div>
            <div className='text-sm font-black font-mono text-primary tracking-tighter w-[60px] text-center'>
                {formatTime(elapsed)}
            </div>
            <button
                onClick={handleStop}
                className='w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-rose-500/10'
            >
                <Square
                    size={14}
                    fill='currentColor'
                />
            </button>
        </div>
    );
};

export default TimeTracker;
