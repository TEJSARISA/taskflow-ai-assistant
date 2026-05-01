import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Sparkles, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = ({ theme }: { theme?: string }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (!token) {
            setError('Invalid or expired reset token.');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(password, token);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`min-h-screen bg-background text-foreground flex items-center justify-center p-6 ${theme === 'dark' ? 'dark' : ''}`}
        >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]'></div>
                <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]'></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className='w-full max-w-md relative'
            >
                <div className='text-center mb-6 md:mb-10'>
                    <div className='inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-4 md:mb-6'>
                        <Sparkles className='text-primary-foreground w-6 h-6 md:w-8 md:h-8' />
                    </div>
                    <h1 className='text-3xl md:text-4xl font-black mb-2 tracking-tight'>Set New Password</h1>
                    <p className='text-muted-foreground text-sm font-medium'>
                        Create a secure password for your account.
                    </p>
                </div>

                <div className='bg-card border border-border p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden'>
                    <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-50'></div>

                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className='text-center py-4'
                        >
                            <div className='w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20'>
                                <CheckCircle2
                                    className='text-emerald-500'
                                    size={32}
                                />
                            </div>
                            <h2 className='text-xl font-black mb-2 uppercase tracking-tight'>Success!</h2>
                            <p className='text-muted-foreground text-sm mb-8 leading-relaxed'>
                                Your password has been reset successfully. Redirecting you to login...
                            </p>
                            <Link
                                to='/login'
                                className='text-primary font-black uppercase tracking-widest text-xs hover:underline'
                            >
                                Go to login now
                            </Link>
                        </motion.div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className='space-y-6'
                        >
                            <div className='space-y-2'>
                                <label className='text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1'>
                                    New Password
                                </label>
                                <div className='relative group'>
                                    <Lock
                                        className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
                                        size={18}
                                    />
                                    <input
                                        type='password'
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className='input-field pl-12 h-12 bg-secondary/30 border-secondary focus:bg-background'
                                        placeholder='••••••••'
                                        required
                                    />
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <label className='text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1'>
                                    Confirm Password
                                </label>
                                <div className='relative group'>
                                    <Lock
                                        className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
                                        size={18}
                                    />
                                    <input
                                        type='password'
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className='input-field pl-12 h-12 bg-secondary/30 border-secondary focus:bg-background'
                                        placeholder='••••••••'
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className='bg-destructive/10 border border-destructive/20 p-3 rounded-xl flex items-center gap-3'>
                                    <p className='text-destructive text-xs font-bold'>{error}</p>
                                </div>
                            )}

                            <button
                                type='submit'
                                disabled={loading}
                                className='btn-primary w-full py-4 rounded-xl shadow-lg shadow-primary/20 group h-14'
                            >
                                {loading ? (
                                    <Loader2 className='animate-spin mx-auto' />
                                ) : (
                                    <div className='flex items-center justify-center gap-2'>
                                        <span className='font-black uppercase tracking-widest text-xs'>
                                            Reset Password
                                        </span>
                                        <ArrowRight
                                            size={18}
                                            className='group-hover:translate-x-1 transition-transform'
                                        />
                                    </div>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
