import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Plus, Filter } from 'lucide-react';
import { taskService } from '@/services/task.service';
import TaskModal from '@/components/tasks/TaskModal';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState('');

    const handleDayClick = (date: Date) => {
        setSelectedDateStr(date.toISOString().split('T')[0]);
        setIsTaskModalOpen(true);
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await taskService.getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const calendarDays = [];
    // Previous month padding
    const prevMonthDays = daysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarDays.push({
            day: prevMonthDays - i,
            currentMonth: false,
            date: new Date(year, month - 1, prevMonthDays - i)
        });
    }
    // Current month
    for (let i = 1; i <= daysCount; i++) {
        calendarDays.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    // Next month padding
    const totalSlots = 42; // 6 weeks
    const remainingSlots = totalSlots - calendarDays.length;
    for (let i = 1; i <= remainingSlots; i++) {
        calendarDays.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }

    const getTasksForDay = (date: Date) => {
        return tasks.filter(task => {
            const taskDate = new Date(task.due_date || task.dueDate);
            return (
                taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear()
            );
        });
    };

    return (
        <div className='space-y-6 md:space-y-8 pb-10'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl md:text-3xl font-black tracking-tight text-foreground'>Project Calendar</h1>
                    <p className='text-muted-foreground mt-1 text-xs md:text-sm'>
                        Track deadlines and schedule project milestones.
                    </p>
                </div>
                <div className='flex items-center gap-2 w-full sm:w-auto'>
                    <button className='btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2'>
                        <Filter size={16} />
                        <span>Filters</span>
                    </button>
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className='btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2'
                    >
                        <Plus size={18} />
                        <span>New Event</span>
                    </button>
                </div>
            </div>

            <div className='card overflow-hidden shadow-xl p-0'>
                {/* Calendar Header */}
                <div className='flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 border-b border-border bg-secondary/30 gap-4'>
                    <div className='flex items-center justify-between md:justify-start gap-4'>
                        <div className='flex items-center bg-background rounded-xl border border-border p-1'>
                            <button
                                onClick={prevMonth}
                                className='p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground'
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={nextMonth}
                                className='p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground'
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <h2 className='text-lg sm:text-xl font-black text-foreground whitespace-nowrap'>
                            {monthNames[month]} <span className='text-muted-foreground font-medium'>{year}</span>
                        </h2>
                    </div>
                    <div className='flex items-center justify-between md:justify-end gap-2'>
                        <button className='px-4 py-2 text-sm font-bold bg-background border border-border rounded-xl hover:bg-secondary transition-colors text-primary'>
                            Today
                        </button>
                        <div className='flex items-center bg-background rounded-xl border border-border p-1'>
                            {['Month', 'Week'].map(v => (
                                <button
                                    key={v}
                                    className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${v === 'Month' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Calendar Grid wrapper for scroll */}
                <div className='overflow-x-auto no-scrollbar'>
                    <div className='min-w-[700px]'>
                        {/* Calendar Grid Header */}
                        <div className='grid grid-cols-7 border-b border-border bg-secondary/10'>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div
                                    key={day}
                                    className='py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground'
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className='grid grid-cols-7 border-l border-border'>
                            {calendarDays.map((item, idx) => {
                                const dayTasks = getTasksForDay(item.date);
                                const isToday = new Date().toDateString() === item.date.toDateString();

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => item.currentMonth && handleDayClick(item.date)}
                                        className={`min-h-[120px] sm:min-h-[140px] border-r border-b border-border p-2 transition-colors hover:bg-secondary/20 relative group cursor-pointer ${!item.currentMonth ? 'bg-secondary/5 opacity-40' : 'bg-card'}`}
                                    >
                                        <div className='flex items-center justify-between mb-2'>
                                            <span
                                                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                                            >
                                                {item.day}
                                            </span>
                                            {item.currentMonth && (
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleDayClick(item.date);
                                                    }}
                                                    className='opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all'
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className='space-y-1 sm:space-y-1.5 pointer-events-none'>
                                            {dayTasks.slice(0, 3).map((task, tidx) => (
                                                <motion.div
                                                    key={task.id || tidx}
                                                    initial={{ opacity: 0, x: -5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-bold truncate border shadow-sm ${
                                                        task.priority === 'High'
                                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                            : task.priority === 'Medium'
                                                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                              : 'bg-primary/10 text-primary border-primary/20'
                                                    }`}
                                                >
                                                    {task.title}
                                                </motion.div>
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <div className='text-[8px] sm:text-[10px] text-muted-foreground font-medium pl-1'>
                                                    + {dayTasks.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                initialDueDate={selectedDateStr}
                onSave={async taskData => {
                    await taskService.createTask(taskData);
                    fetchTasks();
                }}
            />

            <div className='space-y-4'>
                <h3 className='text-xl font-black text-foreground flex items-center gap-2'>
                    <Clock
                        className='text-primary'
                        size={24}
                    />
                    Upcoming Deadlines
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {tasks
                        .filter(t => t.status !== 'Done' && (t.dueDate || t.due_date))
                        .sort(
                            (a, b) =>
                                new Date(a.dueDate || a.due_date).getTime() -
                                new Date(b.dueDate || b.due_date).getTime()
                        )
                        .slice(0, 6)
                        .map((task, i) => (
                            <div
                                key={task.id}
                                className='card p-4 flex flex-col gap-3 group hover:border-primary/30 transition-all'
                            >
                                <div className='flex items-center justify-between'>
                                    <span
                                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                            task.priority === 'High'
                                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                : task.priority === 'Medium'
                                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}
                                    >
                                        {task.priority}
                                    </span>
                                    <span className='text-[10px] font-bold text-muted-foreground italic'>
                                        {new Date(task.dueDate || task.due_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className='font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors'>
                                    {task.title}
                                </h4>
                                <div className='flex items-center justify-between mt-auto pt-2 border-t border-border/50'>
                                    <div className='flex items-center gap-2'>
                                        <div className='w-5 h-5 rounded-full bg-secondary border border-border overflow-hidden'>
                                            <img
                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo}`}
                                                alt=''
                                            />
                                        </div>
                                        <span className='text-[9px] font-black text-muted-foreground uppercase'>
                                            {task.project?.name || 'Initiative'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
