import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface UIContextType {
    showToast: (message: string, type?: ToastType) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return (
                    <CheckCircle
                        className='text-emerald-500'
                        size={20}
                    />
                );
            case 'error':
                return (
                    <AlertCircle
                        className='text-rose-500'
                        size={20}
                    />
                );
            case 'info':
                return (
                    <Info
                        className='text-primary'
                        size={20}
                    />
                );
        }
    };

    return (
        <UIContext.Provider value={{ showToast, isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
            {children}
            <div className='fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none'>
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className='pointer-events-auto bg-card border border-border p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] max-w-md'
                        >
                            <div
                                className={`p-2 rounded-xl ${
                                    toast.type === 'success'
                                        ? 'bg-emerald-500/10'
                                        : toast.type === 'error'
                                          ? 'bg-rose-500/10'
                                          : 'bg-primary/10'
                                }`}
                            >
                                {getIcon(toast.type)}
                            </div>
                            <div className='flex-1'>
                                <p className='text-sm font-bold text-foreground'>{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className='p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground'
                            >
                                <X size={16} />
                            </button>
                            <motion.div
                                initial={{ width: '100%' }}
                                animate={{ width: 0 }}
                                transition={{ duration: 5, ease: 'linear' }}
                                className={`absolute bottom-0 left-0 h-1 ${
                                    toast.type === 'success'
                                        ? 'bg-emerald-500'
                                        : toast.type === 'error'
                                          ? 'bg-rose-500'
                                          : 'bg-primary'
                                }`}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </UIContext.Provider>
    );
};
