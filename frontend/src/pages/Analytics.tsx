import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Users, Target, Sparkles, Download, RefreshCcw } from 'lucide-react';
import {
    Chart as ChartJS,
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
import { Bar, Doughnut } from 'react-chartjs-2';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { aiService } from '@/services/ai.service';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

ChartJS.register(
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

const Analytics = () => {
    const { user } = useAuth();
    const { showToast } = useUI();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [aiReport, setAiReport] = useState<any>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [p, t] = await Promise.all([projectService.getProjects(), taskService.getTasks()]);
                setProjects(p);
                setTasks(t);
            } catch (error) {
                console.error('Error fetching analytics data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleGenerateAiReport = async () => {
        if (!user) return;
        setIsGeneratingReport(true);
        try {
            const result = await aiService.getProjectInsights(tasks);
            setAiReport(result);
            showToast('AI Performance Report generated');
        } catch (error) {
            showToast('Failed to generate AI report', 'error');
        } finally {
            setIsGeneratingReport(false);
        }
    };

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
                borderWidth: 0,
                hoverOffset: 10
            }
        ]
    };

    const projectCompletionData = {
        labels: projects.map(p => (p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name)),
        datasets: [
            {
                label: 'Completion %',
                data: projects.map(p => {
                    const projectTasks = tasks.filter(t => t.projectId === p.id);
                    if (projectTasks.length === 0) return 0;
                    return Math.round(
                        (projectTasks.filter(t => t.status === 'Done').length / projectTasks.length) * 100
                    );
                }),
                backgroundColor: '#FFFFFF',
                borderRadius: 8
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#0A0A0A',
                titleFont: { size: 12, weight: 'bold' as const },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                borderColor: '#262626',
                borderWidth: 1
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#737373' } },
            x: { grid: { display: false }, ticks: { color: '#737373' } }
        }
    };

    return (
        <div className='max-w-7xl mx-auto space-y-10 pb-20'>
            <header className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div>
                    <h1 className='text-4xl font-black tracking-tight text-foreground'>Strategic Analytics</h1>
                    <p className='text-muted-foreground mt-1 text-sm font-medium italic'>
                        Data-driven performance insights
                    </p>
                </div>
                <div className='flex items-center gap-3'>
                    <button className='btn-secondary'>
                        <Download size={18} />
                        <span>Export Data</span>
                    </button>
                    <button
                        onClick={handleGenerateAiReport}
                        disabled={isGeneratingReport}
                        className='btn-primary'
                    >
                        {isGeneratingReport ? (
                            <RefreshCcw
                                className='animate-spin'
                                size={18}
                            />
                        ) : (
                            <Sparkles size={18} />
                        )}
                        <span>{isGeneratingReport ? 'Analyzing...' : 'Neural Report'}</span>
                    </button>
                </div>
            </header>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {[
                    { label: 'Avg Velocity', value: '4.8', icon: TrendingUp, color: 'text-primary', trend: '+12%' },
                    { label: 'Success Rate', value: '92%', icon: Target, color: 'text-foreground', trend: '+5%' },
                    {
                        label: 'Active Collab',
                        value: projects.length,
                        icon: Users,
                        color: 'text-muted-foreground',
                        trend: 'Stable'
                    },
                    {
                        label: 'Throughput',
                        value: tasks.filter(t => t.status === 'Done').length,
                        icon: BarChart3,
                        color: 'text-foreground/50',
                        trend: '+18%'
                    }
                ].map((stat, i) => (
                    <div
                        key={i}
                        className='card p-6 flex flex-col justify-between group hover:border-primary/30 transition-all cursor-default'
                    >
                        <div className='flex items-center justify-between mb-4'>
                            <div
                                className={`p-3 rounded-xl bg-secondary ${stat.color} group-hover:scale-110 transition-transform`}
                            >
                                <stat.icon size={20} />
                            </div>
                            <span className='text-[10px] font-black bg-secondary px-2 py-1 rounded-full text-muted-foreground'>
                                {stat.trend}
                            </span>
                        </div>
                        <div>
                            <p className='text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                                {stat.label}
                            </p>
                            <h3 className='text-3xl font-black text-foreground mt-1'>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                <div className='lg:col-span-2 card p-8 flex flex-col shadow-xl'>
                    <h3 className='text-xl font-black text-foreground mb-8 flex items-center gap-3'>
                        <BarChart3
                            className='text-primary'
                            size={24}
                        />
                        Portfolio Completion Matrix
                    </h3>
                    <div className='flex-1 min-h-[300px]'>
                        {loading ? (
                            <div className='w-full h-full bg-secondary animate-pulse rounded-2xl' />
                        ) : (
                            <Bar
                                data={projectCompletionData}
                                options={chartOptions as any}
                            />
                        )}
                    </div>
                </div>

                <div className='card p-8 flex flex-col shadow-xl'>
                    <h3 className='text-xl font-black text-foreground mb-8 flex items-center gap-3'>
                        <PieChart
                            className='text-primary'
                            size={24}
                        />
                        Task Distribution
                    </h3>
                    <div className='flex-1 min-h-[300px] flex items-center justify-center'>
                        {loading ? (
                            <div className='w-full h-full bg-secondary animate-pulse rounded-2xl' />
                        ) : (
                            <div className='w-full h-full p-4'>
                                <Doughnut
                                    data={statusData}
                                    options={{
                                        ...chartOptions,
                                        cutout: '70%',
                                        plugins: {
                                            legend: {
                                                display: true,
                                                position: 'bottom' as const,
                                                labels: { color: '#737373', font: { size: 10, weight: 'bold' } }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {aiReport && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='card p-8 md:p-12 bg-secondary/5 border-primary/20 shadow-2xl relative overflow-hidden'
                    >
                        <div className='absolute top-0 right-0 p-4'>
                            <Sparkles
                                className='text-primary/10'
                                size={120}
                            />
                        </div>

                        <div className='relative z-10 space-y-8'>
                            <div className='flex items-center gap-4'>
                                <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20'>
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className='text-2xl font-black text-foreground'>Neural Performance Report</h3>
                                    <p className='text-muted-foreground text-sm font-medium'>
                                        Synthesized by TaskFlow AI Engine
                                    </p>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                                <div className='md:col-span-2 space-y-6'>
                                    <div className='bg-secondary/30 rounded-2xl p-6 border border-border'>
                                        <h4 className='text-[10px] font-black uppercase tracking-widest text-primary mb-4'>
                                            Strategic Insights
                                        </h4>
                                        <div className='space-y-4'>
                                            {aiReport.insights?.map((insight: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className='flex gap-4 items-start group'
                                                >
                                                    <div className='w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 group-hover:bg-primary group-hover:text-background transition-all'>
                                                        {i + 1}
                                                    </div>
                                                    <p className='text-sm md:text-base leading-relaxed text-foreground/80'>
                                                        {insight}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className='space-y-6'>
                                    <div className='bg-secondary/30 rounded-2xl p-6 border border-border flex flex-col items-center justify-center text-center'>
                                        <h4 className='text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6'>
                                            Aggregate Health
                                        </h4>
                                        <div className='relative w-32 h-32 flex items-center justify-center'>
                                            <svg className='w-full h-full transform -rotate-90'>
                                                <circle
                                                    cx='64'
                                                    cy='64'
                                                    r='58'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    strokeWidth='8'
                                                    className='text-border'
                                                />
                                                <motion.circle
                                                    initial={{ strokeDasharray: '0 365' }}
                                                    animate={{
                                                        strokeDasharray: `${(aiReport.healthScore / 100) * 365} 365`
                                                    }}
                                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                                    cx='64'
                                                    cy='64'
                                                    r='58'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    strokeWidth='8'
                                                    className='text-primary'
                                                    strokeLinecap='round'
                                                />
                                            </svg>
                                            <div className='absolute inset-0 flex flex-col items-center justify-center'>
                                                <span className='text-3xl font-black text-foreground'>
                                                    {aiReport.healthScore}
                                                </span>
                                                <span className='text-[8px] font-bold text-muted-foreground uppercase'>
                                                    Optimum
                                                </span>
                                            </div>
                                        </div>
                                        <p className='mt-6 text-[10px] font-bold text-muted-foreground italic px-4'>
                                            Project velocity is within top 5% of industry benchmarks.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className='pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4'>
                                <div className='flex items-center gap-2'>
                                    <span className='w-2 h-2 rounded-full bg-foreground animate-pulse'></span>
                                    <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
                                        Real-time neural analysis active
                                    </span>
                                </div>
                                <button
                                    onClick={() => setAiReport(null)}
                                    className='text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors'
                                >
                                    Dismiss Report
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Analytics;
