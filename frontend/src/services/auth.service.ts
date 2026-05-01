import { api } from '@/lib/api';
import { User } from '../types';

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

const isMockMode = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const allowGoogleMockFallback = import.meta.env.VITE_GOOGLE_AUTH_MOCK_FALLBACK !== 'false';

const isLocalHostUrl = (url: string) => {
    try {
        const parsed = new URL(url, window.location.origin);
        const host = parsed.hostname.toLowerCase();
        return host === 'localhost' || host === '127.0.0.1';
    } catch {
        return false;
    }
};

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        if (isMockMode) {
            const { mockUsers } = await import('../data/mockData');
            const user = mockUsers.find(u => u.email === email);
            // For demo purposes in mock mode, we allow successful login for any demo email
            if (user) {
                return {
                    user,
                    accessToken: 'mock-jwt-token',
                    refreshToken: 'mock-refresh-token'
                };
            }
            throw new Error('Invalid credentials');
        }

        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (userData: any): Promise<AuthResponse> => {
        if (isMockMode) {
            const avatarStyle = 'initials';
            const seed = userData.name || userData.email;
            const newUser: User = {
                id: `u${Date.now()}`,
                name: userData.name,
                email: userData.email,
                role: 'Member',
                avatar: `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${seed}`
            };
            return {
                user: newUser,
                accessToken: 'mock-jwt-token',
                refreshToken: 'mock-refresh-token'
            };
        }

        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    getCurrentUser: async (): Promise<User | null> => {
        const userStr = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');

        // If no user string and no access token, definitely not logged in
        if (!userStr && !accessToken) return null;

        try {
            if (isMockMode) {
                // Allow Google OAuth to work in mock mode when backend tokens exist but user cache is empty.
                if (!userStr && accessToken) {
                    try {
                        const response = await api.get('/auth/me');
                        const user = response.data.user;
                        if (user) {
                            localStorage.setItem('user', JSON.stringify(user));
                            return user;
                        }
                    } catch {
                        return null;
                    }
                }
                if (!userStr) return null;
                try {
                    return JSON.parse(userStr);
                } catch {
                    localStorage.removeItem('user');
                    return null;
                }
            }
            // Even if userStr is missing, if we have a token, we should try to fetch the latest user info
            const response = await api.get('/auth/me');
            const user = response.data.user;

            // Sync localStorage with latest user data
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }
            return user;
        } catch (error) {
            // If unauthorized, clear everything
            if ((error as any).response?.status === 401) {
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
            return null;
        }
    },

    refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
        const response = await api.post('/auth/refresh', { refreshToken });
        return response.data;
    },

    googleLogin: () => {
        const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
        const hasValidRemoteBackend = !!baseUrl && !isLocalHostUrl(baseUrl);

        // Use local demo fallback only when explicitly allowed and no usable backend URL is available.
        if (!import.meta.env.DEV && isMockMode && allowGoogleMockFallback && !hasValidRemoteBackend) {
            const demoUser: User = {
                id: 'u-google-demo',
                name: 'Google Demo User',
                email: 'google.demo@taskflow.ai',
                role: 'Manager',
                avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Google%20Demo%20User'
            };
            localStorage.setItem('user', JSON.stringify(demoUser));
            localStorage.setItem('accessToken', 'mock-jwt-token');
            localStorage.setItem('refreshToken', 'mock-refresh-token');
            window.location.href = '/';
            return;
        }

        if (!baseUrl) {
            throw new Error('Google OAuth is not configured: VITE_API_BASE_URL is missing');
        }

        if (!import.meta.env.DEV && isLocalHostUrl(baseUrl)) {
            throw new Error(
                'Google OAuth backend URL is set to localhost. Set VITE_API_BASE_URL to your public backend URL.'
            );
        }

        const loginUrl = `${String(baseUrl).replace(/\/$/, '')}/auth/google`;
        if (import.meta.env.DEV) {
            window.open(loginUrl, '_blank', 'width=500,height=650');
        } else {
            window.location.href = loginUrl;
        }
    },

    completeGoogleLogin: async (code: string, state?: string): Promise<AuthResponse> => {
        const response = await api.post('/auth/google/exchange', { code, state });
        return response.data;
    },

    forgotPassword: async (email: string) => {
        if (isMockMode) {
            return { message: 'Reset link sent to your email.' };
        }
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (password: string, token: string) => {
        if (isMockMode) {
            return { message: 'Password reset successful.' };
        }
        const response = await api.post('/auth/reset-password', { password, token });
        return response.data;
    }
};
