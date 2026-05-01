import React, { useState } from 'react';
import { X, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { userService } from '@/services/user.service';
import { useUI } from '@/context/UIContext';
import { notificationService } from '@/services/notification.service';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (user: any) => void;
    projectId?: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, onSuccess, projectId }) => {
    const { showToast } = useUI();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        const normalizedEmail = email.trim().toLowerCase().replace(/\s+/g, '');
        if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            setError('A valid email address is required');
            setIsSubmitting(false);
            return;
        }
        try {
            const user = await userService.inviteUser(normalizedEmail, name, projectId);

            // Simulate email sending for testing purposes
            notificationService.addNotification({
                message: `Invitation email sent to ${normalizedEmail}. Subject: New TaskFlow AI Invitation.`,
                type: 'project_added'
            });

            showToast(`Invitation successfully sent to ${normalizedEmail}`);
            if (onSuccess) {
                onSuccess(user);
            }
            setEmail('');
            setName('');
            onClose();
        } catch (err: any) {
            console.error('Failed to invite user:', err);
            const errorMessage = err.response?.data?.message || err.message;

            if (errorMessage.includes('configuration') || errorMessage.includes('email')) {
                setError(
                    'The server encountered an error sending the invitation email. However, the user record may have been created. Please check the team list.'
                );
            } else {
                setError(errorMessage || 'Failed to invite user. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm'>
            <div className='w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200'>
                <div className='flex items-center justify-between p-6 border-b border-border'>
                    <h2 className='text-xl font-black uppercase tracking-tight'>Invite Member</h2>
                    <button
                        onClick={onClose}
                        className='p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground'
                    >
                        <X size={20} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className='p-6 space-y-6'
                >
                    {error && (
                        <div className='p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium'>
                            {error}
                        </div>
                    )}

                    <div className='space-y-2'>
                        <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                            Full Name (Optional)
                        </label>
                        <div className='relative'>
                            <UserIcon
                                className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                                size={16}
                            />
                            <input
                                type='text'
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className='w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
                                placeholder='John Doe'
                            />
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <label className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                            Email Address
                        </label>
                        <div className='relative'>
                            <Mail
                                className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                                size={16}
                            />
                            <input
                                type='email'
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className='w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
                                placeholder='john@example.com'
                            />
                        </div>
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
                            disabled={isSubmitting || !email}
                            className='btn-primary px-8 py-2.5 flex items-center gap-2'
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className='animate-spin'
                                    />
                                    <span>Inviting...</span>
                                </>
                            ) : (
                                'Send Invite'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteModal;
