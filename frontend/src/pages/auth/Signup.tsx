import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = ({ theme }: { theme?: string }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const validate = () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasLetter || !hasNumber) {
            setError('Password must contain at least one letter and one number for security');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setError('');
        if (!validate()) return;

        setLoading(true);
        try {
            await register({ name, email, password });
            navigate('/');
        } catch (err: any) {
            console.error('Registration error:', err);
            const errorMessage = err.response?.data?.message || err.message || '';

            if (
                errorMessage.toLowerCase().includes('already exists') ||
                (err.response?.status === 400 && errorMessage.toLowerCase().includes('email'))
            ) {
                setError('This email address is already registered. Please sign in instead.');
            } else {
                setError(errorMessage || 'Registration failed. Please check your details and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`min-h-screen bg-background text-foreground flex items-center justify-center p-6 ${theme === 'dark' ? 'dark' : ''}`}
        >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]'></div>
                <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]'></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='w-full max-w-md relative'
            >
                <div className='text-center mb-8'>
                    <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className='inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-6'
                    >
                        <Sparkles className='text-primary-foreground w-8 h-8' />
                    </motion.div>
                    <h1 className='text-4xl font-black mb-2 tracking-tight'>Join TaskFlow</h1>
                    <p className='text-muted-foreground text-sm font-medium'>
                        Create your enterprise account to get started.
                    </p>
                </div>

                <div className='bg-card border border-border p-8 rounded-3xl shadow-2xl relative overflow-hidden'>
                    <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-30'></div>

                    <form
                        onSubmit={handleSubmit}
                        className='space-y-5'
                    >
                        <div className='space-y-2'>
                            <label className='text-[11px] uppercase tracking-widest font-black text-muted-foreground ml-1'>
                                Full Name
                            </label>
                            <div className='relative group'>
                                <User
                                    className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
                                    size={18}
                                />
                                <input
                                    type='text'
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className='input-field pl-12 h-12 bg-secondary/20 border-border focus:border-primary focus:bg-background transition-all'
                                    placeholder='John Doe'
                                    required
                                />
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <label className='text-[11px] uppercase tracking-widest font-black text-muted-foreground ml-1'>
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
                                    className='input-field pl-12 h-12 bg-secondary/20 border-border focus:border-primary focus:bg-background transition-all'
                                    placeholder='name@company.com'
                                    required
                                />
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <label className='text-[11px] uppercase tracking-widest font-black text-muted-foreground ml-1'>
                                Password
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
                                    className='input-field pl-12 h-12 bg-secondary/20 border-border focus:border-primary focus:bg-background transition-all'
                                    placeholder='••••••••'
                                    required
                                />
                            </div>
                            <p className='text-[10px] text-muted-foreground font-medium ml-1'>
                                Security requirement: 8+ characters, letters & numbers.
                            </p>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className='overflow-hidden'
                                >
                                    <div className='bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-start gap-3'>
                                        <AlertCircle className='text-destructive w-5 h-5 shrink-0 mt-0.5' />
                                        <p className='text-destructive text-sm font-medium leading-snug'>{error}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type='submit'
                            disabled={loading}
                            className='w-full py-4 rounded-xl shadow-lg group h-14 relative overflow-hidden transition-all bg-primary text-primary-foreground shadow-primary/20'
                        >
                            {loading ? (
                                <div className='flex items-center justify-center gap-3'>
                                    <Loader2
                                        className='animate-spin'
                                        size={20}
                                    />
                                    <span className='font-black uppercase tracking-widest text-xs'>
                                        Creating account...
                                    </span>
                                </div>
                            ) : (
                                <div className='flex items-center justify-center gap-2'>
                                    <span className='font-black uppercase tracking-widest text-xs'>
                                        Start Free Trial
                                    </span>
                                    <ArrowRight
                                        size={18}
                                        className='group-hover:translate-x-1 transition-transform'
                                    />
                                </div>
                            )}
                        </button>
                    </form>

                    <div className='mt-6'>
                        <button
                            type='button'
                            onClick={() => {
                                setError('');
                                try {
                                    googleLogin();
                                } catch (err: any) {
                                    setError(err?.message || 'Google sign-up is not configured');
                                }
                            }}
                            className='w-full py-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary transition-all font-bold text-sm text-foreground flex items-center justify-center gap-3'
                        >
                            <svg
                                width='18'
                                height='18'
                                viewBox='0 0 24 24'
                                aria-hidden='true'
                            >
                                <path
                                    fill='#EA4335'
                                    d='M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.6C16.7 2.8 14.5 2 12 2 6.9 2 2.8 6.4 2.8 11.8S6.9 21.6 12 21.6c6.9 0 9.2-5 9.2-7.5 0-.5-.1-.9-.1-1.3z'
                                />
                            </svg>
                            <span>Continue with Google</span>
                        </button>
                    </div>

                    <div className='mt-8 pt-8 border-t border-border text-center'>
                        <p className='text-muted-foreground text-sm font-medium'>
                            Already have an account?{' '}
                            <Link
                                to='/login'
                                className='font-black hover:underline text-primary'
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
