import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader2, CheckCircle2, User, Calendar, Type, AlignLeft, Briefcase } from 'lucide-react';
import { Meeting, Project } from '@/types';
import { meetingService } from '@/services/meeting.service';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';

interface MeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meeting: Omit<Meeting, 'id'>) => void;
    meeting?: Meeting;
    projects: Project[];
}

const MeetingModal = ({ isOpen, onClose, onSave, meeting, projects }: MeetingModalProps) => {
    const [title, setTitle] = useState(meeting?.title || '');
    const [projectId, setProjectId] = useState(meeting?.projectId || '');
    const [transcript, setTranscript] = useState(meeting?.transcript || '');
    const [summary, setSummary] = useState(meeting?.summary || '');
    const [tasks, setTasks] = useState<{ title: string; deadline: string; assignee: string }[]>(meeting?.tasks || []);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const { showToast } = useUI();
    const { user } = useAuth();

    const handleSummarize = async () => {
        if (!transcript.trim()) {
            showToast('Please provide a transcript first', 'error');
            return;
        }
        setIsSummarizing(true);
        try {
            const { aiService } = await import('@/services/ai.service');
            const result = await aiService.summarizeTranscript(transcript);
            setSummary(result.summary);
            showToast('Neural summary generated');
        } catch (error) {
            showToast('Failed to generate summary', 'error');
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleExtract = async () => {
        if (!transcript.trim()) {
            showToast('Please provide a transcript first', 'error');
            return;
        }

        setIsExtracting(true);
        try {
            const result = await meetingService.extractTasksFromTranscript(transcript, user?.id);
            if (result) {
                setTasks(result.tasks || []);
                setSummary(
                    `Intelligence extracted successfully. Identified ${result.tasks?.length || 0} action items.`
                );
                showToast('Transcript analyzed successfully');
            }
        } catch (error) {
            console.error('Extraction error:', error);
            showToast('Failed to analyze transcript', 'error');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            showToast('Please provide a meeting title', 'error');
            return;
        }
        onSave({
            title,
            projectId,
            transcript,
            summary,
            tasks,
            date: meeting?.date || new Date().toISOString().split('T')[0]
        });
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-[1000] flex items-center justify-center p-4'>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className='absolute inset-0 bg-background/80 backdrop-blur-md'
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className='relative w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]'
            >
                <div className='p-5 sm:p-8 border-b border-border flex items-center justify-between bg-secondary/30'>
                    <div className='flex items-center gap-3 sm:gap-4'>
                        <div className='p-2 sm:p-3 rounded-2xl bg-primary/10 text-primary'>
                            <Sparkles
                                size={20}
                                className='sm:w-6 sm:h-6'
                            />
                        </div>
                        <div>
                            <h2 className='text-lg sm:text-2xl font-black text-foreground'>
                                {meeting ? 'Intelligence' : 'New Analysis'}
                            </h2>
                            <p className='text-[8px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5'>
                                Pipeline
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className='p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-colors'
                    >
                        <X
                            size={20}
                            className='sm:w-6 sm:h-6'
                        />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className='flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar'
                >
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10'>
                        <div className='space-y-6 sm:space-y-8'>
                            <div className='space-y-3 sm:space-y-4'>
                                <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
                                    <Type size={12} /> Meeting Title
                                </label>
                                <input
                                    type='text'
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder='e.g., Strategy Alignment'
                                    className='w-full bg-secondary border border-border rounded-2xl px-5 py-3 sm:px-6 sm:py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-bold'
                                    required
                                    disabled={!!meeting}
                                />
                            </div>

                            <div className='space-y-3 sm:space-y-4'>
                                <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
                                    <Briefcase size={12} /> Project
                                </label>
                                <select
                                    value={projectId}
                                    onChange={e => setProjectId(e.target.value)}
                                    className='w-full bg-secondary border border-border rounded-2xl px-5 py-3 sm:px-6 sm:py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-bold appearance-none'
                                    disabled={!!meeting}
                                >
                                    <option value=''>General / Unassigned</option>
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

                            <div className='space-y-3 sm:space-y-4'>
                                <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
                                    <AlignLeft size={12} /> Transcript
                                </label>
                                <textarea
                                    value={transcript}
                                    onChange={e => setTranscript(e.target.value)}
                                    placeholder='Paste transcript here...'
                                    className='w-full bg-secondary border border-border rounded-3xl px-5 py-3 sm:px-6 sm:py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-h-[200px] sm:min-h-[300px] font-medium leading-relaxed resize-none custom-scrollbar'
                                    disabled={!!meeting}
                                />
                            </div>

                            {!meeting && (
                                <div className='flex gap-3'>
                                    <button
                                        type='button'
                                        onClick={handleSummarize}
                                        disabled={isSummarizing || !transcript.trim()}
                                        className='flex-1 py-4 rounded-2xl bg-secondary border border-border flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-secondary/80 transition-all disabled:opacity-50'
                                    >
                                        {isSummarizing ? (
                                            <Loader2
                                                className='animate-spin'
                                                size={14}
                                            />
                                        ) : (
                                            <Sparkles
                                                size={14}
                                                className='text-primary'
                                            />
                                        )}
                                        AI Summarize
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleExtract}
                                        disabled={isExtracting || !transcript.trim()}
                                        className='flex-[2] btn-primary !py-4 justify-center gap-3 relative overflow-hidden group'
                                    >
                                        {isExtracting ? (
                                            <>
                                                <Loader2
                                                    className='animate-spin'
                                                    size={18}
                                                />
                                                <span className='text-sm'>Analyzing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                <span className='text-sm'>Extract Insights</span>
                                            </>
                                        )}
                                        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className='space-y-6 sm:space-y-8'>
                            <div className='space-y-3 sm:space-y-4'>
                                <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
                                    <CheckCircle2 size={12} /> Action Items
                                </label>
                                <div className='bg-secondary/50 border border-border rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[400px]'>
                                    {tasks.length > 0 ? (
                                        <div className='divide-y divide-border'>
                                            {tasks.map((task, i) => (
                                                <div
                                                    key={i}
                                                    className='p-4 sm:p-5 hover:bg-primary/5 transition-colors'
                                                >
                                                    <div className='flex items-start gap-3 sm:gap-4'>
                                                        <div className='mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-primary flex items-center justify-center bg-primary/10'>
                                                            <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary' />
                                                        </div>
                                                        <div className='flex-1 min-w-0'>
                                                            <p className='font-bold text-xs sm:text-sm text-foreground mb-2 sm:mb-3 truncate'>
                                                                {task.title}
                                                            </p>
                                                            <div className='flex flex-wrap gap-3 sm:gap-4'>
                                                                <div className='flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground'>
                                                                    <User
                                                                        size={10}
                                                                        className='text-primary'
                                                                    />
                                                                    {task.assignee}
                                                                </div>
                                                                <div className='flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground'>
                                                                    <Calendar
                                                                        size={10}
                                                                        className='text-accent'
                                                                    />
                                                                    {task.deadline}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className='h-full flex flex-col items-center justify-center p-8 sm:p-12 text-center opacity-40'>
                                            <Sparkles
                                                size={32}
                                                className='mb-4 text-muted-foreground'
                                            />
                                            <p className='text-xs sm:text-sm font-bold text-muted-foreground'>
                                                Run analysis to populate tasks
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {summary && (
                                <div className='space-y-3 sm:space-y-4'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
                                        <AlignLeft size={12} /> Summary
                                    </label>
                                    <div className='bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-6 italic text-xs sm:text-sm text-foreground leading-relaxed'>
                                        "{summary}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {!meeting && (
                    <div className='p-5 sm:p-8 border-t border-border bg-secondary/30 flex justify-end gap-3 sm:gap-4'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all'
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!tasks.length}
                            className='px-6 sm:px-10 py-3 sm:py-4 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100'
                        >
                            Save Report
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default MeetingModal;
