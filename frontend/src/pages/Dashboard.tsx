import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, CheckCircle2, Clock, AlertCircle, ArrowUpRight, Plus, Calendar, History } from 'lucide-react';
import {
    Chart as ChartJS,
    LineController,
    BarController,
    DoughnutController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Chart, Doughnut } from 'react-chartjs-2';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { activityLogService } from '@/services/activityLog.service';
import { Project, Task } from '@/types';
import ProjectModal from '@/components/projects/ProjectModal';
import TaskModal from '@/components/tasks/TaskModal';
import { useNavigate, Link } from 'react-router-dom';
import { useUI } from '@/context/UIContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';
import { TextRevealByWord } from '@/components/ui/text-reveal';

ChartJS.register(
    LineController,
    BarController,
    DoughnutController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardProps {
    theme?: string;
}

const Dashboard = ({ theme }: DashboardProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
    const { showToast } = useUI();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [p, t, logs] = await Promise.all([
                    projectService.getProjects(),
                    taskService.getTasks(),
                    activityLogService.getActivityLogs()
                ]);
                setProjects(Array.isArray(p) ? p : []);
                setTasks(Array.isArray(t) ? t : []);
                setActivityLogs(Array.isArray(logs) ? logs : []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showToast('Failed to fetch dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handleSaveProject = async (projectData: Partial<Project>) => {
        try {
            const created = await projectService.createProject(projectData);
            setProjects(prev => [created, ...prev]);
            showToast('Project created successfully');
            setIsProjectModalOpen(false);
        } catch (error) {
            showToast('Failed to create project', 'error');
        }
    };

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

    const isDark = theme === 'dark' || document.documentElement.classList.contains('dark');

    const overdueCount = tasks.filter(t => {
        if (t.status === 'Done' || !t.dueDate) return false;
        const dueTs = Date.parse(t.dueDate);
        return Number.isFinite(dueTs) ? dueTs < Date.now() : false;
    }).length;

    const stats = [
        {
            label: 'Total Tasks',
            value: tasks.length,
            icon: Briefcase,
            color: 'text-primary',
            bg: 'bg-primary/10',
            trend: '+2.5%'
        },
        {
            label: 'In Progress',
            value: tasks.filter(t => t.status === 'In Progress').length,
            icon: Clock,
            color: 'text-foreground',
            bg: 'bg-foreground/10',
            trend: '+12%'
        },
        {
            label: 'Completed',
            value: tasks.filter(t => t.status === 'Done').length,
            icon: CheckCircle2,
            color: 'text-muted-foreground',
            bg: 'bg-muted-foreground/10',
            trend: '+18%'
        },
        {
            label: 'Overdue',
            value: overdueCount,
            icon: AlertCircle,
            color: 'text-foreground/50',
            bg: 'bg-foreground/5',
            trend: '+4%'
        }
    ];

    const statusData = {
        labels: ['To Do', 'In Progress', 'Done'],
        datasets: [
            {
                data: [
                    tasks.filter(t => t.status === 'To Do').length,
                    tasks.filter(t => t.status === 'In Progress').length,
                    tasks.filter(t => t.status === 'Done').length
                ],
                backgroundColor: ['#737373', '#FFFFFF', '#262626'],
                borderWidth: 0
            }
        ]
    };

    const chartData = React.useMemo(
        () => ({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    fill: chartType === 'line',
                    label: 'Velocity',
                    data: [45, 52, 48, 70, 65, 85],
                    borderColor: isDark ? '#FFFFFF' : '#000000',
                    backgroundColor:
                        chartType === 'line'
                            ? isDark
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.05)'
                            : isDark
                              ? '#FFFFFF'
                              : '#000000',
                    tension: 0.4,
                    borderWidth: chartType === 'line' ? 3 : 2,
                    pointRadius: chartType === 'line' ? 5 : 0,
                    pointBackgroundColor: isDark ? '#FFFFFF' : '#000000',
                    borderRadius: 6
                }
            ]
        }),
        [isDark, chartType]
    );

    const chartOptions = React.useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeInOutQuart' as const
            },
            hover: {
                mode: 'index' as const,
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
                    titleColor: isDark ? '#FFFFFF' : '#000000',
                    bodyColor: isDark ? '#A3A3A3' : '#737373',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    borderWidth: 1,
                    borderColor: isDark ? '#262626' : '#E5E5E5'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    display: true,
                    grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', drawBorder: false },
                    ticks: { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', font: { size: 10 } }
                }
            }
        }),
        [isDark]
    );

    return (
        <div className='space-y-6 md:space-y-10 pb-20'>
            <header className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
                <div>
                    <div className='h-12 md:h-16 overflow-hidden flex items-center'>
                        <TextRevealByWord
                            text='Executive Overview'
                            className='text-2xl md:text-4xl font-black tracking-tight text-foreground p-0 m-0'
                        />
                    </div>
                    <p className='text-muted-foreground mt-1 text-xs md:text-sm font-medium italic'>
                        Performance metrics for Q1 2026
                    </p>
                </div>
                <div className='flex items-center gap-3 w-full sm:w-auto'>
                    <button className='btn-secondary flex-1 sm:flex-none'>
                        <Calendar size={18} />
                        <span className='hidden xs:inline'>Schedule</span>
                    </button>
                    <button
                        onClick={() => setIsProjectModalOpen(true)}
                        className='btn-primary flex-1 sm:flex-none'
                    >
                        <Plus size={20} />
                        <span>New Initiative</span>
                    </button>
                </div>
            </header>

            <div className='grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
                {loading
                    ? [1, 2, 3, 4].map(i => (
                          <Skeleton
                              key={i}
                              className='h-32'
                          />
                      ))
                    : stats.map((stat, index) => (
                          <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className='card p-4 md:p-6 group cursor-default shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500'
                          >
                              <div className='flex items-center justify-between mb-3 md:mb-4'>
                                  <div
                                      className={`p-2 md:p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-inner`}
                                  >
                                      <stat.icon
                                          size={18}
                                          className='md:w-[22px] md:h-[22px]'
                                      />
                                  </div>
                                  <div className='flex items-center gap-1 text-emerald-500 text-[10px] md:text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20'>
                                      <span>{stat.trend}</span>
                                      <ArrowUpRight
                                          size={10}
                                          className='md:w-3 md:h-3'
                                      />
                                  </div>
                              </div>
                              <h3 className='text-muted-foreground font-black text-[9px] md:text-[10px] uppercase tracking-widest'>
                                  {stat.label}
                              </h3>
                              <p className='text-2xl md:text-3xl font-black mt-1 md:mt-2 tracking-tighter text-foreground'>
                                  {stat.value}
                              </p>
                          </motion.div>
                      ))}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8'>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='lg:col-span-2 card p-4 md:p-8 flex flex-col shadow-2xl'
                >
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-10 gap-4'>
                        <div>
                            <h3 className='text-lg md:text-xl font-black text-foreground'>Performance Velocity</h3>
                            <p className='text-muted-foreground text-[10px] md:text-xs font-medium italic'>
                                Aggregate team throughput over time
                            </p>
                        </div>
                        <div className='flex items-center gap-1 bg-secondary p-1 rounded-lg border border-border w-fit'>
                            <button
                                onClick={() => setChartType('line')}
                                className={`px-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase rounded transition-all duration-300 ${
                                    chartType === 'line'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Line
                            </button>
                            <button
                                onClick={() => setChartType('bar')}
                                className={`px-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase rounded transition-all duration-300 ${
                                    chartType === 'bar'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Bar
                            </button>
                        </div>
                    </div>
                    <div className='flex-1 min-h-[250px] md:min-h-[300px] relative overflow-hidden'>
                        {loading ? (
                            <Skeleton className='w-full h-full rounded-2xl' />
                        ) : (
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={`${chartType}-${isDark ? 'dark' : 'light'}`}
                                    initial={{ opacity: 0, scale: 0.98, x: chartType === 'line' ? -10 : 10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 1.02, x: chartType === 'line' ? 10 : -10 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className='w-full h-full'
                                >
                                    <Chart
                                        type={chartType}
                                        data={chartData}
                                        options={chartOptions as any}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='card p-4 md:p-8 shadow-2xl flex flex-col'
                >
                    <h3 className='text-lg md:text-xl font-black text-foreground mb-6 md:mb-8'>Status Distribution</h3>
                    <div className='flex-1 min-h-[200px] flex items-center justify-center'>
                        <div className='w-full max-w-[200px] aspect-square'>
                            <Doughnut
                                data={statusData}
                                options={{
                                    cutout: '70%',
                                    plugins: { legend: { display: false } },
                                    maintainAspectRatio: true
                                }}
                            />
                        </div>
                    </div>
                    <div className='mt-6 space-y-2'>
                        {[
                            {
                                label: 'To Do',
                                color: 'bg-[#737373]',
                                count: tasks.filter(t => t.status === 'To Do').length
                            },
                            {
                                label: 'In Progress',
                                color: 'bg-[#FFFFFF]',
                                count: tasks.filter(t => t.status === 'In Progress').length
                            },
                            {
                                label: 'Done',
                                color: 'bg-[#262626]',
                                count: tasks.filter(t => t.status === 'Done').length
                            }
                        ].map(item => (
                            <div
                                key={item.label}
                                className='flex items-center justify-between text-[10px] font-bold'
                            >
                                <div className='flex items-center gap-2'>
                                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                    <span className='text-muted-foreground uppercase'>{item.label}</span>
                                </div>
                                <span className='text-foreground'>{item.count}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <section className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-xl font-black text-foreground uppercase tracking-tight'>Active Portfolios</h3>
                    <Link
                        to='/projects'
                        className='btn-secondary py-2 text-[10px]'
                    >
                        View All Portfolios
                    </Link>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {projects.slice(0, 3).map(project => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className='card p-6 group cursor-pointer hover:border-primary/40 transition-all duration-500 relative overflow-hidden'
                            style={{ borderTop: `4px solid ${project.color || 'var(--primary)'}` }}
                        >
                            <div className='flex items-center justify-between mb-4'>
                                {' '}
                                <div
                                    className='w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border group-hover:bg-primary/5 group-hover:border-primary/30 transition-all'
                                    style={{ color: project.color }}
                                >
                                    <span className='font-black text-lg'>{project.name.charAt(0)}</span>
                                </div>
                            </div>
                            <h4 className='font-black text-lg text-foreground group-hover:text-primary transition-colors mb-2'>
                                {project.name}
                            </h4>
                            <p className='text-xs text-muted-foreground line-clamp-2 mb-6 italic'>
                                "{project.description}"
                            </p>

                            <div className='space-y-2 mt-auto'>
                                <div className='flex justify-between text-[10px] font-bold'>
                                    <span className='text-muted-foreground uppercase'>Progress</span>
                                    <span className='text-primary'>75%</span>
                                </div>
                                <div className='w-full bg-secondary h-1.5 rounded-full overflow-hidden'>
                                    <div className='bg-primary h-full rounded-full w-3/4'></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8'>
                <div className='card overflow-hidden !p-0 shadow-2xl'>
                    <div className='p-4 md:p-8 border-b border-border flex items-center justify-between bg-secondary/5'>
                        <div>
                            <h3 className='text-lg md:text-xl font-black text-foreground'>Strategic Deadlines</h3>
                            <p className='text-muted-foreground text-[10px] md:text-xs font-medium italic'>
                                Priority action items
                            </p>
                        </div>
                        <Link
                            to='/tasks'
                            className='text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:underline'
                        >
                            Full Inventory
                        </Link>
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='w-full min-w-[500px] md:min-w-0'>
                            <tbody className='divide-y divide-border'>
                                {tasks.length === 0 ? (
                                    <tr>
                                        <td className='px-4 md:px-8 py-10 text-center text-muted-foreground italic text-xs'>
                                            Zero pending high-priority dossiers.
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.slice(0, 5).map(task => (
                                        <tr
                                            key={task.id}
                                            className='group hover:bg-secondary/30 transition-colors cursor-pointer'
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setIsTaskModalOpen(true);
                                            }}
                                        >
                                            <td className='px-4 md:px-8 py-4 md:py-5'>
                                                <div className='flex items-center gap-3 md:gap-4'>
                                                    <div
                                                        className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'High' ? 'bg-foreground shadow-lg shadow-foreground/30' : 'bg-muted-foreground shadow-lg shadow-muted-foreground/30'}`}
                                                    ></div>
                                                    <div className='min-w-0'>
                                                        <p className='font-bold text-xs md:text-sm tracking-tight text-foreground group-hover:text-primary transition-colors truncate'>
                                                            {task.title}
                                                        </p>
                                                        <p className='text-[8px] md:text-[9px] text-muted-foreground font-black uppercase tracking-widest truncate'>
                                                            {projects.find(p => p.id === task.projectId)?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-4 md:px-8 py-4 md:py-5'>
                                                <span
                                                    className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
                                                        task.status === 'Done'
                                                            ? 'text-muted-foreground bg-muted-foreground/10 border-muted-foreground/20'
                                                            : 'text-primary bg-primary/10 border-primary/20'
                                                    }`}
                                                >
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className='px-4 md:px-8 py-4 md:py-5 text-right whitespace-nowrap'>
                                                <p className='text-[9px] md:text-[10px] font-black text-muted-foreground uppercase'>
                                                    {task.dueDate && Number.isFinite(Date.parse(task.dueDate))
                                                        ? new Date(task.dueDate).toLocaleDateString(undefined, {
                                                              month: 'short',
                                                              day: 'numeric'
                                                          })
                                                        : 'No due date'}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className='card !p-0 overflow-hidden flex flex-col h-full shadow-2xl'>
                    <div className='p-4 md:p-8 border-b border-border bg-secondary/10 flex items-center justify-between'>
                        <div>
                            <h3 className='text-lg md:text-xl font-black text-foreground'>Neural Activity Feed</h3>
                            <p className='text-muted-foreground text-[10px] md:text-xs font-medium italic'>
                                Real-time collaboration stream
                            </p>
                        </div>
                        <History
                            size={18}
                            className='text-muted-foreground'
                        />
                    </div>
                    <div className='flex-1 overflow-y-auto max-h-[300px] md:max-h-[400px] p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar bg-secondary/5'>
                        {activityLogs.length === 0 ? (
                            <div className='text-center py-10 text-muted-foreground italic text-xs uppercase tracking-widest'>
                                No archival activity detected.
                            </div>
                        ) : (
                            activityLogs.slice(0, 8).map((log, i) => (
                                <div
                                    key={log.id || i}
                                    className='flex gap-3 md:gap-4 relative'
                                >
                                    {i !== 7 && (
                                        <div className='absolute left-[9px] md:left-[11px] top-5 md:top-6 bottom-[-20px] md:bottom-[-24px] w-px bg-border'></div>
                                    )}
                                    <div className='w-5 h-5 md:w-6 md:h-6 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 z-10 overflow-hidden shadow-sm'>
                                        <img
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=male-${log.userId || 'system'}`}
                                            alt='avatar'
                                        />
                                    </div>
                                    <div className='flex flex-col min-w-0'>
                                        <p className='text-[11px] md:text-xs font-medium text-foreground leading-relaxed'>
                                            <span className='font-black text-primary hover:underline cursor-pointer'>
                                                {log.user?.name || 'Inertia System'}
                                            </span>{' '}
                                            <span className='opacity-70'>
                                                {(log.action || 'ACTIVITY').toLowerCase().replace(/_/g, ' ')}
                                            </span>
                                            {log.details?.title && (
                                                <span className='font-bold text-primary'> "{log.details.title}"</span>
                                            )}
                                            {log.details?.projectName && (
                                                <span className='font-bold'>
                                                    {' '}
                                                    on initiative "{log.details.projectName}"
                                                </span>
                                            )}
                                        </p>
                                        <span className='text-[8px] md:text-[9px] font-black text-muted-foreground mt-1 uppercase tracking-tighter opacity-50'>
                                            {log.createdAt && Number.isFinite(Date.parse(log.createdAt))
                                                ? `${formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })} • Synchronized`
                                                : 'Timestamp unavailable'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onSave={handleSaveProject}
            />

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSaveTask}
                task={selectedTask}
            />
        </div>
    );
};

export default Dashboard;
