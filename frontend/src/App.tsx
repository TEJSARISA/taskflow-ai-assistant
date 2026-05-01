import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Kanban from './pages/Kanban';
import Meetings from './pages/Meetings';
import AIAssistant from './pages/AIAssistant';
import Team from './pages/Team';
import Calendar from './pages/Calendar';
import Gantt from './pages/Gantt';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import ActivityLog from './pages/ActivityLog';
import Notifications from './pages/Notifications';
import StickyTabsDemoPage from './pages/StickyTabsDemo';
import TextRevealDemo from './pages/TextRevealDemo';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/AuthCallback';
import { UIProvider } from './context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ui/ErrorBoundary';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const isThemePreference = (value: string | null): value is ThemePreference => {
    return value === 'light' || value === 'dark' || value === 'system';
};

const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const ProtectedRoute = ({
    children,
    theme,
    toggleTheme
}: {
    children: React.ReactNode;
    theme: ResolvedTheme;
    toggleTheme: () => void;
}) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className='min-h-screen bg-background text-foreground flex items-center justify-center'>
                <div className='text-center'>
                    <p className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
                        Initializing Workspace...
                    </p>
                </div>
            </div>
        );
    }
    if (!user) return <Navigate to='/login' />;

    return (
        <div
            className={`flex h-screen bg-background text-foreground overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}
        >
            <Sidebar />
            <div className='flex-1 flex flex-col min-w-0 h-full relative'>
                <Topbar
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
                <main className='flex-1 overflow-y-auto custom-scrollbar'>
                    <div className='p-4 md:p-8'>
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={window.location.pathname}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

const App = () => {
    const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
        const storedPreference = localStorage.getItem('themePreference');
        if (isThemePreference(storedPreference)) return storedPreference;

        const legacyTheme = localStorage.getItem('theme');
        if (isThemePreference(legacyTheme)) return legacyTheme;

        return 'dark';
    });
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
        const initial = localStorage.getItem('themePreference') || localStorage.getItem('theme');
        if (initial === 'system') return getSystemTheme();
        return initial === 'light' ? 'light' : 'dark';
    });

    useEffect(() => {
        if (themePreference === 'system') {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            const apply = () => {
                setResolvedTheme(media.matches ? 'dark' : 'light');
            };
            apply();
            media.addEventListener('change', apply);
            return () => media.removeEventListener('change', apply);
        }

        setResolvedTheme(themePreference);
    }, [themePreference]);

    useEffect(() => {
        localStorage.setItem('themePreference', themePreference);
        localStorage.setItem('theme', themePreference);
        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    }, [themePreference, resolvedTheme]);

    const toggleTheme = () => {
        setThemePreference(prev => {
            const current = prev === 'system' ? getSystemTheme() : prev;
            return current === 'dark' ? 'light' : 'dark';
        });
    };

    return (
        <AuthProvider>
            <UIProvider>
                <ErrorBoundary>
                    <Router>
                        <Routes>
                            <Route
                                path='/login'
                                element={<Login theme={resolvedTheme} />}
                            />
                            <Route
                                path='/register'
                                element={<Signup theme={resolvedTheme} />}
                            />
                            <Route
                                path='/forgot-password'
                                element={<ForgotPassword theme={resolvedTheme} />}
                            />
                            <Route
                                path='/reset-password'
                                element={<ResetPassword theme={resolvedTheme} />}
                            />
                            <Route
                                path='/auth/callback'
                                element={<AuthCallback />}
                            />
                            <Route
                                path='/sticky-tabs'
                                element={<StickyTabsDemoPage />}
                            />
                            <Route
                                path='/text-reveal'
                                element={<TextRevealDemo />}
                            />
                            <Route
                                path='/'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Dashboard theme={resolvedTheme} />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/projects'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Projects />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/projects/:id'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <ProjectDetail />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/tasks'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Kanban />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/meetings'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Meetings />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/gantt'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Gantt />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/team'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Team />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/calendar'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Calendar />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/analytics'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Analytics />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/activity'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <ActivityLog />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/notifications'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Notifications />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/settings'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <Settings
                                            themePreference={themePreference}
                                            onThemePreferenceChange={setThemePreference}
                                        />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path='/ai'
                                element={
                                    <ProtectedRoute
                                        theme={resolvedTheme}
                                        toggleTheme={toggleTheme}
                                    >
                                        <AIAssistant />
                                    </ProtectedRoute>
                                }
                            />
                            {/* Fallback */}
                            <Route
                                path='*'
                                element={<Navigate to='/' />}
                            />
                        </Routes>
                    </Router>
                </ErrorBoundary>
            </UIProvider>
        </AuthProvider>
    );
};

export default App;
