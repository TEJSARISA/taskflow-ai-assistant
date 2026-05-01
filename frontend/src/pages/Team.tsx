import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Search, Mail, Shield, LayoutGrid, List, Trash2 } from 'lucide-react';
import { userService } from '@/services/user.service';
import InviteModal from '@/components/team/InviteModal';
import UserDetailModal from '@/components/team/UserDetailModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

const Team = () => {
    const { user: currentUser } = useAuth();
    const { showToast, setIsSidebarOpen } = useUI();
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const canInvite = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const [userData, statsData] = await Promise.all([userService.getAllUsers(), userService.getTeamStats()]);
            setUsers(userData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching team data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from the team?`)) return;

        try {
            await userService.deleteUser(id);
            showToast(`User ${name} has been removed from the team.`);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            showToast('Failed to remove user. Please try again.', 'error');
        }
    };

    const handleViewUser = (user: any) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };

    const filteredUsers = users.filter(
        user =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getUserStats = (userId: string) => {
        return stats.find(s => s.userId === userId);
    };

    return (
        <div className='space-y-6 md:space-y-8 pb-20'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl md:text-3xl font-black tracking-tight text-foreground'>Team Management</h1>
                    <p className='text-muted-foreground mt-1 text-xs md:text-sm'>
                        Manage your team members and access levels.
                    </p>
                </div>
                {canInvite && (
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className='btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto'
                    >
                        <UserPlus size={18} />
                        <span>Invite Member</span>
                    </button>
                )}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8'>
                <div className='lg:col-span-2 space-y-6 md:space-y-8'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm'>
                        <div className='relative flex-1 w-full md:max-w-md group'>
                            <Search
                                className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
                                size={18}
                            />
                            <input
                                type='text'
                                placeholder='Search by name or email...'
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className='input-field pl-10 h-10 w-full'
                            />
                        </div>
                        <div className='flex items-center gap-3 self-end md:self-auto'>
                            <div className='flex items-center bg-secondary rounded-lg p-1 border border-border'>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className='h-48 rounded-2xl bg-secondary animate-pulse border border-border'
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-6' : 'space-y-4'}>
                            {filteredUsers.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-card border border-border overflow-hidden transition-all hover:border-primary/30 group ${
                                        viewMode === 'grid'
                                            ? 'rounded-2xl p-5 md:p-6 shadow-sm'
                                            : 'rounded-xl p-4 flex items-center justify-between'
                                    }`}
                                >
                                    <div
                                        className={`flex items-center gap-4 ${viewMode === 'grid' ? 'mb-4 md:mb-6' : ''}`}
                                    >
                                        <div className='shrink-0'>
                                            <img
                                                src={
                                                    user.avatar ||
                                                    `https://api.dicebear.com/7.x/initials/svg?seed=male-${user.name || user.email}`
                                                }
                                                alt={user.name}
                                                className='w-10 h-10 md:w-12 md:h-12 rounded-xl border border-border bg-secondary'
                                            />
                                        </div>
                                        <div className='min-w-0'>
                                            <h3 className='font-bold text-sm md:text-base text-foreground truncate'>
                                                {user.name || 'Anonymous User'}
                                            </h3>
                                            <div className='flex items-center gap-1.5 text-muted-foreground text-[10px] md:text-xs mt-0.5'>
                                                <Mail
                                                    size={12}
                                                    className='shrink-0'
                                                />
                                                <span className='truncate'>{user.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {viewMode === 'grid' && (
                                        <div className='space-y-4'>
                                            <div className='flex items-center justify-between text-xs'>
                                                <div className='flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-muted-foreground font-bold uppercase tracking-widest text-[8px] md:text-[9px] border border-border'>
                                                    <Shield size={12} />
                                                    <span>Member</span>
                                                </div>
                                                <span className='text-muted-foreground italic text-[9px] md:text-[10px]'>
                                                    Active
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2 pt-4 border-t border-border'>
                                                <button
                                                    onClick={() => handleViewUser(user)}
                                                    className='flex-1 btn-secondary py-2 text-xs'
                                                >
                                                    View
                                                </button>
                                                {currentUser?.role === 'Admin' && user.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                        className='p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-rose-500 transition-all'
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {viewMode === 'list' && (
                                        <div className='flex items-center gap-2 md:gap-6'>
                                            <div className='hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wider border border-border'>
                                                <Shield size={10} />
                                                <span>Member</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <button
                                                    onClick={() => handleViewUser(user)}
                                                    className='btn-secondary py-1.5 px-3 text-[10px] md:text-xs'
                                                >
                                                    Manage
                                                </button>
                                                {currentUser?.role === 'Admin' && user.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                        className='p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 transition-colors'
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className='space-y-6 md:space-y-8'>
                    <div className='card p-6 md:p-8 bg-secondary/20 border border-border shadow-2xl'>
                        <h3 className='text-xs md:text-sm font-black uppercase tracking-[0.2em] text-foreground mb-6 md:mb-8 flex items-center gap-3'>
                            <Shield
                                size={18}
                                className='text-primary'
                            />{' '}
                            Workload Intelligence
                        </h3>
                        <div className='space-y-5 md:space-y-6'>
                            {stats.slice(0, 5).map((stat, i) => (
                                <div
                                    key={stat.userId}
                                    className='space-y-2 md:space-y-3'
                                >
                                    <div className='flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest'>
                                        <span className='text-foreground truncate max-w-[120px]'>
                                            {stat.name || 'Operator'}
                                        </span>
                                        <span className='text-muted-foreground'>{stat.workload}%</span>
                                    </div>
                                    <div className='h-1.5 md:h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/50'>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.workload}%` }}
                                            className={`h-full rounded-full ${stat.workload > 80 ? 'bg-rose-500' : 'bg-primary'}`}
                                        ></motion.div>
                                    </div>
                                </div>
                            ))}
                            {stats.length === 0 && (
                                <p className='text-xs text-muted-foreground italic text-center'>
                                    Neural data processing...
                                </p>
                            )}
                        </div>
                        <div className='mt-8 md:mt-10 p-4 bg-primary/5 border border-primary/10 rounded-2xl'>
                            <p className='text-[10px] md:text-[11px] font-medium text-muted-foreground leading-relaxed italic text-center'>
                                {stats.some(s => s.workload > 80)
                                    ? 'Recommendation: Redistribute dossiers to balance load.'
                                    : 'Team load is optimized for maximum output.'}
                            </p>
                        </div>
                    </div>

                    <div className='card p-6 md:p-8 bg-primary text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden group'>
                        <div className='absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700'></div>
                        <h3 className='text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-4 md:mb-6 opacity-80'>
                            Collective Output
                        </h3>

                        <div className='flex items-end gap-2 mb-2'>
                            <span className='text-4xl md:text-5xl font-black tracking-tighter'>
                                {stats.length > 0
                                    ? (stats.reduce((acc, s) => acc + s.productivityScore, 0) / stats.length).toFixed(1)
                                    : '0.0'}
                            </span>
                            <span className='text-lg md:text-xl font-bold mb-1 md:mb-1.5 opacity-60'>SCORE</span>
                        </div>
                        <p className='text-[10px] md:text-[11px] font-medium opacity-80 leading-relaxed'>
                            Productivity index based on fulfillment and engagement.
                        </p>
                        <button
                            onClick={() => fetchUsers()}
                            className='w-full mt-6 md:mt-8 py-3 bg-white text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all'
                        >
                            Synchronize Analytics
                        </button>
                    </div>
                </div>
            </div>

            {!loading && filteredUsers.length === 0 && (
                <div className='text-center py-24 bg-card rounded-3xl border border-dashed border-border'>
                    <div className='w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground'>
                        <Users size={32} />
                    </div>
                    <h3 className='text-xl font-bold text-foreground'>No team members found</h3>
                    <p className='text-muted-foreground mt-1 max-w-xs mx-auto'>
                        Try adjusting your search criteria or invite new members to your team.
                    </p>
                </div>
            )}

            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={() => fetchUsers()}
            />

            <UserDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                user={selectedUser}
                stats={selectedUser ? getUserStats(selectedUser.id) : null}
            />
        </div>
    );
};

export default Team;
