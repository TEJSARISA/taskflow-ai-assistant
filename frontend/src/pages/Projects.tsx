import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Users, List, Grid2X2, Search, ArrowRight, X, FolderKanban } from 'lucide-react';
import { projectService } from '@/services/project.service';
import { Project } from '@/types';
import { Link } from 'react-router-dom';
import ProjectModal from '@/components/projects/ProjectModal';

import { useUI } from '@/context/UIContext';
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';

const FolderIcon = ({ name }: { name: string }) => {
    return <span className='font-black text-xl'>{name.charAt(0)}</span>;
};

const Projects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
    const { showToast } = useUI();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectService.getProjects();
                setProjects(data);
            } catch (error) {
                console.error('Error fetching projects:', error);
                showToast('Failed to load projects', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [showToast]);

    const handleSaveProject = async (projectData: Partial<Project>) => {
        try {
            if (selectedProject) {
                const updated = await projectService.updateProject(selectedProject.id, projectData);
                setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
                showToast('Project updated successfully');
            } else {
                const created = await projectService.createProject(projectData);
                setProjects(prev => [created, ...prev]);
                showToast('Project created successfully');
            }
            setIsProjectModalOpen(false);
        } catch (error) {
            showToast('Failed to save project', 'error');
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (confirm('Are you sure you want to delete this project and all its tasks?')) {
            try {
                await projectService.deleteProject(projectId);
                setProjects(prev => prev.filter(p => p.id !== projectId));
                showToast('Project deleted successfully');
            } catch (error) {
                showToast('Failed to delete project', 'error');
            }
        }
    };

    const filteredProjects = projects.filter(
        p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className='space-y-6 md:space-y-10 pb-20'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div>
                    <h1 className='text-2xl md:text-4xl font-black tracking-tight text-foreground'>
                        Project Portfolio
                    </h1>
                    <p className='text-muted-foreground mt-1 text-xs md:text-sm font-medium'>
                        Coordinate and track high-level initiatives
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
                            placeholder='Filter projects...'
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
                                <Grid2X2 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedProject(undefined);
                                setIsProjectModalOpen(true);
                            }}
                            className='btn-primary flex-1 sm:flex-none'
                        >
                            <Plus size={20} />
                            <span>New Project</span>
                        </button>
                    </div>
                </div>
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
            ) : filteredProjects.length === 0 ? (
                <div className='text-center py-20 md:py-32 bg-card rounded-3xl border border-dashed border-border flex flex-col items-center justify-center px-4'>
                    <div className='w-16 h-16 md:w-20 md:h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 text-muted-foreground'>
                        <FolderKanban
                            size={32}
                            className='md:w-10 md:h-10'
                        />
                    </div>
                    <h3 className='text-xl md:text-2xl font-black text-foreground'>Initiative Vacuum Detected</h3>
                    <p className='text-muted-foreground mt-2 max-w-sm font-medium text-sm'>
                        No projects match your current filters or your portfolio is empty. Time to launch something
                        spectacular.
                    </p>
                    <button
                        onClick={() => setIsProjectModalOpen(true)}
                        className='btn-primary mt-8 px-8'
                    >
                        <Plus size={20} />
                        <span>Create New Project</span>
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
                    {filteredProjects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link
                                to={`/projects/${project.id}`}
                                className='block group h-full'
                            >
                                <div
                                    className='card h-full flex flex-col hover:shadow-2xl transition-all duration-500 relative overflow-hidden group p-5 md:p-6'
                                    style={{ borderTop: `4px solid ${project.color || 'var(--primary)'}` }}
                                >
                                    {/* Hover gradient effect */}
                                    <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />

                                    <div className='flex items-start justify-between mb-4 md:mb-6 relative z-10'>
                                        <div
                                            className='w-12 h-12 md:w-14 md:h-14 bg-secondary rounded-2xl flex items-center justify-center text-primary border border-border group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-500'
                                            style={{ color: project.color }}
                                        >
                                            <FolderIcon name={project.name} />
                                        </div>
                                        <div className='flex gap-1 relative z-20'>
                                            <button
                                                onClick={e => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSelectedProject(project);
                                                    setIsProjectModalOpen(true);
                                                }}
                                                className='p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-primary transition-all'
                                            >
                                                <Plus
                                                    size={18}
                                                    className='rotate-45'
                                                />
                                            </button>
                                            <button
                                                onClick={e => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteProject(project.id);
                                                }}
                                                className='p-2 hover:bg-rose-500/10 rounded-xl text-muted-foreground hover:text-rose-500 transition-all'
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className='relative z-10 flex-1'>
                                        <h3 className='text-xl md:text-2xl font-black mb-1 md:mb-2 group-hover:text-primary transition-colors tracking-tight text-foreground line-clamp-1'>
                                            {project.name}
                                        </h3>
                                        <p className='text-muted-foreground text-xs md:text-sm leading-relaxed line-clamp-2 mb-4 font-medium italic'>
                                            "{project.description}"
                                        </p>

                                        {project.tags && project.tags.length > 0 && (
                                            <div className='flex flex-wrap gap-1 mb-4'>
                                                {project.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className='text-[8px] font-black uppercase tracking-widest bg-secondary text-muted-foreground px-2 py-0.5 rounded border border-border'
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className='space-y-4 md:space-y-6 relative z-10 pt-4 md:pt-6 border-t border-border mt-auto'>
                                        <div className='flex items-center justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest'>
                                            <div className='flex items-center gap-1.5 md:gap-2 text-muted-foreground'>
                                                <Calendar
                                                    size={12}
                                                    className='text-primary/50'
                                                />
                                                <span>Ends {new Date(project.deadline).toLocaleDateString()}</span>
                                            </div>
                                            <div className='flex items-center gap-1.5 md:gap-2 text-muted-foreground'>
                                                <Users
                                                    size={12}
                                                    className='text-primary/50'
                                                />
                                                <span>{project.teamMembers.length} Core</span>
                                            </div>
                                        </div>

                                        <div className='space-y-2'>
                                            <div className='flex justify-between items-center text-[9px] md:text-[10px] font-bold'>
                                                <span className='text-muted-foreground'>Operational Progress</span>
                                                <span className='text-primary'>
                                                    {(project._count?.tasks ?? 0) > 0
                                                        ? Math.round(
                                                              ((project.tasks?.length || 0) /
                                                                  (project._count?.tasks || 1)) *
                                                                  100
                                                          )
                                                        : 0}
                                                    %
                                                </span>
                                            </div>
                                            <div className='w-full bg-secondary h-1.5 rounded-full overflow-hidden'>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${
                                                            (project._count?.tasks ?? 0) > 0
                                                                ? Math.round(
                                                                      ((project.tasks?.length || 0) /
                                                                          (project._count?.tasks || 1)) *
                                                                          100
                                                                  )
                                                                : 0
                                                        }%`
                                                    }}
                                                    className='bg-gradient-to-r from-primary to-accent h-full rounded-full'
                                                ></motion.div>
                                            </div>
                                        </div>

                                        <div className='flex items-center justify-between pt-2'>
                                            <div className='flex items-center gap-1 text-[9px] md:text-[10px] font-black text-muted-foreground uppercase'>
                                                <span>Enter</span>
                                                <ArrowRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className='card !p-0 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full min-w-[800px] md:min-w-0'>
                            <thead>
                                <tr className='text-left text-muted-foreground text-[10px] uppercase font-black tracking-widest bg-secondary/50'>
                                    <th className='px-6 md:px-8 py-4 md:py-5'>Initiative</th>
                                    <th className='px-6 md:px-8 py-4 md:py-5'>Status</th>
                                    <th className='px-6 md:px-8 py-4 md:py-5'>Timeline</th>
                                    <th className='px-6 md:px-8 py-4 md:py-5'>Action</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-border'>
                                {filteredProjects.map(project => (
                                    <tr
                                        key={project.id}
                                        className='group hover:bg-secondary/30 transition-colors'
                                    >
                                        <td className='px-6 md:px-8 py-4 md:py-6'>
                                            <Link
                                                to={`/projects/${project.id}`}
                                                className='flex items-center gap-4'
                                            >
                                                <div className='w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0 text-primary border border-border group-hover:border-primary/30 transition-all'>
                                                    <FolderIcon name={project.name} />
                                                </div>
                                                <div className='min-w-0'>
                                                    <p className='font-bold text-sm md:text-base tracking-tight group-hover:text-primary transition-colors text-foreground truncate'>
                                                        {project.name}
                                                    </p>
                                                    <p className='text-[10px] md:text-xs text-muted-foreground truncate max-w-[150px] md:max-w-[200px]'>
                                                        {project.description}
                                                    </p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className='px-6 md:px-8 py-4 md:py-6 whitespace-nowrap'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-2 h-2 rounded-full bg-emerald-500'></div>
                                                <span className='text-xs font-bold text-foreground/60'>Active</span>
                                            </div>
                                        </td>
                                        <td className='px-6 md:px-8 py-4 md:py-6 whitespace-nowrap'>
                                            <p className='text-xs font-bold text-muted-foreground'>
                                                {new Date(project.deadline).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className='px-6 md:px-8 py-4 md:py-6 whitespace-nowrap'>
                                            <Link
                                                to={`/projects/${project.id}`}
                                                className='text-primary hover:underline text-xs font-black uppercase tracking-widest'
                                            >
                                                Execute
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onSave={handleSaveProject}
                project={selectedProject}
            />
        </div>
    );
};

export default Projects;
