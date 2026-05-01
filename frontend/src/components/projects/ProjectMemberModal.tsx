import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Loader2, Check } from 'lucide-react';
import { User, Project } from '@/types';
import { userService } from '@/services/user.service';
import { projectService } from '@/services/project.service';
import InviteModal from '@/components/team/InviteModal';
import { useAuth } from '@/context/AuthContext';

interface ProjectMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: (updatedProject: Project) => void;
}

const ProjectMemberModal: React.FC<ProjectMemberModalProps> = ({ isOpen, onClose, project, onUpdate }) => {
    const { user: currentUser } = useAuth();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const canInvite = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const users = await userService.getAllUsers();
            setAllUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredUsers = allUsers.filter(
        user =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMember = async (userId: string) => {
        setIsUpdating(true);
        try {
            let newTeamMembers = [...project.teamMembers];
            if (newTeamMembers.includes(userId)) {
                newTeamMembers = newTeamMembers.filter(id => id !== userId);
            } else {
                newTeamMembers.push(userId);
            }

            const updated = await projectService.updateProject(project.id, { teamMembers: newTeamMembers });
            onUpdate(updated);
        } catch (error) {
            console.error('Failed to update project members:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm'>
            <div className='w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200'>
                <div className='flex items-center justify-between p-6 border-b border-border'>
                    <h2 className='text-xl font-black uppercase tracking-tight'>Manage Access</h2>
                    <button
                        onClick={onClose}
                        className='p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='p-6 space-y-6'>
                    <div className='flex items-center gap-4'>
                        <div className='relative flex-1'>
                            <Search
                                className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                                size={16}
                            />
                            <input
                                type='text'
                                placeholder='Search registered users...'
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className='w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
                            />
                        </div>
                        {canInvite && (
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className='p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all shadow-sm flex items-center gap-2 group'
                                title='Invite new user by email'
                            >
                                <UserPlus
                                    size={18}
                                    className='group-hover:scale-110 transition-transform'
                                />
                                <span className='text-[10px] font-black uppercase tracking-widest hidden md:inline'>
                                    Invite New
                                </span>
                            </button>
                        )}
                    </div>

                    <div className='max-h-[350px] overflow-y-auto space-y-2 pr-2 custom-scrollbar'>
                        {loading ? (
                            <div className='flex flex-col items-center py-10 gap-2'>
                                <Loader2
                                    size={24}
                                    className='animate-spin text-primary'
                                />
                                <span className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                                    Loading Users...
                                </span>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className='text-center py-10'>
                                <p className='text-muted-foreground text-sm'>
                                    No registered users found matching "{searchQuery}"
                                </p>
                                {canInvite && (
                                    <button
                                        onClick={() => setIsInviteModalOpen(true)}
                                        className='mt-3 text-primary text-xs font-black uppercase tracking-widest hover:underline'
                                    >
                                        Invite New Person via Email
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredUsers.map(user => {
                                const isMember = project.teamMembers.includes(user.id);
                                const isCreator = project.createdBy === user.id;

                                return (
                                    <div
                                        key={user.id}
                                        className='flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-all group'
                                    >
                                        <div className='flex items-center gap-3'>
                                            <div className='shrink-0'>
                                                <img
                                                    src={
                                                        user.avatar ||
                                                        `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || user.email}`
                                                    }
                                                    alt={user.name}
                                                    className='w-8 h-8 rounded-lg border border-border bg-background'
                                                />
                                            </div>
                                            <div className='min-w-0'>
                                                <p className='text-sm font-bold truncate'>{user.name || 'Anonymous'}</p>
                                                <p className='text-[10px] text-muted-foreground truncate'>
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        {isCreator ? (
                                            <span className='px-2 py-1 rounded-md bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20'>
                                                Creator
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => toggleMember(user.id)}
                                                disabled={isUpdating}
                                                className={`p-2 rounded-lg transition-all ${
                                                    isMember
                                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                        : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                                                }`}
                                            >
                                                {isMember ? <Check size={16} /> : <UserPlus size={16} />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className='flex items-center justify-end pt-4'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='btn-primary px-8 py-2.5'
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={newUser => {
                    fetchUsers();
                    if (newUser && newUser.id) {
                        onUpdate({
                            ...project,
                            teamMembers: [...project.teamMembers, newUser.id]
                        });
                    }
                }}
                projectId={project.id}
            />
        </div>
    );
};

export default ProjectMemberModal;
