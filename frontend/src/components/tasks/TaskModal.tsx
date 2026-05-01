import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    FolderKanban,
    User as UserIcon,
    Timer,
    Link2,
    Paperclip,
    Sparkles,
    Trash2,
    Download,
    Square,
    Play,
    RefreshCcw,
    BarChart3,
    Tag
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, User } from '@/types';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { timeEntryService } from '@/services/timeEntry.service';
import { aiService } from '@/services/ai.service';
import { commentService } from '@/services/comment.service';
import { api } from '@/lib/api';
import { notificationService } from '@/services/notification.service';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: Partial<Task>) => Promise<void>;
    task?: Task;
    projectId?: string;
    initialDueDate?: string;
    initialStatus?: TaskStatus;
}

type Tab = 'general' | 'dependencies' | 'files' | 'ai' | 'comments';

const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    onSave,
    task,
    projectId: initialProjectId,
    initialDueDate,
    initialStatus
}) => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('Medium');
    const [status, setStatus] = useState<TaskStatus>(initialStatus || 'To Do');
    const [dueDate, setDueDate] = useState('');
    const [projectId, setProjectId] = useState(initialProjectId || '');
    const [assignedTo, setAssignedTo] = useState('');
    const [tags, setTags] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Time tracking
    const [activeTimer, setActiveTimer] = useState<any>(null);

    // Dependencies
    const [dependencies, setDependencies] = useState<any[]>([]);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [selectedDepId, setSelectedDepId] = useState('');

    // Files
    const [files, setFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // AI
    const [aiSuggestions, setAiSuggestions] = useState<any>(null);
    const [isAIPlanning, setIsAIPlanning] = useState(false);
    const [complexityResult, setComplexityResult] = useState<any>(null);
    const [isAnalyzingComplexity, setIsAnalyzingComplexity] = useState(false);

    // Comments
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [p, u, t] = await Promise.all([
                    projectService.getProjects(),
                    api.get('/users').then(res => res.data),
                    taskService.getTasks(projectId)
                ]);
                setProjects(p);
                setUsers(u);
                setAvailableTasks(t.filter(item => item.id !== task?.id));
                if (!projectId && p.length > 0) {
                    setProjectId(p[0].id);
                }
            } catch (error) {
                console.error('Error fetching modal data:', error);
            }
        };
        if (isOpen) {
            fetchData();
            if (task) {
                fetchTaskDetails();
            }
        }
    }, [isOpen, projectId, task?.id]);

    const fetchTaskDetails = async () => {
        if (!task) return;
        try {
            const [timer, deps, fileVers, taskComments] = await Promise.all([
                timeEntryService.getActiveTimer(),
                taskService.getTaskDependencies(task.id),
                taskService.getFileVersions(task.id),
                commentService.getTaskComments(task.id)
            ]);
            setActiveTimer(timer && timer.taskId === task.id ? timer : null);
            setDependencies(deps);
            setFiles(fileVers);
            setComments(taskComments);
        } catch (error) {
            console.error('Error fetching task details:', error);
        }
    };

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setPriority(task.priority);
            setStatus(task.status);
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
            setProjectId(task.projectId);
            setAssignedTo(task.assignedTo || '');
            setTags(task.tags ? task.tags.join(', ') : '');
        } else {
            resetForm();
        }
    }, [task, isOpen]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setStatus(initialStatus || 'To Do');
        setDueDate(initialDueDate || '');
        setProjectId(initialProjectId || '');
        setAssignedTo('');
        setTags('');
        setActiveTab('general');
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) {
            alert('Please select a project');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSave({
                title,
                description,
                priority,
                status,
                dueDate,
                projectId,
                assignedTo: assignedTo || undefined,
                tags: tags
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t !== '')
            });
            onClose();
        } catch (error) {
            console.error('Failed to save task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartTimer = async () => {
        if (!task) return;
        try {
            const timer = await timeEntryService.startTimer(task.id);
            setActiveTimer(timer);
            notificationService.addNotification({ message: 'Timer started for task.', type: 'status_updated' });
        } catch (error) {
            alert('Could not start timer. You might have another active timer.');
        }
    };

    const handleStopTimer = async () => {
        try {
            await timeEntryService.stopTimer();
            setActiveTimer(null);
            notificationService.addNotification({ message: 'Timer stopped.', type: 'status_updated' });
        } catch (error) {
            console.error('Error stopping timer:', error);
        }
    };

    const handlePostComment = async () => {
        if (!task || !currentUser || !newComment.trim()) return;
        setIsPostingComment(true);
        try {
            // Detect mentions
            const mentionRegex = /@(\w+)/g;
            const mentions: string[] = [];
            let match: RegExpExecArray | null;
            while ((match = mentionRegex.exec(newComment)) !== null) {
                const mentionedUser = users.find(u => u.name?.toLowerCase().includes(match![1].toLowerCase()));
                if (mentionedUser) {
                    mentions.push(mentionedUser.id);
                    notificationService.addNotification({
                        userId: mentionedUser.id,
                        message: `${currentUser.name} mentioned you in a comment on "${task.title}"`,
                        type: 'comment_added'
                    });
                }
            }

            const comment = await commentService.addComment(task.id, currentUser.id, newComment);
            setComments(prev => [...prev, { ...comment, user: currentUser, mentions }]);
            setNewComment('');
            notificationService.addNotification({
                message: `New intelligence update on "${task.title}"`,
                type: 'comment_added'
            });
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleAddDependency = async () => {
        if (!task || !selectedDepId) return;
        try {
            await taskService.addTaskDependency(task.id, selectedDepId);
            const updatedDeps = await taskService.getTaskDependencies(task.id);
            setDependencies(updatedDeps);
            setSelectedDepId('');
        } catch (error) {
            console.error('Error adding dependency:', error);
        }
    };

    const handleRemoveDependency = async (depId: string) => {
        if (!task) return;
        try {
            await taskService.removeTaskDependency(task.id, depId);
            setDependencies(prev => prev.filter(d => d.id !== depId));
        } catch (error) {
            console.error('Error removing dependency:', error);
        }
    };

    const handleAIAnalyze = async () => {
        if (!task) return;
        setIsAIPlanning(true);
        try {
            const result = await aiService.suggestTasks([task]);
            setAiSuggestions(result.suggestions?.[0]);
        } catch (error) {
            console.error('AI error:', error);
        } finally {
            setIsAIPlanning(false);
        }
    };

    const handleAnalyzeComplexity = async () => {
        const taskData = { title, description, priority, dueDate };
        setIsAnalyzingComplexity(true);
        try {
            const result = await aiService.analyzeComplexity(taskData);
            setComplexityResult(result);
        } catch (error) {
            console.error('Complexity analysis error:', error);
        } finally {
            setIsAnalyzingComplexity(false);
        }
    };

    const applyAISuggestion = () => {
        if (!aiSuggestions) return;
        setPriority(aiSuggestions.suggestedPriority as TaskPriority);
        setDueDate(new Date(aiSuggestions.suggestedDeadline).toISOString().split('T')[0]);
        notificationService.addNotification({ message: 'AI suggestions applied to task.', type: 'status_updated' });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !task) return;

        setIsUploading(true);
        try {
            const { url, fileName } = await taskService.uploadFileToStorage(file);
            await taskService.uploadFileVersion(task.id, fileName, url);
            const updatedFiles = await taskService.getFileVersions(task.id);
            setFiles(updatedFiles);
            notificationService.addNotification({
                message: `Intelligence dossier "${fileName}" ingested successfully.`,
                type: 'status_updated'
            });
        } catch (error) {
            console.error('File upload error:', error);
            alert('Failed to upload file.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileDownload = async (file: any) => {
        try {
            // Assuming fileUrl is the key or a signed URL
            // If it's a signed URL, we can just open it
            if (file.fileUrl.startsWith('http')) {
                window.open(file.fileUrl, '_blank');
            } else {
                await taskService.downloadFile(file.fileUrl, file.fileName);
            }
        } catch (error) {
            console.error('File download error:', error);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto'>
            <div className='w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto'>
                <div className='flex items-center justify-between p-4 sm:p-6 border-b border-border bg-secondary/30'>
                    <div className='flex items-center gap-4'>
                        <h2 className='text-lg sm:text-xl font-black uppercase tracking-tight'>
                            {task ? 'Task Dossier' : 'New Task Creation'}
                        </h2>
                        {task && (
                            <div className='hidden xs:flex items-center gap-2'>
                                <span className='text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20'>
                                    #{task.id.slice(0, 8)}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className='p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='flex border-b border-border bg-secondary/10 p-1 mx-4 sm:mx-6 mt-4 rounded-xl overflow-x-auto no-scrollbar'>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'general' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        General
                    </button>
                    {task && (
                        <>
                            <button
                                onClick={() => setActiveTab('dependencies')}
                                className={`flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'dependencies' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Deps
                            </button>
                            <button
                                onClick={() => setActiveTab('files')}
                                className={`flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'files' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Intel
                            </button>
                            <button
                                onClick={() => setActiveTab('ai')}
                                className={`flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'ai' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                AI Lab
                            </button>
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'comments' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Intel Feed
                            </button>
                        </>
                    )}
                </div>

                <div className='p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-180px)] md:max-h-[70vh] custom-scrollbar'>
                    {activeTab === 'general' && (
                        <form
                            id='task-form'
                            onSubmit={handleSubmit}
                            className='space-y-4 sm:space-y-6'
                        >
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                        Strategic Portfolio
                                    </label>
                                    <div className='relative'>
                                        <FolderKanban
                                            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                                            size={16}
                                        />
                                        <select
                                            required
                                            value={projectId}
                                            onChange={e => setProjectId(e.target.value)}
                                            className='w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none text-foreground font-medium'
                                        >
                                            <option
                                                value=''
                                                disabled
                                            >
                                                Select project
                                            </option>
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

                                <div className='space-y-2'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                        Officer Assigned
                                    </label>
                                    <div className='relative'>
                                        <UserIcon
                                            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                                            size={16}
                                        />
                                        <select
                                            value={assignedTo}
                                            onChange={e => setAssignedTo(e.target.value)}
                                            className='w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none text-foreground font-medium'
                                        >
                                            <option value=''>Unassigned</option>
                                            {users.map(u => (
                                                <option
                                                    key={u.id}
                                                    value={u.id}
                                                >
                                                    {u.name || u.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                    Operational Title
                                </label>
                                <input
                                    autoFocus
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className='w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground font-bold'
                                    placeholder='Task objective...'
                                />
                            </div>

                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                        Objective Details
                                    </label>
                                    <button
                                        type='button'
                                        onClick={async () => {
                                            if (!description) return;
                                            const res = await aiService.enhanceDescription(description);
                                            setDescription(res.enhancedDescription);
                                        }}
                                        className='flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors'
                                    >
                                        <Sparkles size={12} />
                                        AI Enhance
                                    </button>
                                </div>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    className='w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none text-foreground font-medium leading-relaxed'
                                    placeholder='Provide comprehensive details...'
                                />
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                        Priority Protocol
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value as TaskPriority)}
                                        className='w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none text-foreground font-bold'
                                    >
                                        <option value='Low'>Low Priority</option>
                                        <option value='Medium'>Medium Priority</option>
                                        <option value='High'>High Priority</option>
                                    </select>
                                </div>
                                <div className='space-y-2'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                        Task Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value as TaskStatus)}
                                        className='w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none text-foreground font-bold'
                                    >
                                        <option value='To Do'>To Do</option>
                                        <option value='In Progress'>In Progress</option>
                                        <option value='Done'>Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                        Strategic Deadline
                                    </label>
                                    <div className='relative'>
                                        <Calendar
                                            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                                            size={16}
                                        />
                                        <input
                                            type='date'
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className='w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground font-medium'
                                        />
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                        Tags (comma separated)
                                    </label>
                                    <div className='relative'>
                                        <Tag
                                            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                                            size={16}
                                        />
                                        <input
                                            value={tags}
                                            onChange={e => setTags(e.target.value)}
                                            className='w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground font-medium'
                                            placeholder='devops, urgent'
                                        />
                                    </div>
                                </div>
                            </div>

                            {task && (
                                <div className='p-4 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4'>
                                    <div className='flex items-center gap-3 w-full sm:w-auto'>
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border border-primary/20 transition-all shrink-0 ${activeTimer ? 'bg-foreground/20 text-foreground animate-pulse' : 'bg-primary/10 text-primary'}`}
                                        >
                                            <Timer size={20} />
                                        </div>
                                        <div className='min-w-0'>
                                            <p className='text-xs font-black uppercase tracking-widest text-foreground'>
                                                Mission Clock
                                            </p>
                                            <p className='text-[10px] font-medium text-muted-foreground truncate'>
                                                {activeTimer
                                                    ? 'Current Engagement Active'
                                                    : `Total engagement: ${task.actualTime || 0} min`}
                                            </p>
                                        </div>
                                    </div>
                                    {activeTimer ? (
                                        <button
                                            type='button'
                                            onClick={handleStopTimer}
                                            className='btn-secondary w-full sm:w-auto px-6 text-foreground hover:bg-foreground hover:text-background border-foreground/30'
                                        >
                                            <Square
                                                size={14}
                                                fill='currentColor'
                                                className='mr-2'
                                            />{' '}
                                            Stop Tracking
                                        </button>
                                    ) : (
                                        <button
                                            type='button'
                                            onClick={handleStartTimer}
                                            className='btn-primary w-full sm:w-auto px-6'
                                        >
                                            <Play
                                                size={14}
                                                fill='currentColor'
                                                className='mr-2'
                                            />{' '}
                                            Start Timer
                                        </button>
                                    )}
                                </div>
                            )}
                        </form>
                    )}

                    {activeTab === 'dependencies' && (
                        <div className='space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                            <div className='space-y-2'>
                                <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                    Strategic Links
                                </label>
                                <div className='flex flex-col sm:flex-row gap-2'>
                                    <select
                                        value={selectedDepId}
                                        onChange={e => setSelectedDepId(e.target.value)}
                                        className='flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground font-medium min-w-0'
                                    >
                                        <option value=''>Link to objective...</option>
                                        {availableTasks.map(t => (
                                            <option
                                                key={t.id}
                                                value={t.id}
                                            >
                                                {t.title}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAddDependency}
                                        disabled={!selectedDepId}
                                        className='btn-primary px-6 w-full sm:w-auto'
                                    >
                                        <Link2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className='space-y-4'>
                                <h4 className='text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
                                    <Link2 size={12} /> Active Links
                                </h4>
                                {dependencies.length === 0 ? (
                                    <div className='p-8 border border-dashed border-border rounded-2xl text-center'>
                                        <p className='text-xs text-muted-foreground font-medium italic'>
                                            No active strategic links.
                                        </p>
                                    </div>
                                ) : (
                                    <div className='space-y-2'>
                                        {dependencies.map(dep => (
                                            <div
                                                key={dep.id}
                                                className='p-3 bg-secondary rounded-xl border border-border flex items-center justify-between group'
                                            >
                                                <div className='flex items-center gap-3 min-w-0'>
                                                    <div className='w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary border border-border shadow-sm shrink-0'>
                                                        <FolderKanban size={14} />
                                                    </div>
                                                    <span className='text-xs font-bold text-foreground truncate'>
                                                        {dep.dependsOnTask?.title}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveDependency(dep.id)}
                                                    className='p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-100 sm:opacity-0 group-hover:opacity-100'
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className='space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                            <label className='p-8 sm:p-12 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-4 bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer group'>
                                <input
                                    type='file'
                                    className='hidden'
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <div className='w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all'>
                                    {isUploading ? (
                                        <RefreshCcw
                                            className='animate-spin'
                                            size={24}
                                        />
                                    ) : (
                                        <Paperclip size={24} />
                                    )}
                                </div>
                                <div className='text-center'>
                                    <p className='text-sm font-black text-foreground'>
                                        {isUploading ? 'Ingesting...' : 'Ingest Intelligence'}
                                    </p>
                                    <p className='text-xs text-muted-foreground mt-1 px-4'>
                                        Upload operational reports.
                                    </p>
                                </div>
                            </label>

                            <div className='space-y-4'>
                                <h4 className='text-xs font-black uppercase tracking-widest text-muted-foreground'>
                                    Version History
                                </h4>
                                {files.length === 0 ? (
                                    <div className='p-8 border border-dashed border-border rounded-2xl text-center'>
                                        <p className='text-xs text-muted-foreground font-medium italic'>
                                            No data versions ingested.
                                        </p>
                                    </div>
                                ) : (
                                    <div className='space-y-2'>
                                        {files.map(file => (
                                            <div
                                                key={file.id}
                                                className='p-4 bg-secondary rounded-xl border border-border flex items-center justify-between group'
                                            >
                                                <div className='flex items-center gap-4 min-w-0'>
                                                    <div className='w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary border border-border shrink-0'>
                                                        <Paperclip size={18} />
                                                    </div>
                                                    <div className='min-w-0'>
                                                        <p className='text-xs font-bold text-foreground truncate'>
                                                            {file.fileName}
                                                        </p>
                                                        <p className='text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-widest truncate'>
                                                            v{file.versionNumber} •{' '}
                                                            {new Date(file.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleFileDownload(file)}
                                                    className='p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all shrink-0'
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className='space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div className='p-6 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl relative overflow-hidden group'>
                                    <div className='relative z-10 flex flex-col items-center text-center gap-3'>
                                        <div className='w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground'>
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <h3 className='text-xs font-black uppercase tracking-tight text-foreground'>
                                                Strategic Analysis
                                            </h3>
                                            <p className='text-[10px] text-muted-foreground mt-1'>
                                                Priority optimization.
                                            </p>
                                        </div>
                                        <button
                                            type='button'
                                            disabled={isAIPlanning}
                                            onClick={handleAIAnalyze}
                                            className='btn-primary w-full py-2 text-[10px] mt-1'
                                        >
                                            {isAIPlanning ? 'Synthesizing...' : 'Run Analysis'}
                                        </button>
                                    </div>
                                </div>

                                <div className='p-6 bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-3xl relative overflow-hidden group'>
                                    <div className='relative z-10 flex flex-col items-center text-center gap-3'>
                                        <div className='w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground'>
                                            <BarChart3 size={18} />
                                        </div>
                                        <div>
                                            <h3 className='text-xs font-black uppercase tracking-tight text-foreground'>
                                                Complexity Score
                                            </h3>
                                            <p className='text-[10px] text-muted-foreground mt-1'>
                                                Difficulty prediction.
                                            </p>
                                        </div>
                                        <button
                                            type='button'
                                            disabled={isAnalyzingComplexity}
                                            onClick={handleAnalyzeComplexity}
                                            className='w-full bg-accent text-accent-foreground rounded-xl py-2 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all mt-1'
                                        >
                                            {isAnalyzingComplexity ? 'Calculating...' : 'Predict Score'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {(aiSuggestions || complexityResult) && (
                                <div className='space-y-4'>
                                    {aiSuggestions && (
                                        <div className='p-4 sm:p-6 bg-secondary border border-border rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-500'>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center gap-2'>
                                                    <div className='w-1.5 h-6 bg-foreground rounded-full'></div>
                                                    <h4 className='text-xs font-black uppercase tracking-widest text-foreground'>
                                                        Priority Recommendation
                                                    </h4>
                                                </div>
                                                <button
                                                    type='button'
                                                    onClick={applyAISuggestion}
                                                    className='px-3 py-1.5 bg-foreground text-background rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-muted-foreground transition-all'
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                            <div className='grid grid-cols-2 gap-4'>
                                                <div className='p-3 bg-background rounded-2xl border border-border'>
                                                    <p className='text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1'>
                                                        Priority
                                                    </p>
                                                    <p className='text-sm font-black text-foreground'>
                                                        {aiSuggestions.suggestedPriority}
                                                    </p>
                                                </div>
                                                <div className='p-3 bg-background rounded-2xl border border-border'>
                                                    <p className='text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1'>
                                                        Deadline
                                                    </p>
                                                    <p className='text-sm font-black text-foreground'>
                                                        {new Date(aiSuggestions.suggestedDeadline).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {complexityResult && (
                                        <div className='p-4 sm:p-6 bg-secondary border border-border rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-500'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-1.5 h-6 bg-accent rounded-full'></div>
                                                <h4 className='text-xs font-black uppercase tracking-widest text-accent'>
                                                    Neural Complexity Analysis
                                                </h4>
                                            </div>
                                            <div className='grid grid-cols-3 gap-3'>
                                                <div className='p-3 bg-background rounded-2xl border border-border flex flex-col items-center justify-center'>
                                                    <p className='text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1'>
                                                        Score
                                                    </p>
                                                    <p className='text-xl font-black text-accent'>
                                                        {complexityResult.score}/10
                                                    </p>
                                                </div>
                                                <div className='col-span-2 p-3 bg-background rounded-2xl border border-border'>
                                                    <p className='text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1'>
                                                        Estimated Effort
                                                    </p>
                                                    <p className='text-sm font-black text-foreground'>
                                                        {complexityResult.estimatedHours} Man-Hours
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='p-3 bg-accent/5 border border-accent/10 rounded-2xl'>
                                                <p className='text-[10px] text-accent/80 font-medium leading-relaxed italic'>
                                                    {complexityResult.reasoning}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className='space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-full'>
                            <div className='space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar'>
                                {comments.length === 0 ? (
                                    <div className='text-center py-10'>
                                        <p className='text-xs text-muted-foreground font-medium italic'>
                                            No intelligence updates yet.
                                        </p>
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div
                                            key={comment.id}
                                            className='flex gap-4'
                                        >
                                            <div className='w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0'>
                                                <img
                                                    src={
                                                        comment.user?.avatar ||
                                                        `https://api.dicebear.com/7.x/initials/svg?seed=${comment.userId}`
                                                    }
                                                    alt=''
                                                />
                                            </div>
                                            <div className='flex-1 space-y-1'>
                                                <div className='flex items-center justify-between'>
                                                    <span className='text-[11px] font-bold text-foreground'>
                                                        {comment.user?.name || 'Officer'}
                                                    </span>
                                                    <span className='text-[9px] text-muted-foreground italic'>
                                                        {formatDistanceToNow(new Date(comment.timestamp), {
                                                            addSuffix: true
                                                        })}
                                                    </span>
                                                </div>
                                                <div className='p-3 bg-secondary/50 rounded-2xl rounded-tl-none border border-border'>
                                                    <p className='text-xs text-foreground/80 leading-relaxed'>
                                                        {comment.text}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className='pt-4 border-t border-border mt-auto'>
                                <div className='relative'>
                                    <textarea
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder='Input neural update...'
                                        rows={2}
                                        className='w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none text-foreground'
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        disabled={isPostingComment || !newComment.trim()}
                                        className='absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-all disabled:opacity-50'
                                    >
                                        <RefreshCcw
                                            className={isPostingComment ? 'animate-spin' : ''}
                                            size={16}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className='p-4 sm:p-6 border-t border-border bg-secondary/10 flex items-center justify-end gap-3'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='px-4 sm:px-6 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors'
                    >
                        Abort
                    </button>
                    <button
                        type='submit'
                        form='task-form'
                        disabled={isSubmitting || activeTab !== 'general'}
                        className='btn-primary px-6 sm:px-10 py-3 shadow-xl shadow-primary/20'
                    >
                        {isSubmitting ? 'Syncing...' : task ? 'Update' : 'Commit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
