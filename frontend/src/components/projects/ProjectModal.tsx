import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Project } from '@/types';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (projectData: Partial<Project>) => Promise<void>;
    project?: Project;
}

const PROJECT_COLORS = ['#FFFFFF', '#E5E5E5', '#A3A3A3', '#737373', '#525252', '#404040', '#262626', '#171717'];

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, project }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [color, setColor] = useState(PROJECT_COLORS[0]);
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description);
            setDeadline(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');
            setColor(project.color || PROJECT_COLORS[0]);
            setTags(project.tags ? project.tags.join(', ') : '');
        } else {
            setName('');
            setDescription('');
            setDeadline('');
            setColor(PROJECT_COLORS[0]);
            setTags('');
        }
    }, [project, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave({
                name,
                description,
                deadline,
                color,
                tags: tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag !== '')
            });
            onClose();
        } catch (error) {
            console.error('Failed to save project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm'>
            <div className='w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200'>
                <div className='flex items-center justify-between p-6 border-b border-border'>
                    <h2 className='text-xl font-black uppercase tracking-tight'>
                        {project ? 'Edit Project' : 'New Project'}
                    </h2>
                    <button
                        onClick={onClose}
                        className='p-2 rounded-lg hover:bg-secondary transition-colors'
                    >
                        <X size={20} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className='p-6 space-y-6'
                >
                    <div className='space-y-2'>
                        <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                            Project Name
                        </label>
                        <input
                            autoFocus
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className='w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
                            placeholder='Strategic Initiative Name'
                        />
                    </div>

                    <div className='space-y-2'>
                        <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className='w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none'
                            placeholder='What is the objective of this project?'
                        />
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                Deadline
                            </label>
                            <div className='relative'>
                                <Calendar
                                    className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                                    size={16}
                                />
                                <input
                                    type='date'
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    className='w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
                                />
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                Project Color
                            </label>
                            <div className='flex flex-wrap gap-2 pt-1'>
                                {PROJECT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type='button'
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                            Tags (comma separated)
                        </label>
                        <input
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            className='w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
                            placeholder='cloud, infra, devops'
                        />
                    </div>

                    <div className='flex items-center justify-end gap-3 pt-4'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='px-6 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className='btn-primary px-8 py-2.5'
                        >
                            {isSubmitting ? 'Initialising...' : project ? 'Update Project' : 'Launch Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectModal;
