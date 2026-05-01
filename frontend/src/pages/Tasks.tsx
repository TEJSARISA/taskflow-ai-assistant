import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    LayoutGrid,
    List as ListIcon,
    X,
    CheckSquare
} from 'lucide-react';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { Task, Project } from '@/types';
import { Link } from 'react-router-dom';
import TaskModal from '@/components/tasks/TaskModal';

import { useUI } from '@/context/UIContext';
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';

const Tasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
    const { showToast } = useUI();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [t, p] = await Promise.all([taskService.getTasks(), projectService.getProjects()]);
                setTasks(t);
                setProjects(p);
            } catch (error) {
                console.error('Error fetching tasks data:', error);
                showToast('Failed to load tasks', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handleSaveTask = async (taskData: Partial<Task>) => {
        try {
            if (selectedTask) {
                const updated = await taskService.updateTask(selectedTask.id, taskData);
                setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
                showToast('Task updated successfully');
            } else {
                const created = await taskService.createTask(taskData);
                setTasks(prev => [created, ...prev]);
                showToast('Task created successfully');
            }
            setIsTaskModalOpen(false);
        } catch (error) {
            showToast('Failed to save task', 'error');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await taskService.deleteTask(taskId);
                setTasks(prev => prev.filter(t => t.id !== taskId));
                showToast('Task deleted successfully');
            } catch (error) {
                showToast('Failed to delete task', 'error');
            }
        }
    };

    const filteredTasks = tasks.filter(
        t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
    };

    return (
        <div className='space-y-6 md:space-y-10 pb-20'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div>
                    <h1 className='text-2xl md:text-4xl font-black tracking-tight text-foreground'>Task Inventory</h1>
                    <p className='text-muted-foreground mt-1 text-xs md:text-sm font-medium'>
                        Manage and execute individual action items
                    </p>
                </div>
                <div className='flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto'>
                    <div className='relative group w-full sm:w-auto flex-1 sm:flex-none'>
                        <Search
                            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
                            size={16}
                        />
                        <input
                            type='text'
                            placeholder='Search tasks...'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className='bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full md:w-64 transition-all text-foreground placeholder:text-muted-foreground'
                        />
                    </div>
                    <div className='flex items-center justify-between w-full sm:w-auto gap-3'>
                        <div className='flex items-center bg-secondary p-1 rounded-xl border border-border'>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedTask(undefined);
                                setIsTaskModalOpen(true);
                            }}
                            className='btn-primary flex-1 sm:flex-none'
                        >
                            <Plus size={20} />
                            <span>New Task</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10'>
                {[
                    {
                        label: 'Pending',
                        count: tasks.filter(t => t.status === 'To Do').length,
                        icon: Clock,
                        color: 'text-primary'
                    },
                    {
                        label: 'In Progress',
                        count: tasks.filter(t => t.status === 'In Progress').length,
                        icon: AlertCircle,
                        color: 'text-accent'
                    },
                    {
                        label: 'Completed',
                        count: tasks.filter(t => t.status === 'Done').length,
                        icon: CheckCircle2,
                        color: 'text-emerald-500'
                    }
                ].map((stat, i) => (
                    <div
                        key={i}
                        className='card flex items-center justify-between p-4 md:p-6'
                    >
                        <div className='flex items-center gap-3 md:gap-4'>
                            <div className={`p-2.5 md:p-3 rounded-xl bg-secondary ${stat.color}`}>
                                <stat.icon
                                    size={18}
                                    className='md:w-5 md:h-5'
                                />
                            </div>
                            <div>
                                <p className='text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                    {stat.label}
                                </p>
                                <p className='text-xl md:text-2xl font-black text-foreground'>{stat.count}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div
                    className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'
                            : 'card p-0 overflow-hidden'
                    }
                >
                    {viewMode === 'grid' ? (
                        [1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='w-full'>
                                <tbody className='divide-y divide-border'>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <TableRowSkeleton key={i} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className='text-center py-20 md:py-32 bg-card rounded-3xl border border-dashed border-border flex flex-col items-center justify-center px-4'>
                    <div className='w-16 h-16 md:w-20 md:h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 text-muted-foreground'>
                        <CheckSquare
                            size={32}
                            className='md:w-10 md:h-10'
                        />
                    </div>
                    <h3 className='text-xl md:text-2xl font-black text-foreground'>Operational Silence</h3>
                    <p className='text-muted-foreground mt-2 max-w-sm font-medium text-sm'>
                        No tasks found. Your itinerary is crystal clear, or your search criteria are too restrictive.
                        Ready to assign a new mission?
                    </p>
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className='btn-primary mt-8 px-8'
                    >
                        <Plus size={20} />
                        <span>Create New Task</span>
                    </button>
                </div>
            ) : viewMode === 'list' ? (
                <div className='card !p-0 overflow-hidden shadow-xl'>
                    <div className='overflow-x-auto'>
                        <table className='w-full min-w-[800px] md:min-w-0'>
                            <thead>
                                <tr className='text-left text-muted-foreground text-[10px] uppercase font-black tracking-widest bg-secondary/50'>
                                    <th className='px-6 md:px-8 py-4 md:py-5'>Task Details</th>
                                    <th className='px-6 md:px-8 py-4 md:py-5'>Project</th>
                                    <th className='px-6 md:px-8 py-4 md:py-5'>Priority</th>
                                    <th className='px-6 md:px-8 py-4 md:py-5'>Due Date</th>
                                    <th className='px-6 md:px-8 py-4 md:py-5 text-right'>Operations</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-border'>
                                {filteredTasks.map((task, index) => (
                                    <tr
                                        key={task.id}
                                        className='group hover:bg-secondary/30 transition-colors'
                                    >
                                        <td className='px-6 md:px-8 py-4 md:py-6'>
                                            <div className='flex items-center gap-4'>
                                                <div
                                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                                        task.status === 'Done'
                                                            ? 'bg-emerald-500'
                                                            : task.status === 'In Progress'
                                                              ? 'bg-primary'
                                                              : 'bg-muted-foreground/30'
                                                    }`}
                                                ></div>
                                                <div className='min-w-0'>
                                                    <p className='font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]'>
                                                        {task.title}
                                                    </p>
                                                    <p className='text-[10px] text-muted-foreground line-clamp-1 max-w-xs'>
                                                        {task.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-6 md:px-8 py-4 md:py-6 whitespace-nowrap'>
                                            <Link
                                                to={`/projects/${task.projectId}`}
                                                className='text-xs font-bold text-foreground/70 hover:text-primary transition-colors'
                                            >
                                                {getProjectName(task.projectId)}
                                            </Link>
                                        </td>
                                        <td className='px-6 md:px-8 py-4 md:py-6 whitespace-nowrap'>
                                            <span
                                                className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                                    task.priority === 'High'
                                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                        : task.priority === 'Medium'
                                                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}
                                            >
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className='px-6 md:px-8 py-4 md:py-6 whitespace-nowrap'>
                                            <p className='text-xs font-bold text-muted-foreground'>
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className='px-6 md:px-8 py-4 md:py-6 text-right whitespace-nowrap'>
                                            <div className='flex justify-end gap-1'>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTask(task);
                                                        setIsTaskModalOpen(true);
                                                    }}
                                                    className='w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all'
                                                >
                                                    <Plus
                                                        size={16}
                                                        className='rotate-45'
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className='w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all'
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredTasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className='card group hover:border-primary/30 transition-all p-5 md:p-6'
                        >
                            <div className='flex items-center justify-between mb-4'>
                                <span
                                    className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                        task.priority === 'High'
                                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            : task.priority === 'Medium'
                                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}
                                >
                                    {task.priority}
                                </span>
                                <div className='flex gap-1'>
                                    <button
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setIsTaskModalOpen(true);
                                        }}
                                        className='p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all'
                                    >
                                        <Plus
                                            size={14}
                                            className='rotate-45'
                                        />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className='p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all'
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            <h3 className='font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1'>
                                {task.title}
                            </h3>
                            <p className='text-muted-foreground text-xs line-clamp-2 mb-6 italic'>
                                "{task.description}"
                            </p>

                            <div className='flex items-center justify-between pt-4 border-t border-border'>
                                <div className='flex items-center gap-2'>
                                    <img
                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo}`}
                                        className='w-6 h-6 rounded-full bg-secondary'
                                        alt=''
                                    />
                                    <span className='text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[100px]'>
                                        {getProjectName(task.projectId)}
                                    </span>
                                </div>
                                <p className='text-[9px] md:text-[10px] font-bold text-muted-foreground'>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSaveTask}
                task={selectedTask}
            />
        </div>
    );
};

export default Tasks;
