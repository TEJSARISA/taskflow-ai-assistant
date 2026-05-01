import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ theme }: { theme?: string }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const oauthHandledRef = React.useRef(false);

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state') || undefined;
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        if (errorParam && !code) {
            const formattedError = errorDescription ? `${errorParam}: ${errorDescription}` : errorParam;
            setError(formattedError);
            return;
        }

        if (!code || oauthHandledRef.current) return;
        oauthHandledRef.current = true;

        setLoading(true);
        setError('');

        (async () => {
            try {
                const { user, accessToken, refreshToken } = await authService.completeGoogleLogin(code, state);
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = '/';
            } catch (err: any) {
                console.error('Google login completion error:', err);
                setError(err?.response?.data?.message || err?.message || 'Google login failed. Please try again.');
                setLoading(false);
            }
        })();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.response?.status === 401) {
                setError('Incorrect email or password. Please try again.');
            } else if (err.response?.status === 400) {
                setError(err.response?.data?.message || 'Please check your login details.');
            } else if (err.message === 'Invalid credentials') {
                setError('Invalid credentials. Please check your email and password.');
            } else {
                setError('Unable to connect to the server. Please check your internet and try again.');
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
                    <h1 className='text-4xl font-black mb-2 tracking-tight'>Welcome Back</h1>
                    <p className='text-muted-foreground text-sm font-medium'>Log in to your workspace to continue.</p>
                </div>

                <div className='bg-card border border-border p-8 rounded-3xl shadow-2xl relative overflow-hidden'>
                    <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-30'></div>

                    <form
                        onSubmit={handleSubmit}
                        className='space-y-6'
                    >
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
                            <div className='flex items-center justify-between ml-1'>
                                <label className='text-[11px] uppercase tracking-widest font-black text-muted-foreground'>
                                    Password
                                </label>
                                <Link
                                    to='/forgot-password'
                                    className='text-[10px] uppercase tracking-widest font-black text-primary hover:opacity-80 transition-colors'
                                >
                                    Forgot password?
                                </Link>
                            </div>
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
                                        Authenticating...
                                    </span>
                                </div>
                            ) : (
                                <div className='flex items-center justify-center gap-2'>
                                    <span className='font-black uppercase tracking-widest text-xs'>Sign In</span>
                                    <ArrowRight
                                        size={18}
                                        className='group-hover:translate-x-1 transition-transform'
                                    />
                                </div>
                            )}
                        </button>
                    </form>

                    <div className='mt-8 space-y-4'>
                        <button
                            type='button'
                            onClick={() => {
                                setError('');
                                try {
                                    googleLogin();
                                } catch (err: any) {
                                    setError(err?.message || 'Google sign-in is not configured');
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

                        <div className='flex items-center gap-2'>
                            <div className='h-px bg-border flex-1'></div>
                            <span className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                                Quick Login
                            </span>
                            <div className='h-px bg-border flex-1'></div>
                        </div>
                        <div className='grid grid-cols-3 gap-2'>
                            {[
                                { label: 'Admin', email: 'alex@taskflow.ai', pass: 'demo123' },
                                { label: 'Manager', email: 'david@taskflow.ai', pass: 'demo123' },
                                { label: 'Member', email: 'michael@taskflow.ai', pass: 'demo123' }
                            ].map(demo => (
                                <button
                                    key={demo.label}
                                    type='button'
                                    onClick={() => {
                                        setEmail(demo.email);
                                        setPassword(demo.pass);
                                    }}
                                    className='py-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-all text-[10px] font-bold text-foreground hover:border-primary/50'
                                >
                                    {demo.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='mt-8 pt-8 border-t border-border text-center'>
                        <p className='text-muted-foreground text-sm font-medium'>
                            New to TaskFlow?{' '}
                            <Link
                                to='/register'
                                className='font-black hover:underline text-primary'
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>

                <p className='text-center mt-8 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-30'>
                    Enterprise Security Standard • v2.4.0
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
