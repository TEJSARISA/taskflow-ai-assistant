import React, { useEffect, useState } from 'react';
import { Search, Filter, Clock } from 'lucide-react';
import { activityLogService } from '@/services/activityLog.service';
import { formatDistanceToNow } from 'date-fns';

const ActivityLog = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await activityLogService.getActivityLogs();
                setLogs(data);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(
        log =>
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action: string) => {
        if (action.includes('CREATED')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (action.includes('DELETED')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        if (action.includes('UPDATED')) return 'text-primary bg-primary/10 border-primary/20';
        return 'text-muted-foreground bg-secondary border-border';
    };

    return (
        <div className='max-w-6xl mx-auto space-y-8 pb-20'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div>
                    <h1 className='text-3xl font-black tracking-tight text-foreground'>Activity Log</h1>
                    <p className='text-muted-foreground mt-1 text-sm font-medium italic'>
                        Full audit trail of all workspace actions
                    </p>
                </div>
                <div className='flex items-center gap-3'>
                    <div className='relative'>
                        <Search
                            size={18}
                            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                        />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder='Filter actions...'
                            className='input-field pl-10 w-full md:w-64'
                        />
                    </div>
                    <button className='btn-secondary h-11 px-4'>
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            <div className='card !p-0 overflow-hidden shadow-2xl'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left border-collapse'>
                        <thead>
                            <tr className='bg-secondary/50 border-b border-border'>
                                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                    User
                                </th>
                                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                    Action
                                </th>
                                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                    Timestamp
                                </th>
                                <th className='px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                    ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-border'>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr
                                        key={i}
                                        className='animate-pulse'
                                    >
                                        <td className='px-6 py-4'>
                                            <div className='h-4 bg-secondary rounded w-24'></div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='h-4 bg-secondary rounded w-32'></div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='h-4 bg-secondary rounded w-20'></div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='h-4 bg-secondary rounded w-12'></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className='px-6 py-12 text-center italic text-muted-foreground'
                                    >
                                        No matching activity logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr
                                        key={log.id}
                                        className='hover:bg-secondary/20 transition-colors group'
                                    >
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center overflow-hidden'>
                                                    <img
                                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=male-${log.user?.name || log.userId}`}
                                                        alt='avatar'
                                                    />
                                                </div>
                                                <span className='font-bold text-sm text-foreground'>
                                                    {log.user?.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <span
                                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getActionColor(log.action)}`}
                                            >
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-2 text-xs text-muted-foreground font-medium'>
                                                <Clock
                                                    size={14}
                                                    className='opacity-50'
                                                />
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <span className='text-[10px] font-mono text-muted-foreground opacity-50'>
                                                #{log.id.slice(0, 8)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex items-center justify-center gap-2'>
                <button
                    className='w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-50'
                    disabled
                >
                    1
                </button>
                <button className='w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-all'>
                    2
                </button>
                <button className='w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-all'>
                    3
                </button>
                <span className='text-muted-foreground px-2'>...</span>
                <button className='w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-all'>
                    12
                </button>
            </div>
        </div>
    );
};

export default ActivityLog;
