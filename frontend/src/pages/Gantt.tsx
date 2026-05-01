import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, BarChart, Clock, Briefcase } from 'lucide-react';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { Project, Task } from '@/types';
import { useUI } from '@/context/UIContext';

const Gantt = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const { showToast } = useUI();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [p, t] = await Promise.all([projectService.getProjects(), taskService.getTasks()]);
                setProjects(p);
                setTasks(t);
                if (p.length > 0 && selectedProjectId === 'all') {
                    // Keep it as 'all' or select first project
                }
            } catch (error) {
                console.error('Error fetching data for Gantt:', error);
                showToast('Failed to load project data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const filteredTasks = selectedProjectId === 'all' ? tasks : tasks.filter(t => t.projectId === selectedProjectId);

    // Simple date range for the Gantt view (next 30 days)
    const today = new Date();
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    });

    const getDayPosition = (dateStr: string) => {
        const date = new Date(dateStr);
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className='space-y-6 md:space-y-8 pb-20'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div>
                    <h1 className='text-2xl md:text-3xl font-black tracking-tight text-foreground'>
                        Strategic Timeline
                    </h1>
                    <p className='text-muted-foreground mt-1 text-xs md:text-sm font-medium italic'>
                        Gantt visualization of operational objectives
                    </p>
                </div>

                <div className='flex items-center gap-3 md:gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm w-full md:w-auto overflow-hidden'>
                    <div className='hidden xs:flex items-center gap-2 px-2 md:px-3 text-muted-foreground shrink-0'>
                        <Filter size={16} />
                        <span className='text-[10px] font-black uppercase tracking-widest'>Filter</span>
                    </div>
                    <select
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                        className='flex-1 md:flex-none bg-secondary border border-border rounded-xl px-3 md:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground font-bold min-w-0'
                    >
                        <option value='all'>All Projects</option>
                        {projects.map(p => (
                            <option
                                key={p.id}
                                value={p.id}
                            >
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className='card overflow-hidden !p-0 shadow-2xl border-primary/10'>
                <div className='bg-secondary/50 border-b border-border p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
                    <div className='flex items-center gap-3 md:gap-4 w-full sm:w-auto'>
                        <div className='p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0'>
                            <BarChart
                                size={18}
                                className='md:w-5 md:h-5'
                            />
                        </div>
                        <h3 className='font-black text-xs md:text-sm uppercase tracking-[0.2em] text-foreground'>
                            Timeline Projection
                        </h3>
                    </div>
                    <div className='flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto'>
                        <button className='p-1.5 md:p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-all'>
                            <ChevronLeft size={18} />
                        </button>
                        <span className='text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground px-2 md:px-4 whitespace-nowrap'>
                            {today.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                        <button className='p-1.5 md:p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-all'>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className='overflow-x-auto custom-scrollbar no-scrollbar'>
                    <div className='min-w-[800px] md:min-w-[1200px]'>
                        {/* Header / Date line */}
                        <div className='flex border-b border-border bg-secondary/20'>
                            <div className='w-48 md:w-64 shrink-0 p-3 md:p-4 border-r border-border font-black text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground'>
                                Objective
                            </div>
                            <div className='flex-1 flex'>
                                {days.map((day, i) => (
                                    <div
                                        key={i}
                                        className='flex-1 min-w-[30px] md:min-w-[40px] border-r border-border/30 py-3 md:py-4 flex flex-col items-center justify-center gap-1'
                                    >
                                        <span className='text-[7px] md:text-[8px] font-black text-muted-foreground uppercase'>
                                            {day.toLocaleDateString(undefined, { weekday: 'narrow' })}
                                        </span>
                                        <span
                                            className={`text-[9px] md:text-[10px] font-black w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-lg ${i === 0 ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
                                        >
                                            {day.getDate()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grid rows */}
                        <div className='relative'>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className='flex border-b border-border animate-pulse'
                                    >
                                        <div className='w-48 md:w-64 shrink-0 p-6 border-r border-border bg-secondary/10'>
                                            <div className='h-4 bg-secondary rounded w-3/4'></div>
                                        </div>
                                        <div className='flex-1 p-6'>
                                            <div className='h-4 bg-secondary rounded w-1/2'></div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredTasks.length === 0 ? (
                                <div className='p-16 md:p-20 text-center'>
                                    <p className='text-xs md:text-sm font-bold text-muted-foreground italic'>
                                        No active objectives detected.
                                    </p>
                                </div>
                            ) : (
                                filteredTasks.map((task, idx) => {
                                    const startPos = Math.max(0, getDayPosition(task.createdAt));
                                    const endPos = getDayPosition(task.dueDate);
                                    const duration = Math.max(1, endPos - startPos + 1);
                                    const offset = startPos;

                                    const visibleDuration = Math.min(duration, 30 - offset);

                                    if (offset >= 30 || offset + visibleDuration <= 0) return null;

                                    return (
                                        <div
                                            key={task.id}
                                            className='flex border-b border-border hover:bg-secondary/20 transition-colors group'
                                        >
                                            <div className='w-48 md:w-64 shrink-0 p-3 md:p-4 border-r border-border flex flex-col justify-center gap-1 overflow-hidden'>
                                                <span className='font-bold text-[11px] md:text-xs truncate text-foreground group-hover:text-primary transition-colors'>
                                                    {task.title}
                                                </span>
                                                <div className='flex items-center gap-1.5 md:gap-2'>
                                                    <Briefcase
                                                        size={8}
                                                        className='text-muted-foreground'
                                                    />
                                                    <span className='text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-tighter truncate'>
                                                        {projects.find(p => p.id === task.projectId)?.name || 'General'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='flex-1 flex relative py-3 md:py-4'>
                                                {days.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className='flex-1 min-w-[30px] md:min-w-[40px] border-r border-border/20 h-full'
                                                    ></div>
                                                ))}

                                                <motion.div
                                                    initial={{ width: 0, opacity: 0 }}
                                                    animate={{
                                                        width: `${(visibleDuration / 30) * 100}%`,
                                                        left: `${(offset / 30) * 100}%`,
                                                        opacity: 1
                                                    }}
                                                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                                                    className={`absolute top-1/2 -translate-y-1/2 h-6 md:h-8 rounded-lg md:rounded-xl shadow-lg flex items-center px-2 md:px-3 overflow-hidden border ${
                                                        task.status === 'Done'
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                                            : task.priority === 'High'
                                                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                                              : 'bg-primary/10 border-primary/30 text-primary'
                                                    }`}
                                                >
                                                    <div
                                                        className={`absolute inset-y-0 left-0 w-1 md:w-1.5 ${
                                                            task.status === 'Done'
                                                                ? 'bg-emerald-500'
                                                                : task.priority === 'High'
                                                                  ? 'bg-rose-500'
                                                                  : 'bg-primary'
                                                        }`}
                                                    ></div>
                                                    <div className='flex flex-col ml-1 overflow-hidden'>
                                                        <span className='text-[7px] md:text-[9px] font-black uppercase tracking-widest whitespace-nowrap truncate'>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
                <div className='card bg-secondary/30 border-border p-6 md:p-8'>
                    <h4 className='text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 md:mb-6 flex items-center gap-2'>
                        <Clock
                            size={14}
                            className='text-primary'
                        />{' '}
                        Engagements
                    </h4>
                    <div className='space-y-3 md:space-y-4'>
                        {filteredTasks
                            .filter(t => t.status !== 'Done')
                            .slice(0, 3)
                            .map(task => (
                                <div
                                    key={task.id}
                                    className='flex items-center justify-between gap-4'
                                >
                                    <span className='text-[11px] md:text-xs font-bold text-foreground truncate max-w-[120px] md:max-w-[150px]'>
                                        {task.title}
                                    </span>
                                    <span className='text-[9px] md:text-[10px] font-black text-muted-foreground whitespace-nowrap'>
                                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            ))}
                        {filteredTasks.filter(t => t.status !== 'Done').length === 0 && (
                            <p className='text-xs text-muted-foreground italic'>No upcoming engagements.</p>
                        )}
                    </div>
                </div>

                <div className='md:col-span-2 card bg-primary text-primary-foreground p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group'>
                    <div className='absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000'></div>
                    <div className='relative z-10 max-w-md text-center sm:text-left'>
                        <h4 className='text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-3 md:mb-4 opacity-70'>
                            Strategic Momentum
                        </h4>
                        <p className='text-base md:text-lg font-black tracking-tight leading-tight'>
                            Team operational velocity has increased by 14% over last period.
                        </p>
                    </div>
                    <div className='relative z-10 flex flex-col items-center sm:items-end'>
                        <span className='text-4xl md:text-5xl font-black tracking-tighter'>11.4</span>
                        <span className='text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60'>
                            Pts / Day
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gantt;
