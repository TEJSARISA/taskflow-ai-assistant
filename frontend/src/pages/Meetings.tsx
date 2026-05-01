import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Video, FileText, ChevronRight, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { meetingService } from '@/services/meeting.service';
import { Meeting, Project } from '@/types';
import { projectService } from '@/services/project.service';
import { useUI } from '@/context/UIContext';
import { CardSkeleton } from '@/components/ui/Skeleton';
import MeetingModal from '@/components/meetings/MeetingModal';

const Meetings = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>(undefined);
    const { showToast } = useUI();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [m, p] = await Promise.all([meetingService.getMeetings(), projectService.getProjects()]);
                setMeetings(m);
                setProjects(p);
            } catch (error) {
                console.error('Error fetching meetings:', error);
                showToast('Failed to load meetings', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handleSaveMeeting = async (meetingData: Omit<Meeting, 'id'>) => {
        try {
            const created = await meetingService.createMeeting(meetingData);
            setMeetings(prev => [created, ...prev]);
            showToast('Meeting transcript processed successfully');
            setIsModalOpen(false);
        } catch (error) {
            showToast('Failed to process meeting', 'error');
        }
    };

    const filteredMeetings = meetings.filter(
        m =>
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    const getProjectName = (projectId?: string) => {
        return projects.find(p => p.id === projectId)?.name || 'General';
    };

    return (
        <div className='space-y-6 md:space-y-10 pb-20'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div>
                    <h1 className='text-2xl md:text-4xl font-black tracking-tight text-foreground'>Intelligence Hub</h1>
                    <p className='text-muted-foreground mt-1 text-xs md:text-sm font-medium'>
                        Capture, analyze, and extract action from transcripts
                    </p>
                </div>
                <div className='flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto'>
                    <div className='relative group flex-1 w-full sm:w-auto'>
                        <Search
                            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
                            size={16}
                        />
                        <input
                            type='text'
                            placeholder='Search intelligence...'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className='bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full md:w-64 transition-all text-foreground placeholder:text-muted-foreground'
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSelectedMeeting(undefined);
                            setIsModalOpen(true);
                        }}
                        className='btn-primary w-full sm:w-auto'
                    >
                        <Sparkles size={20} />
                        <span>Analyze Transcript</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
                    {[1, 2, 3].map(i => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            ) : filteredMeetings.length === 0 ? (
                <div className='text-center py-20 md:py-32 bg-card rounded-3xl border border-dashed border-border flex flex-col items-center justify-center px-4'>
                    <div className='w-16 h-16 md:w-20 md:h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 text-muted-foreground'>
                        <Video
                            size={32}
                            className='md:w-10 md:h-10'
                        />
                    </div>
                    <h3 className='text-xl md:text-2xl font-black text-foreground'>Awaiting Input</h3>
                    <p className='text-muted-foreground mt-2 max-w-sm font-medium text-sm'>
                        No meeting records found. Paste a transcript to extract tasks and summaries with AI.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className='btn-primary mt-8 px-8'
                    >
                        <Sparkles size={20} />
                        <span>Process New Transcript</span>
                    </button>
                </div>
            ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8'>
                    {filteredMeetings.map((meeting, index) => (
                        <motion.div
                            key={meeting.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => {
                                setSelectedMeeting(meeting);
                                setIsModalOpen(true);
                            }}
                            className='card group hover:border-primary/30 transition-all cursor-pointer p-0 overflow-hidden'
                        >
                            <div className='p-5 md:p-8'>
                                <div className='flex items-start justify-between mb-4 md:mb-6'>
                                    <div className='flex items-center gap-3 md:gap-4'>
                                        <div className='p-3 md:p-4 rounded-2xl bg-primary/10 text-primary shrink-0'>
                                            <Video
                                                size={20}
                                                className='md:w-6 md:h-6'
                                            />
                                        </div>
                                        <div className='min-w-0'>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <span className='px-2 py-0.5 rounded-md bg-secondary text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border truncate max-w-[100px]'>
                                                    {getProjectName(meeting.projectId)}
                                                </span>
                                                <span className='flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-muted-foreground whitespace-nowrap'>
                                                    <Clock
                                                        size={10}
                                                        className='md:w-3 md:h-3'
                                                    />
                                                    {new Date(meeting.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className='font-bold text-lg md:text-xl text-foreground group-hover:text-primary transition-colors truncate max-w-[200px] md:max-w-none'>
                                                {meeting.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={18}
                                        className='text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all shrink-0'
                                    />
                                </div>

                                <p className='text-muted-foreground text-xs md:text-sm line-clamp-2 mb-6 md:mb-8 leading-relaxed italic'>
                                    "{meeting.summary || 'Summary pending analysis...'}"
                                </p>

                                <div className='grid grid-cols-2 gap-3 md:gap-4'>
                                    <div className='bg-secondary/50 rounded-2xl p-3 md:p-4 border border-border'>
                                        <div className='flex items-center gap-2 mb-1 md:mb-2 text-primary'>
                                            <CheckCircle2
                                                size={14}
                                                className='md:w-4 md:h-4'
                                            />
                                            <span className='text-[8px] md:text-[10px] font-black uppercase tracking-widest'>
                                                Tasks
                                            </span>
                                        </div>
                                        <p className='text-xl md:text-2xl font-black text-foreground'>
                                            {meeting.tasks?.length || 0}
                                        </p>
                                    </div>
                                    <div className='bg-secondary/50 rounded-2xl p-3 md:p-4 border border-border'>
                                        <div className='flex items-center gap-2 mb-1 md:mb-2 text-accent'>
                                            <FileText
                                                size={14}
                                                className='md:w-4 md:h-4'
                                            />
                                            <span className='text-[8px] md:text-[10px] font-black uppercase tracking-widest'>
                                                Words
                                            </span>
                                        </div>
                                        <p className='text-xl md:text-2xl font-black text-foreground'>
                                            {meeting.transcript?.split(' ').length || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='px-5 md:px-8 py-3 md:py-4 bg-secondary/30 border-t border-border flex items-center justify-between'>
                                <div className='flex -space-x-1.5 md:-space-x-2'>
                                    {[1, 2, 3].map(i => (
                                        <img
                                            key={i}
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=user${i}`}
                                            className='w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-card bg-secondary'
                                            alt=''
                                        />
                                    ))}
                                </div>
                                <button className='text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors'>
                                    Report
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <MeetingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveMeeting}
                    meeting={selectedMeeting}
                    projects={projects}
                />
            )}
        </div>
    );
};

export default Meetings;
