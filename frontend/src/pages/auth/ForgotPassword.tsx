import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Sparkles, Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = ({ theme }: { theme?: string }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
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
                    <h1 className='text-3xl md:text-4xl font-black mb-2 tracking-tight'>Recover Access</h1>
                    <p className='text-muted-foreground text-sm font-medium'>
                        We'll send you instructions to reset your password.
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
                            <h2 className='text-xl font-black mb-2 uppercase tracking-tight'>Check your inbox</h2>
                            <p className='text-muted-foreground text-sm mb-8 leading-relaxed'>
                                We've sent a password recovery link to{' '}
                                <span className='text-foreground font-bold'>{email}</span>.
                            </p>
                            <Link
                                to='/login'
                                className='btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2'
                            >
                                <ArrowLeft size={18} />
                                <span className='font-black uppercase tracking-widest text-xs'>Back to Login</span>
                            </Link>
                        </motion.div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className='space-y-6'
                        >
                            <div className='space-y-2'>
                                <label className='text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1'>
                                    Work Email
                                </label>
                                <div className='relative group'>
                                    <Mail
                                        className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
                                        size={18}
                                    />
                                    <input
                                        type='email'
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className='input-field pl-12 h-12 bg-secondary/30 border-secondary focus:bg-background'
                                        placeholder='name@company.com'
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
                                            Send Reset Link
                                        </span>
                                        <ArrowRight
                                            size={18}
                                            className='group-hover:translate-x-1 transition-transform'
                                        />
                                    </div>
                                )}
                            </button>

                            <div className='pt-4 text-center'>
                                <Link
                                    to='/login'
                                    className='text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2'
                                >
                                    <ArrowLeft size={14} />
                                    <span>Return to Sign In</span>
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
