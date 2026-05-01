import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, Calendar, BarChart2, CheckCircle2, Clock, AlertCircle, Send, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectService } from '@/services/project.service';
import { userService } from '@/services/user.service';
import { useUI } from '@/context/UIContext';

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    stats?: any;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, user, stats }) => {
    const { showToast } = useUI();
    const [activeAction, setActiveAction] = useState<'none' | 'message' | 'assign'>('none');
    const [message, setMessage] = useState('');
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isAssigning, setIsAssigning] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveAction('none');
            setMessage('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && activeAction === 'assign') {
            fetchProjects();
        }
    }, [isOpen, activeAction]);

    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            const data = await projectService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        setIsSending(true);
        try {
            await userService.sendMessage(user.id, message);
            showToast(`Message successfully dispatched to ${user.name}`);
            setMessage('');
            setActiveAction('none');
        } catch (error) {
            console.error('Direct message error:', error);
            showToast('Neural link failed. Message could not be dispatched.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleAssignProject = async (projectId: string, projectName: string) => {
        try {
            setIsAssigning(projectId);
            const project = projects.find(p => p.id === projectId);

            // Check if user is already a member
            const currentMembers = Array.isArray(project?.teamMembers) ? project.teamMembers : [];
            if (currentMembers.includes(user.id)) {
                showToast(`${user.name} is already integrated into ${projectName}`, 'info');
                setActiveAction('none');
                return;
            }

            // Assign user to project
            await projectService.updateProject(projectId, {
                teamMembers: [...currentMembers, user.id]
            });

            showToast(`${user.name} successfully assigned to initiative: ${projectName}`);
            setActiveAction('none');
        } catch (error) {
            console.error('Project assignment error:', error);
            showToast('Failed to assign member to project. Protocol error.', 'error');
        } finally {
            setIsAssigning(null);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm'>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className='w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col'
            >
                <div className='relative h-32 bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/20 shrink-0'>
                    <button
                        onClick={onClose}
                        className='absolute top-4 right-4 p-2 rounded-full bg-background/50 backdrop-blur-md hover:bg-background transition-colors text-foreground z-10'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='px-8 pb-8 -mt-12 relative overflow-y-auto custom-scrollbar'>
                    <div className='flex flex-col md:flex-row md:items-end gap-6 mb-8'>
                        <div className='relative'>
                            <img
                                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                                alt={user.name}
                                className='w-24 h-24 rounded-3xl border-4 border-card bg-secondary shadow-xl object-cover'
                            />
                            <div className='absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-card rounded-full'></div>
                        </div>
                        <div className='flex-1 pb-2'>
                            <h2 className='text-2xl font-black text-foreground'>{user.name || 'Anonymous User'}</h2>
                            <div className='flex flex-wrap items-center gap-4 mt-2'>
                                <div className='flex items-center gap-1.5 text-muted-foreground text-sm'>
                                    <Mail size={14} />
                                    <span>{user.email}</span>
                                </div>
                                <div className='flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20'>
                                    <Shield size={12} />
                                    <span>{user.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode='wait'>
                        {activeAction === 'none' && (
                            <motion.div
                                key='details'
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                                    <div className='p-4 rounded-2xl bg-secondary/50 border border-border'>
                                        <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                                            <CheckCircle2
                                                size={16}
                                                className='text-green-500'
                                            />
                                            <span className='text-[10px] font-black uppercase tracking-widest'>
                                                Completed
                                            </span>
                                        </div>
                                        <p className='text-2xl font-black text-foreground'>
                                            {stats?.completedTasks || 0}
                                        </p>
                                        <p className='text-[10px] text-muted-foreground mt-1'>Total tasks finished</p>
                                    </div>
                                    <div className='p-4 rounded-2xl bg-secondary/50 border border-border'>
                                        <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                                            <Clock
                                                size={16}
                                                className='text-amber-500'
                                            />
                                            <span className='text-[10px] font-black uppercase tracking-widest'>
                                                In Progress
                                            </span>
                                        </div>
                                        <p className='text-2xl font-black text-foreground'>
                                            {stats?.inProgressTasks || 0}
                                        </p>
                                        <p className='text-[10px] text-muted-foreground mt-1'>Currently active</p>
                                    </div>
                                    <div className='p-4 rounded-2xl bg-secondary/50 border border-border'>
                                        <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                                            <BarChart2
                                                size={16}
                                                className='text-primary'
                                            />
                                            <span className='text-[10px] font-black uppercase tracking-widest'>
                                                Productivity
                                            </span>
                                        </div>
                                        <p className='text-2xl font-black text-foreground'>
                                            {stats?.productivityScore || 0}%
                                        </p>
                                        <p className='text-[10px] text-muted-foreground mt-1'>Performance index</p>
                                    </div>
                                </div>

                                <div className='space-y-6'>
                                    <div className='space-y-3'>
                                        <div className='flex justify-between items-center'>
                                            <h3 className='text-xs font-black uppercase tracking-[0.2em] text-foreground'>
                                                Workload Distribution
                                            </h3>
                                            <span className='text-xs font-bold text-primary'>
                                                {stats?.workload || 0}%
                                            </span>
                                        </div>
                                        <div className='h-3 w-full bg-secondary rounded-full overflow-hidden border border-border'>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats?.workload || 0}%` }}
                                                className={`h-full rounded-full ${stats?.workload > 80 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-primary shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}
                                            ></motion.div>
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border'>
                                        <div className='flex items-start gap-3'>
                                            <div className='p-2 rounded-lg bg-secondary'>
                                                <Calendar
                                                    size={18}
                                                    className='text-muted-foreground'
                                                />
                                            </div>
                                            <div>
                                                <p className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                                    Joined Team
                                                </p>
                                                <p className='text-sm font-bold text-foreground'>Jan 12, 2026</p>
                                            </div>
                                        </div>
                                        <div className='flex items-start gap-3'>
                                            <div className='p-2 rounded-lg bg-secondary'>
                                                <AlertCircle
                                                    size={18}
                                                    className='text-muted-foreground'
                                                />
                                            </div>
                                            <div>
                                                <p className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                                    Status
                                                </p>
                                                <div className='flex items-center gap-1.5 mt-0.5'>
                                                    <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
                                                    <p className='text-sm font-bold text-foreground'>Available</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='flex gap-3 mt-10'>
                                    <button
                                        onClick={() => setActiveAction('message')}
                                        className='flex-1 btn-primary py-3 rounded-2xl shadow-xl shadow-primary/20'
                                    >
                                        Send Direct Message
                                    </button>
                                    <button
                                        onClick={() => setActiveAction('assign')}
                                        className='flex-1 btn-secondary py-3 rounded-2xl'
                                    >
                                        Assign to Project
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeAction === 'message' && (
                            <motion.div
                                key='message'
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className='space-y-4'
                            >
                                <div className='flex items-center justify-between mb-4'>
                                    <h3 className='text-sm font-black uppercase tracking-widest text-foreground'>
                                        Send Message to {user.name}
                                    </h3>
                                    <button
                                        onClick={() => setActiveAction('none')}
                                        className='text-xs font-bold text-primary hover:underline'
                                    >
                                        Back to profile
                                    </button>
                                </div>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder='Type your message here...'
                                    className='w-full h-32 p-4 bg-secondary/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm'
                                ></textarea>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!message.trim() || isSending}
                                    className='w-full btn-primary py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50'
                                >
                                    {isSending ? (
                                        <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {activeAction === 'assign' && (
                            <motion.div
                                key='assign'
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className='space-y-4'
                            >
                                <div className='flex items-center justify-between mb-4'>
                                    <h3 className='text-sm font-black uppercase tracking-widest text-foreground'>
                                        Assign {user.name} to Project
                                    </h3>
                                    <button
                                        onClick={() => setActiveAction('none')}
                                        className='text-xs font-bold text-primary hover:underline'
                                    >
                                        Back to profile
                                    </button>
                                </div>

                                <div className='space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar'>
                                    {loadingProjects ? (
                                        [1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className='h-16 w-full bg-secondary/50 rounded-xl animate-pulse'
                                            ></div>
                                        ))
                                    ) : projects.length > 0 ? (
                                        projects.map(project => (
                                            <button
                                                key={project.id}
                                                onClick={() => handleAssignProject(project.id, project.name)}
                                                disabled={!!isAssigning}
                                                className='w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 border border-border rounded-xl transition-all group disabled:opacity-50'
                                            >
                                                <div className='flex items-center gap-3'>
                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-lg ${
                                                            [
                                                                'bg-blue-500',
                                                                'bg-purple-500',
                                                                'bg-amber-500',
                                                                'bg-rose-500',
                                                                'bg-emerald-500'
                                                            ][Math.floor(Math.random() * 5)]
                                                        }`}
                                                    >
                                                        {project.name.charAt(0)}
                                                    </div>
                                                    <div className='text-left'>
                                                        <p className='text-sm font-bold text-foreground'>
                                                            {project.name}
                                                        </p>
                                                        <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                                                            {project.category || 'General'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='p-2 rounded-lg bg-background border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all'>
                                                    {isAssigning === project.id ? (
                                                        <div className='w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin'></div>
                                                    ) : (
                                                        <Plus size={16} />
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className='text-center py-10 opacity-50'>
                                            <p className='text-sm italic'>No projects found to assign.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default UserDetailModal;
