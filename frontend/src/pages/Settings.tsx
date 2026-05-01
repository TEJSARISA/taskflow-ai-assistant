import React, { useEffect, useState } from 'react';
import {
    User,
    Bell,
    Lock,
    Palette,
    Globe,
    Shield,
    Smartphone,
    CreditCard,
    Cloud,
    ChevronRight,
    Save,
    MessageSquare,
    Sun,
    Moon,
    Laptop
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsProps {
    themePreference?: ThemePreference;
    onThemePreferenceChange?: (theme: ThemePreference) => void;
}

const integrationCards = [
    {
        id: 'slack',
        name: 'Slack',
        desc: 'Sync communications.',
        defaultConnected: true,
        icon: MessageSquare
    },
    {
        id: 'google-drive',
        name: 'Google Drive',
        desc: 'Asset synchronization.',
        defaultConnected: false,
        icon: Cloud
    },
    {
        id: 'github',
        name: 'GitHub',
        desc: 'Codebase integration.',
        defaultConnected: false,
        icon: Smartphone
    }
];

const Settings = ({ themePreference = 'dark', onThemePreferenceChange }: SettingsProps) => {
    const { user } = useAuth();
    const { showToast } = useUI();
    const [activeTab, setActiveTab] = useState('profile');
    const [compactInterface, setCompactInterface] = useState(() => localStorage.getItem('compactInterface') === 'true');
    const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>(() => {
        try {
            const raw = localStorage.getItem('integrationStatus');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    return parsed;
                }
            }
        } catch {
            // Ignore malformed localStorage and use defaults.
        }
        return integrationCards.reduce<Record<string, boolean>>((acc, item) => {
            acc[item.id] = item.defaultConnected;
            return acc;
        }, {});
    });

    useEffect(() => {
        localStorage.setItem('compactInterface', compactInterface ? 'true' : 'false');
        document.body.classList.toggle('compact-ui', compactInterface);
    }, [compactInterface]);

    useEffect(() => {
        localStorage.setItem('integrationStatus', JSON.stringify(integrationStatus));
    }, [integrationStatus]);

    const handleThemeChange = (theme: ThemePreference) => {
        onThemePreferenceChange?.(theme);
        showToast(`Display mode set to ${theme}`, 'info');
    };

    const handleCompactToggle = () => {
        setCompactInterface(prev => {
            const next = !prev;
            showToast(next ? 'Compact interface enabled' : 'Compact interface disabled', 'info');
            return next;
        });
    };

    const toggleIntegration = (integrationId: string, integrationName: string) => {
        setIntegrationStatus(prev => {
            const nextConnected = !prev[integrationId];
            showToast(`${integrationName} ${nextConnected ? 'linked' : 'disconnected'}`, 'info');
            return {
                ...prev,
                [integrationId]: nextConnected
            };
        });
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security & Privacy', icon: Lock },
        { id: 'appearance', label: 'Display & Theme', icon: Palette },
        { id: 'integrations', label: 'Neural Link Hub', icon: Globe },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard }
    ];

    return (
        <div className='max-w-6xl mx-auto space-y-6 md:space-y-8 pb-20'>
            <div>
                <h1 className='text-2xl md:text-3xl font-black tracking-tight text-foreground'>System Preferences</h1>
                <p className='text-muted-foreground mt-1 text-xs md:text-sm'>
                    Configure your personal and workspace settings.
                </p>
            </div>

            <div className='flex flex-col lg:flex-row gap-6 md:gap-8'>
                {/* Settings Sidebar - Tabs on mobile */}
                <div className='w-full lg:w-64 shrink-0 flex lg:flex-col overflow-x-auto no-scrollbar gap-1 border-b lg:border-b-0 lg:border-r border-border pb-4 lg:pb-0'>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 md:py-3 rounded-xl transition-all duration-300 whitespace-nowrap lg:w-full ${
                                activeTab === tab.id
                                    ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent font-medium'
                            }`}
                        >
                            <tab.icon
                                size={18}
                                className='shrink-0'
                            />
                            <span className='text-sm'>{tab.label}</span>
                            {activeTab === tab.id && (
                                <ChevronRight
                                    size={14}
                                    className='ml-auto hidden lg:block'
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className='flex-1 space-y-6'>
                    <div className='card shadow-xl p-5 md:p-8 min-h-[400px] md:min-h-[500px]'>
                        {activeTab === 'profile' && (
                            <div className='space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                                <div className='flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6'>
                                    <div className='relative group shrink-0'>
                                        <img
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                                            className='w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-border p-1 bg-secondary shadow-lg transition-transform group-hover:scale-105'
                                            alt='Profile'
                                        />
                                        <button className='absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-widest'>
                                            Change
                                        </button>
                                    </div>
                                    <div className='min-w-0'>
                                        <h3 className='text-lg md:text-xl font-black text-foreground truncate'>
                                            {user?.name || 'User Profile'}
                                        </h3>
                                        <p className='text-muted-foreground text-xs md:text-sm truncate'>
                                            {user?.email}
                                        </p>
                                        <div className='flex items-center justify-center sm:justify-start gap-2 mt-2'>
                                            <span className='px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] md:text-[10px] font-black uppercase tracking-wider border border-primary/20'>
                                                {user?.role || 'Member'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
                                    <div className='space-y-2'>
                                        <label className='text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1'>
                                            Full Name
                                        </label>
                                        <input
                                            type='text'
                                            className='input-field'
                                            defaultValue={user?.name || ''}
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                        <label className='text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1'>
                                            Email
                                        </label>
                                        <input
                                            type='email'
                                            className='input-field'
                                            defaultValue={user?.email || ''}
                                            disabled
                                        />
                                    </div>
                                    <div className='md:col-span-2 space-y-2'>
                                        <label className='text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1'>
                                            Professional Title
                                        </label>
                                        <input
                                            type='text'
                                            className='input-field'
                                            placeholder='e.g. Senior Project Manager'
                                        />
                                    </div>
                                    <div className='md:col-span-2 space-y-2'>
                                        <label className='text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1'>
                                            Bio / About Me
                                        </label>
                                        <textarea
                                            className='input-field min-h-[100px] resize-none'
                                            placeholder='Short description...'
                                        ></textarea>
                                    </div>
                                </div>

                                <div className='flex justify-end pt-2 md:pt-4'>
                                    <button className='btn-primary w-full sm:w-auto px-8 flex items-center justify-center gap-2 shadow-lg shadow-primary/20'>
                                        <Save size={18} />
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className='space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                                <div className='flex items-center gap-3 mb-4 md:mb-6'>
                                    <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20'>
                                        <Bell size={20} />
                                    </div>
                                    <h3 className='text-lg md:text-xl font-black text-foreground'>Notifications</h3>
                                </div>

                                <div className='space-y-3 md:space-y-4'>
                                    {[
                                        {
                                            title: 'Project Updates',
                                            desc: 'Updates in projects you follow.',
                                            default: true
                                        },
                                        {
                                            title: 'Assignment Alerts',
                                            desc: 'When you are assigned new tasks.',
                                            default: true
                                        },
                                        { title: 'Comments & Mentions', desc: 'When someone tags you.', default: true },
                                        {
                                            title: 'System Status',
                                            desc: 'Alerts regarding platform updates.',
                                            default: false
                                        }
                                    ].map((pref, i) => (
                                        <div
                                            key={i}
                                            className='flex items-center justify-between p-3 md:p-4 rounded-xl bg-secondary/30 border border-border group hover:bg-secondary/50 transition-colors'
                                        >
                                            <div className='min-w-0 pr-4'>
                                                <h4 className='font-bold text-sm md:text-base text-foreground truncate'>
                                                    {pref.title}
                                                </h4>
                                                <p className='text-[10px] md:text-xs text-muted-foreground truncate'>
                                                    {pref.desc}
                                                </p>
                                            </div>
                                            <div className='relative inline-flex items-center cursor-pointer shrink-0'>
                                                <input
                                                    type='checkbox'
                                                    className='sr-only peer'
                                                    defaultChecked={pref.default}
                                                />
                                                <div className="w-10 h-5 md:w-11 md:h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'integrations' && (
                            <div className='space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                                <div className='flex items-center gap-3 mb-4 md:mb-6'>
                                    <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20'>
                                        <Globe size={20} />
                                    </div>
                                    <h3 className='text-lg md:text-xl font-black text-foreground'>Link Hub</h3>
                                </div>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6'>
                                    {integrationCards.map(integ => (
                                        <div
                                            key={integ.id}
                                            className='p-5 md:p-6 rounded-2xl bg-secondary/30 border border-border group hover:border-primary/30 transition-all'
                                        >
                                            <div className='flex items-start justify-between mb-4'>
                                                <div className='w-10 h-10 md:w-12 md:h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform'>
                                                    <integ.icon
                                                        size={20}
                                                        className='md:w-6 md:h-6'
                                                    />
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${integrationStatus[integ.id] ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-secondary text-muted-foreground border border-border'}`}
                                                >
                                                    {integrationStatus[integ.id] ? 'Linked' : 'Offline'}
                                                </span>
                                            </div>
                                            <h4 className='font-bold text-sm md:text-base text-foreground mb-1'>
                                                {integ.name}
                                            </h4>
                                            <p className='text-[10px] md:text-xs text-muted-foreground mb-4 md:mb-6 font-medium line-clamp-1'>
                                                {integ.desc}
                                            </p>
                                            <button
                                                type='button'
                                                onClick={() => toggleIntegration(integ.id, integ.name)}
                                                className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${integrationStatus[integ.id] ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-primary text-primary-foreground hover:shadow-lg shadow-primary/20'}`}
                                            >
                                                {integrationStatus[integ.id] ? 'Sever Link' : 'Establish'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className='space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                                <div className='flex items-center gap-3 mb-4 md:mb-6'>
                                    <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20'>
                                        <Palette size={20} />
                                    </div>
                                    <h3 className='text-lg md:text-xl font-black text-foreground'>Display</h3>
                                </div>

                                <div className='space-y-6'>
                                    <div className='grid grid-cols-3 gap-3 md:gap-4'>
                                        {[
                                            { id: 'light', label: 'Light', icon: Sun },
                                            { id: 'dark', label: 'Dark', icon: Moon },
                                            { id: 'system', label: 'Sys', icon: Laptop }
                                        ].map(theme => {
                                            const isActive = themePreference === theme.id;
                                            return (
                                                <button
                                                    key={theme.id}
                                                    type='button'
                                                    onClick={() => handleThemeChange(theme.id as ThemePreference)}
                                                    className={`p-3 md:p-4 rounded-2xl border-2 flex flex-col items-center gap-2 md:gap-3 transition-all ${
                                                        isActive
                                                            ? 'border-primary bg-primary/5 text-primary'
                                                            : 'border-border bg-secondary/30 text-muted-foreground hover:border-border/50'
                                                    }`}
                                                >
                                                    <theme.icon
                                                        size={20}
                                                        className='md:w-6 md:h-6'
                                                    />
                                                    <span className='text-[10px] font-bold uppercase tracking-widest'>
                                                        {theme.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className='space-y-3 md:space-y-4 pt-4 border-t border-border'>
                                        <div className='flex items-center justify-between p-3 md:p-4 rounded-xl bg-secondary/30 border border-border'>
                                            <div className='min-w-0 pr-4'>
                                                <h4 className='font-bold text-sm md:text-base text-foreground truncate'>
                                                    Compact Interface
                                                </h4>
                                                <p className='text-[10px] md:text-xs text-muted-foreground truncate'>
                                                    Maximize data density.
                                                </p>
                                            </div>
                                            <div className='relative inline-flex items-center cursor-pointer shrink-0'>
                                                <input
                                                    type='checkbox'
                                                    className='sr-only peer'
                                                    checked={compactInterface}
                                                    onChange={handleCompactToggle}
                                                />
                                                <div className="w-10 h-5 md:w-11 md:h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className='space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                                <div className='flex items-center gap-3 mb-4 md:mb-6'>
                                    <div className='w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20'>
                                        <Lock size={20} />
                                    </div>
                                    <h3 className='text-lg md:text-xl font-black text-foreground'>Security</h3>
                                </div>

                                <div className='space-y-4 md:space-y-6'>
                                    <div className='p-5 md:p-6 rounded-2xl border border-border bg-secondary/20'>
                                        <h4 className='font-bold text-sm md:text-base text-foreground mb-3 md:mb-4 flex items-center gap-2'>
                                            <Shield
                                                size={16}
                                                className='text-primary'
                                            />{' '}
                                            Two-Factor Auth
                                        </h4>
                                        <p className='text-[10px] md:text-xs text-muted-foreground mb-4 md:mb-6 leading-relaxed'>
                                            Add an additional layer of security to your strategic accounts.
                                        </p>
                                        <button className='btn-secondary w-full sm:w-auto px-6 text-[10px] md:text-xs py-2'>
                                            Initialize
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className='flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4 animate-in fade-in duration-500'>
                                <div className='w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2.5rem] bg-secondary border border-border flex items-center justify-center text-muted-foreground'>
                                    <CreditCard
                                        size={28}
                                        className='md:w-9 md:h-9'
                                    />
                                </div>
                                <div>
                                    <h3 className='text-lg md:text-xl font-bold text-foreground'>Billing Matrix</h3>
                                    <p className='text-muted-foreground max-w-xs mx-auto text-[10px] md:text-sm mt-2 font-medium'>
                                        Subscription management is currently being synchronized.
                                    </p>
                                </div>
                                <button className='btn-primary mt-4 px-8 md:px-10'>Request Access</button>
                            </div>
                        )}
                    </div>

                    <div className='flex items-center gap-3 md:gap-4 p-4 md:p-6 rounded-2xl bg-primary/5 border border-primary/20'>
                        <div className='w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0'>
                            <Shield
                                size={18}
                                className='md:w-5 md:h-5'
                            />
                        </div>
                        <div className='min-w-0'>
                            <p className='text-[11px] md:text-sm font-bold text-foreground truncate'>
                                Workspace Privacy Shield
                            </p>
                            <p className='text-[9px] md:text-xs text-muted-foreground line-clamp-1'>
                                Your data is encrypted according to protocols.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
