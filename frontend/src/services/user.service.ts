import { api } from '@/lib/api';
import { mockUsers } from '../data/mockData';

export const userService = {
    getAllUsers: async () => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return mockUsers;
        }
        const response = await api.get('/users');
        return response.data;
    },
    inviteUser: async (email: string, name?: string, projectId?: string) => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const newUser = {
                id: `u${mockUsers.length + 1}`,
                name: name || email.split('@')[0],
                email,
                role: 'Member' as const,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name || email}`,
                createdAt: new Date().toISOString()
            };
            mockUsers.push(newUser);
            return newUser;
        }
        const response = await api.post('/users/invite', { email, name, projectId });
        return response.data;
    },
    getTeamStats: async () => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return mockUsers.map((u, i) => ({
                userId: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                totalTasks: 10,
                completedTasks: 8,
                inProgressTasks: 2,
                workload: 40 + i * 15,
                productivityScore: 85 + i * 2
            }));
        }
        const response = await api.get('/users/stats');
        return response.data;
    },
    deleteUser: async (id: string) => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const index = mockUsers.findIndex(u => u.id === id);
            if (index !== -1) {
                mockUsers.splice(index, 1);
            }
            return { success: true };
        }
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    sendMessage: async (userId: string, message: string) => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log(`Mock message to ${userId}: ${message}`);
            return { success: true };
        }
        const response = await api.post(`/users/${userId}/message`, { message });
        return response.data;
    }
};
