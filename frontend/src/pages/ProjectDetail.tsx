import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    ChevronRight,
    FolderKanban,
    MessageSquare,
    Paperclip,
    X,
    LayoutDashboard,
    BarChart3,
    History,
    Clock,
    Calendar as CalendarIcon,
    CheckCircle2,
    AlertTriangle,
    Timer,
    Link2,
    Sparkles
} from 'lucide-react';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { activityLogService } from '@/services/activityLog.service';
import { Project, Task, TaskStatus } from '@/types';
import TaskModal from '@/components/tasks/TaskModal';
import ProjectMemberModal from '@/components/projects/ProjectMemberModal';
import { notificationService } from '@/services/notification.service';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    BarController,
    PieController,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    BarController,
    PieController,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const columns: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
type ViewMode = 'board' | 'analytics' | 'timeline' | 'activity';

const ProjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
    const [activeColumn, setActiveColumn] = useState<TaskStatus>('To Do');
    const [viewMode, setViewMode] = useState<ViewMode>('board');

    // Advanced data
    const [analytics, setAnalytics] = useState<any>(null);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [projectInsights, setProjectInsights] = useState<any>(null);
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

    const fetchData = useCallback(async () => {
        if (id) {
            try {
                const [p, t, a, logs] = await Promise.all([
                    projectService.getProjectById(id),
                    taskService.getTasks(id),
                    projectService.getProjectAnalytics(id),
                    activityLogService.getActivityLogs(id)
                ]);
                setProject(p || null);
                setTasks(t);
                setAnalytics(a);
                setActivityLogs(logs);

                // Fetch insights only if analytics view is active or periodically
                if (viewMode === 'analytics' && !projectInsights) {
                    generateInsights(t);
                }
            } catch (error) {
                console.error('Error fetching project data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [id, viewMode, projectInsights]);

    const generateInsights = async (currentTasks: Task[]) => {
        setIsGeneratingInsights(true);
        try {
            const { aiService } = await import('@/services/ai.service');
            const insights = await aiService.getProjectInsights(currentTasks);
            setProjectInsights(insights);
        } catch (error) {
            console.error('Error generating insights:', error);
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Set up polling for "real-time" updates
        const interval = setInterval(() => {
            if (viewMode === 'board' || viewMode === 'activity') {
                fetchData();
            }
        }, 10000); // every 10 seconds

        return () => clearInterval(interval);
    }, [fetchData, viewMode]);

    const onDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as TaskStatus;
        const updatedTasks = Array.from(tasks);
        const taskIndex = updatedTasks.findIndex(t => t.id === draggableId);

        if (taskIndex !== -1) {
            const task = updatedTasks[taskIndex];
            updatedTasks[taskIndex] = { ...task, status: newStatus };
            setTasks(updatedTasks);

            await taskService.updateTask(draggableId, { status: newStatus });

            notificationService.addNotification({
                message: `Strategic objective "${task.title}" updated to status: ${newStatus}.`,
                type: 'status_updated'
            });

            // Refresh analytics
            const updatedAnalytics = await projectService.getProjectAnalytics(id!);
            setAnalytics(updatedAnalytics);
        }
    };

    const handleSaveTask = async (taskData: Partial<Task>) => {
        if (selectedTask) {
            const updated = await taskService.updateTask(selectedTask.id, taskData);
            setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
            notificationService.addNotification({
                message: `Objective "${updated.title}" updated.`,
                type: 'status_updated'
            });
        } else {
            const created = await taskService.createTask({ ...taskData, projectId: id, status: activeColumn });
            setTasks(prev => [created, ...prev]);
            notificationService.addNotification({
                message: `New strategic objective "${created.title}" committed.`,
                type: 'task_assigned'
            });
        }
        fetchData(); // Full refresh for analytics and logs
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Decommission this objective dossier?')) {
            await taskService.deleteTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            fetchData();
        }
    };

    if (loading)
        return (
            <div className='flex flex-col items-center justify-center h-[60vh] gap-4'>
                <div className='w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-2xl shadow-primary/20'></div>
                <p className='text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] animate-pulse'>
                    Syncing Intelligence Matrix...
                </p>
            </div>
        );

    if (!project)
        return (
            <div className='p-10 text-center font-black text-muted-foreground uppercase tracking-widest'>
                Dossier not found in repository.
            </div>
        );

    return (
        <div className='h-full flex flex-col space-y-6 md:space-y-8 pb-10'>
            <header className='flex flex-col lg:flex-row lg:items-end justify-between gap-6'>
                <div className='min-w-0'>
                    <div className='flex items-center gap-2 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4 overflow-x-auto whitespace-nowrap no-scrollbar'>
                        <Link
                            to='/projects'
                            className='hover:text-primary transition-colors'
                        >
                            Portfolios
                        </Link>
                        <ChevronRight
                            size={10}
                            className='shrink-0'
                        />
                        <span className='text-muted-foreground truncate'>{project.name}</span>
                    </div>
                    <div className='flex items-center gap-3 md:gap-5'>
                        <div className='w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0'>
                            <FolderKanban
                                size={24}
                                className='md:w-8 md:h-8'
                            />
                        </div>
                        <div className='min-w-0'>
                            <h1 className='text-2xl md:text-4xl font-black tracking-tighter text-foreground truncate'>
                                {project.name}
                            </h1>
                            <div className='flex items-center gap-2 md:gap-3 mt-1 md:mt-2 overflow-x-auto no-scrollbar whitespace-nowrap'>
                                <span className='text-muted-foreground text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-secondary px-2 py-0.5 rounded border border-border'>
                                    ID: {project.id.toUpperCase().slice(0, 8)}
                                </span>
                                <div className='h-3 w-px bg-border'></div>
                                <span
                                    className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${project.status === 'Active' ? 'text-primary' : 'text-muted-foreground'}`}
                                >
                                    {project.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5'>
                    <div className='flex items-center gap-3'>
                        <div className='flex items-center'>
                            <button
                                onClick={() => setIsMemberModalOpen(true)}
                                className='w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 border-dashed border-border bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-lg shrink-0'
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                    <div className='hidden sm:block h-10 w-px bg-border'></div>
                    <button
                        onClick={() => {
                            setSelectedTask(undefined);
                            setActiveColumn('To Do');
                            setIsTaskModalOpen(true);
                        }}
                        className='btn-primary w-full sm:w-auto px-6 md:px-10 py-3 shadow-xl shadow-primary/30'
                    >
                        <Plus size={20} />
                        <span>New Objective</span>
                    </button>
                </div>
            </header>

            <div className='flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 py-4 border-y border-border/50'>
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8'>
                    <div className='relative group w-full sm:w-64 md:w-80'>
                        <Search
                            className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
                            size={16}
                        />
                        <input
                            type='text'
                            placeholder='Filter dossiers...'
                            className='w-full bg-secondary border border-border rounded-2xl py-2.5 md:py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground'
                        />
                    </div>
                    <div className='flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar'>
                        <div className='flex items-center gap-2 px-2.5 py-1.5 bg-foreground/10 border border-border rounded-xl whitespace-nowrap shrink-0'>
                            <AlertTriangle
                                size={12}
                                className='text-foreground'
                            />
                            <span className='text-[9px] md:text-[10px] font-black uppercase tracking-widest text-foreground'>
                                2 Critical
                            </span>
                        </div>
                        <div className='flex items-center gap-2 px-2.5 py-1.5 bg-secondary border border-border rounded-xl whitespace-nowrap shrink-0'>
                            <CheckCircle2
                                size={12}
                                className='text-muted-foreground'
                            />
                            <span className='text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                Optimal Pace
                            </span>
                        </div>
                    </div>
                </div>
                <div className='flex items-center gap-1 p-1 bg-secondary/50 rounded-2xl border border-border overflow-x-auto no-scrollbar'>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`flex items-center gap-1.5 px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${viewMode === 'board' ? 'bg-primary text-primary-foreground shadow-xl' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <LayoutDashboard size={14} /> Board
                    </button>
                    <button
                        onClick={() => setViewMode('analytics')}
                        className={`flex items-center gap-1.5 px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${viewMode === 'analytics' ? 'bg-primary text-primary-foreground shadow-xl' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <BarChart3 size={14} /> Intelligence
                    </button>
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`flex items-center gap-1.5 px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${viewMode === 'timeline' ? 'bg-primary text-primary-foreground shadow-xl' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <CalendarIcon size={14} /> Timeline
                    </button>
                    <button
                        onClick={() => setViewMode('activity')}
                        className={`flex items-center gap-1.5 px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${viewMode === 'activity' ? 'bg-primary text-primary-foreground shadow-xl' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <History size={14} /> Logs
                    </button>
                </div>
            </div>

            <main className='flex-1 min-h-[500px]'>
                <AnimatePresence mode='wait'>
                    {viewMode === 'board' && (
                        <motion.div
                            key='board'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className='h-full'
                        >
                            <DragDropContext onDragEnd={onDragEnd}>
                                <div className='flex gap-4 md:gap-8 h-full overflow-x-auto pb-6 custom-scrollbar px-1'>
                                    {columns.map(col => (
                                        <div
                                            key={col}
                                            className='min-w-[280px] sm:min-w-[320px] md:min-w-[360px] flex-1 flex flex-col'
                                        >
                                            <div className='flex items-center justify-between mb-4 md:mb-6 px-2 md:px-4'>
                                                <div className='flex items-center gap-3'>
                                                    <div
                                                        className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                                                            col === 'To Do'
                                                                ? 'bg-muted-foreground/30'
                                                                : col === 'In Progress'
                                                                  ? 'bg-primary shadow-primary/20 animate-pulse'
                                                                  : 'bg-foreground/50 shadow-foreground/20'
                                                        }`}
                                                    ></div>
                                                    <h3 className='font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground'>
                                                        {col}
                                                    </h3>
                                                    <span className='px-2 md:px-3 py-0.5 md:py-1 rounded-xl bg-secondary text-[9px] md:text-[11px] text-muted-foreground font-black border border-border'>
                                                        {tasks.filter(t => t.status === col).length}
                                                    </span>
                                                </div>
                                            </div>

                                            <Droppable droppableId={col}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className={`flex-1 space-y-4 p-2 md:p-3 rounded-3xl transition-all duration-500 ${
                                                            snapshot.isDraggingOver
                                                                ? 'bg-primary/5 ring-1 ring-primary/20 shadow-inner'
                                                                : 'bg-transparent'
                                                        }`}
                                                    >
                                                        {tasks
                                                            .filter(t => t.status === col)
                                                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                                                            .map((task, index) => (
                                                                <Draggable
                                                                    key={task.id}
                                                                    draggableId={task.id}
                                                                    index={index}
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            className={`card p-4 md:p-6 group cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all duration-300 hover:shadow-2xl ${
                                                                                snapshot.isDragging
                                                                                    ? 'shadow-2xl shadow-primary/30 scale-[1.05] border-primary/40 bg-card z-50'
                                                                                    : ''
                                                                            }`}
                                                                            onClick={() => {
                                                                                setSelectedTask(task);
                                                                                setIsTaskModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <div className='flex items-start justify-between mb-4 md:mb-5'>
                                                                                <div className='flex flex-wrap gap-2'>
                                                                                    <span
                                                                                        className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
                                                                                            task.priority === 'High'
                                                                                                ? 'bg-foreground text-background border-foreground shadow-lg shadow-foreground/10'
                                                                                                : task.priority ===
                                                                                                    'Medium'
                                                                                                  ? 'bg-secondary text-foreground border-border'
                                                                                                  : 'bg-transparent text-muted-foreground border-border'
                                                                                        }`}
                                                                                    >
                                                                                        {task.priority}
                                                                                    </span>
                                                                                    {task.dependencies &&
                                                                                        task.dependencies.length >
                                                                                            0 && (
                                                                                            <span className='bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1'>
                                                                                                <Link2 size={8} /> Link
                                                                                            </span>
                                                                                        )}
                                                                                </div>
                                                                                <div className='flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'>
                                                                                    <button
                                                                                        onClick={e => {
                                                                                            e.stopPropagation();
                                                                                            handleDeleteTask(task.id);
                                                                                        }}
                                                                                        className='p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all'
                                                                                    >
                                                                                        <X size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <h4 className='font-bold text-base md:text-lg mb-2 group-hover:text-primary transition-colors tracking-tight leading-snug text-foreground line-clamp-2'>
                                                                                {task.title}
                                                                            </h4>
                                                                            <p className='text-muted-foreground text-[10px] md:text-xs line-clamp-2 mb-4 md:mb-6 font-medium leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity'>
                                                                                "{task.description}"
                                                                            </p>

                                                                            <div className='flex items-center justify-between pt-4 md:pt-5 border-t border-border/50'>
                                                                                <div className='flex items-center gap-2 md:gap-3 min-w-0'>
                                                                                    <div className='relative shrink-0'>
                                                                                        <img
                                                                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo || 'anonymous'}`}
                                                                                            alt='assignee'
                                                                                            className='w-7 h-7 md:w-8 md:h-8 rounded-xl border-2 border-background bg-secondary shadow-lg group-hover:scale-110 transition-transform'
                                                                                        />
                                                                                        <div className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background shadow-lg'></div>
                                                                                    </div>
                                                                                    <div className='flex flex-col min-w-0'>
                                                                                        <span className='text-[9px] md:text-[10px] font-black text-foreground uppercase tracking-tighter truncate'>
                                                                                            {task.assignee?.name ||
                                                                                                'Inert Operator'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className='flex items-center gap-3 md:gap-4 text-muted-foreground shrink-0'>
                                                                                    <div className='flex items-center gap-1 hover:text-primary transition-colors'>
                                                                                        <MessageSquare size={12} />
                                                                                        <span className='text-[10px] font-black'>
                                                                                            4
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className='flex items-center gap-1 hover:text-accent transition-colors'>
                                                                                        <Paperclip size={12} />
                                                                                        <span className='text-[10px] font-black'>
                                                                                            2
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    ))}
                                    <div className='min-w-[280px] sm:min-w-[320px] md:min-w-[360px] flex flex-col pt-2 opacity-20 hover:opacity-100 transition-all duration-500'>
                                        <button className='h-full rounded-[2.5rem] border-4 border-dashed border-border flex flex-col items-center justify-center gap-6 group hover:border-primary/30 bg-secondary/10'>
                                            <div className='w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] bg-secondary border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xl'>
                                                <Plus
                                                    size={24}
                                                    className='md:w-8 md:h-8'
                                                />
                                            </div>
                                            <span className='text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-muted-foreground group-hover:text-primary'>
                                                Expansion
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </DragDropContext>
                        </motion.div>
                    )}

                    {viewMode === 'analytics' && (
                        <motion.div
                            key='analytics'
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className='grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8'
                        >
                            <div className='lg:col-span-2 space-y-6 md:space-y-8'>
                                <div className='grid grid-cols-2 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6'>
                                    {[
                                        {
                                            label: 'Total',
                                            value: analytics?.totalTasks || 0,
                                            icon: FolderKanban,
                                            color: 'primary'
                                        },
                                        {
                                            label: 'Done',
                                            value: analytics?.completedTasks || 0,
                                            icon: CheckCircle2,
                                            color: 'primary'
                                        },
                                        {
                                            label: 'Active',
                                            value: analytics?.inProgressTasks || 0,
                                            icon: Timer,
                                            color: 'primary'
                                        },
                                        {
                                            label: 'Rate',
                                            value: `${Math.round(analytics?.completionRate || 0)}%`,
                                            icon: BarChart3,
                                            color: 'primary'
                                        }
                                    ].map((stat, i) => (
                                        <div
                                            key={i}
                                            className='card p-4 md:p-6 border border-border/50 bg-secondary/20 shadow-xl'
                                        >
                                            <div className='w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 md:mb-4'>
                                                <stat.icon
                                                    size={18}
                                                    className='md:w-5 md:h-5'
                                                />
                                            </div>
                                            <p className='text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1'>
                                                {stat.label}
                                            </p>
                                            <h3 className='text-xl md:text-2xl font-black text-foreground'>
                                                {stat.value}
                                            </h3>
                                        </div>
                                    ))}
                                </div>

                                <div className='card p-5 md:p-8 bg-secondary/10 border border-border shadow-2xl'>
                                    <h3 className='text-xs md:text-sm font-black uppercase tracking-[0.2em] text-foreground mb-6 md:mb-8 flex items-center gap-3'>
                                        <BarChart3
                                            size={18}
                                            className='text-primary'
                                        />{' '}
                                        Distribution
                                    </h3>
                                    <div className='h-[250px] md:h-[300px]'>
                                        <Bar
                                            data={{
                                                labels: ['To Do', 'Active', 'Done'],
                                                datasets: [
                                                    {
                                                        label: 'Count',
                                                        data: [
                                                            analytics?.pendingTasks || 0,
                                                            analytics?.inProgressTasks || 0,
                                                            analytics?.completedTasks || 0
                                                        ],
                                                        backgroundColor: ['#737373', '#FFFFFF', '#262626'],
                                                        borderColor: ['#525252', '#E5E5E5', '#171717'],
                                                        borderWidth: 2,
                                                        borderRadius: 12
                                                    }
                                                ]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                                        ticks: { color: '#737373' }
                                                    },
                                                    x: { grid: { display: false }, ticks: { color: '#737373' } }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='space-y-6 md:space-y-8'>
                                <div className='card p-6 md:p-8 bg-secondary/10 border border-primary/20 shadow-2xl relative overflow-hidden group'>
                                    <div className='absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all'></div>
                                    <h3 className='text-xs md:text-sm font-black uppercase tracking-[0.2em] text-foreground mb-6 flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                            <Sparkles
                                                size={18}
                                                className='text-primary'
                                            />{' '}
                                            Strategic Insights
                                        </div>
                                        {projectInsights && (
                                            <span className='text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20'>
                                                Score: {projectInsights.healthScore}
                                            </span>
                                        )}
                                    </h3>

                                    {isGeneratingInsights ? (
                                        <div className='py-10 flex flex-col items-center justify-center gap-4 text-center'>
                                            <div className='w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin'></div>
                                            <p className='text-[9px] font-black uppercase tracking-widest text-muted-foreground'>
                                                Generating Neural Insights...
                                            </p>
                                        </div>
                                    ) : projectInsights ? (
                                        <div className='space-y-4'>
                                            {projectInsights.insights.map((insight: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className='flex gap-4 p-3 md:p-4 bg-background/50 border border-border rounded-2xl group hover:border-primary/30 transition-all'
                                                >
                                                    <div className='w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shrink-0'>
                                                        {i + 1}
                                                    </div>
                                                    <p className='text-[11px] md:text-xs font-medium text-foreground/80 leading-relaxed italic line-clamp-3'>
                                                        "{insight}"
                                                    </p>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => generateInsights(tasks)}
                                                className='w-full py-3 bg-primary text-primary-foreground rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all'
                                            >
                                                Refresh Analysis
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='py-10 text-center'>
                                            <button
                                                onClick={() => generateInsights(tasks)}
                                                className='btn-primary px-8 py-3 text-[10px] uppercase tracking-widest'
                                            >
                                                Initiate Analysis
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className='card p-6 md:p-8 bg-secondary/10 border border-border shadow-2xl'>
                                    <h3 className='text-xs md:text-sm font-black uppercase tracking-[0.2em] text-foreground mb-6 md:mb-8 flex items-center gap-3'>
                                        <AlertTriangle
                                            size={18}
                                            className='text-foreground'
                                        />{' '}
                                        Priorities
                                    </h3>
                                    <div className='h-[200px] md:h-[250px] flex items-center justify-center'>
                                        <Pie
                                            data={{
                                                labels: ['High', 'Med', 'Low'],
                                                datasets: [
                                                    {
                                                        data: [
                                                            analytics?.priorityDistribution?.High || 0,
                                                            analytics?.priorityDistribution?.Medium || 0,
                                                            analytics?.priorityDistribution?.Low || 0
                                                        ],
                                                        backgroundColor: ['#FFFFFF', '#737373', '#262626'],
                                                        borderWidth: 0,
                                                        hoverOffset: 15
                                                    }
                                                ]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                        labels: { color: '#737373', font: { weight: 'bold', size: 9 } }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className='card p-6 md:p-8 bg-primary text-primary-foreground shadow-2xl'>
                                    <h3 className='text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-3 opacity-80'>
                                        <Clock size={16} /> Efficiency
                                    </h3>
                                    <div className='space-y-4 md:space-y-6'>
                                        <div>
                                            <div className='flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-2 opacity-70'>
                                                <span>Actual Span</span>
                                                <span>{analytics?.totalActualTime || 0}m</span>
                                            </div>
                                            <div className='h-1.5 md:h-2 w-full bg-white/20 rounded-full overflow-hidden'>
                                                <div
                                                    className='h-full bg-white transition-all duration-1000'
                                                    style={{
                                                        width: `${Math.min((analytics?.totalActualTime / (analytics?.totalEstimatedTime || 1)) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        <p className='text-[10px] md:text-[11px] leading-relaxed font-medium opacity-80 italic'>
                                            System analysis indicates{' '}
                                            {analytics?.totalActualTime > analytics?.totalEstimatedTime
                                                ? 'over-engagement'
                                                : 'optimal velocity'}
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'activity' && (
                        <motion.div
                            key='activity'
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className='card bg-secondary/10 border border-border p-5 md:p-8 shadow-2xl max-w-4xl mx-auto overflow-hidden'
                        >
                            <h3 className='text-xs md:text-sm font-black uppercase tracking-[0.2em] text-foreground mb-6 md:mb-8 flex items-center gap-3'>
                                <History
                                    size={18}
                                    className='text-primary'
                                />{' '}
                                Activity Logs
                            </h3>
                            <div className='space-y-5 md:space-y-6 relative'>
                                <div className='absolute left-3 md:left-4 top-0 bottom-0 w-px bg-border/50'></div>
                                {activityLogs.length === 0 ? (
                                    <div className='text-center py-10 md:py-12'>
                                        <p className='text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-widest'>
                                            No activity archives.
                                        </p>
                                    </div>
                                ) : (
                                    activityLogs.map(log => (
                                        <div
                                            key={log.id}
                                            className='relative pl-10 md:pl-12 group'
                                        >
                                            <div className='absolute left-[11px] md:left-[13px] top-1.5 w-2 h-2 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform'></div>
                                            <div className='bg-background/50 border border-border p-4 md:p-5 rounded-2xl hover:border-primary/30 transition-all duration-300'>
                                                <div className='flex items-center justify-between mb-3 gap-2'>
                                                    <span className='text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/5 rounded border border-primary/10 truncate max-w-[150px]'>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className='text-[8px] md:text-[10px] font-bold text-muted-foreground whitespace-nowrap'>
                                                        {new Date(log.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className='flex items-center gap-3 min-w-0'>
                                                    <img
                                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${log.userId || 'system'}`}
                                                        className='w-5 h-5 md:w-6 md:h-6 rounded-lg bg-secondary border border-border shrink-0'
                                                        alt=''
                                                    />
                                                    <p className='text-[11px] md:text-xs font-medium text-foreground truncate'>
                                                        <span className='font-black text-primary'>
                                                            {log.user?.name || 'System'}
                                                        </span>{' '}
                                                        executed update.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'timeline' && (
                        <motion.div
                            key='timeline'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className='card bg-secondary/10 border border-border p-5 md:p-8 shadow-2xl overflow-hidden'
                        >
                            <h3 className='text-xs md:text-sm font-black uppercase tracking-[0.2em] text-foreground mb-6 md:mb-8 flex items-center gap-3'>
                                <CalendarIcon
                                    size={18}
                                    className='text-primary'
                                />{' '}
                                Strategic Timeline
                            </h3>
                            <div className='overflow-x-auto no-scrollbar pb-4'>
                                <div className='min-w-[600px] space-y-2'>
                                    <div className='flex border-b border-border/50 pb-3 md:pb-4 mb-4'>
                                        <div className='w-1/3 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                            Objective
                                        </div>
                                        <div className='flex-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                            Span
                                        </div>
                                    </div>
                                    {tasks
                                        .sort(
                                            (a, b) =>
                                                new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
                                        )
                                        .map((task, i) => (
                                            <div
                                                key={task.id}
                                                className='flex items-center py-3 md:py-4 border-b border-border/30 group hover:bg-secondary/20 transition-colors rounded-xl px-2'
                                            >
                                                <div className='w-1/3 pr-4 min-w-0'>
                                                    <p className='text-[11px] md:text-xs font-bold text-foreground truncate'>
                                                        {task.title}
                                                    </p>
                                                    <p className='text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-tighter mt-1'>
                                                        {task.status}
                                                    </p>
                                                </div>
                                                <div className='flex-1 h-6 md:h-8 bg-secondary/30 rounded-lg relative overflow-hidden'>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width:
                                                                task.status === 'Done'
                                                                    ? '100%'
                                                                    : task.status === 'In Progress'
                                                                      ? '60%'
                                                                      : '15%',
                                                            marginLeft: `${(i * 10) % 40}%`
                                                        }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                        className={`h-full rounded-lg shadow-lg flex items-center px-2 md:px-3 ${
                                                            task.priority === 'High'
                                                                ? 'bg-foreground text-background shadow-foreground/20'
                                                                : task.priority === 'Medium'
                                                                  ? 'bg-primary text-primary-foreground shadow-primary/20'
                                                                  : 'bg-secondary text-foreground border border-border'
                                                        }`}
                                                    >
                                                        <span className='text-[7px] md:text-[8px] font-black text-white uppercase tracking-widest truncate'>
                                                            {new Date(task.dueDate || '').toLocaleDateString(
                                                                undefined,
                                                                { month: 'short', day: 'numeric' }
                                                            )}
                                                        </span>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <div className='mt-8 md:mt-12 p-3 md:p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 md:gap-4'>
                                <div className='w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0'>
                                    <CheckCircle2
                                        size={18}
                                        className='md:w-5 md:h-5'
                                    />
                                </div>
                                <p className='text-[10px] md:text-[11px] font-medium text-muted-foreground leading-relaxed italic'>
                                    Timeline projection synchronized. Parameters within optimal range.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSaveTask}
                task={selectedTask}
                projectId={id || ''}
            />

            {project && (
                <ProjectMemberModal
                    isOpen={isMemberModalOpen}
                    onClose={() => setIsMemberModalOpen(false)}
                    project={project}
                    onUpdate={updated => setProject(updated)}
                />
            )}
        </div>
    );
};

export default ProjectDetail;
