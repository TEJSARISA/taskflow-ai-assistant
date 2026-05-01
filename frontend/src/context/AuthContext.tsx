import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    googleLogin: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === 'AUTH_SUCCESS') {
                const { accessToken, refreshToken } = event.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                // Fetch user data after successful login
                const savedUser = await authService.getCurrentUser();
                if (savedUser) {
                    setUser(savedUser);
                    localStorage.setItem('user', JSON.stringify(savedUser));
                }
                window.location.reload();
            } else if (event.data?.type === 'AUTH_ERROR') {
                const message = event.data?.message || 'Google authentication failed';
                window.location.href = `/login?error=${encodeURIComponent(message)}`;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const savedUser = await authService.getCurrentUser();
                if (savedUser) {
                    setUser(savedUser);
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const { user, accessToken, refreshToken } = await authService.login(email, password);
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    };

    const register = async (userData: any) => {
        const { user, accessToken, refreshToken } = await authService.register(userData);
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    };

    const googleLogin = () => {
        authService.googleLogin();
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
