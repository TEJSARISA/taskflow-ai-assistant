import { api } from '@/lib/api';

export const activityLogService = {
    getActivityLogs: async (projectId?: string, taskId?: string): Promise<any[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return [
                {
                    id: '1',
                    userId: 'u1',
                    action: 'PROJECT_CREATED',
                    details: { title: 'Website Redesign' },
                    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
                    user: { name: 'Alex Johnson' }
                },
                {
                    id: '2',
                    userId: 'u2',
                    action: 'PROJECT_CREATED',
                    details: { title: 'Mobile App Launch' },
                    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
                    user: { name: 'David Chen' }
                },
                {
                    id: '3',
                    userId: 'u1',
                    action: 'TASK_CREATED',
                    details: { title: 'Design UI Mockups', projectName: 'Website Redesign' },
                    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
                    user: { name: 'Alex Johnson' }
                },
                {
                    id: '4',
                    userId: 'u2',
                    action: 'TASK_UPDATED',
                    details: { title: 'Design UI Mockups', status: 'In Progress' },
                    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                    user: { name: 'David Chen' }
                },
                {
                    id: '5',
                    userId: 'u1',
                    action: 'PROJECT_CREATED',
                    details: { title: 'Cloud Infrastructure Migration' },
                    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                    user: { name: 'Alex Johnson' }
                },
                {
                    id: '6',
                    userId: 'u3',
                    action: 'TASK_COMPLETED',
                    details: { title: 'Beta Testing' },
                    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
                    user: { name: 'Michael Ross' }
                },
                {
                    id: '7',
                    userId: 'u4',
                    action: 'COMMENT_ADDED',
                    details: { title: 'API Security Audit' },
                    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                    user: { name: 'Taylor Swift' }
                },
                {
                    id: '8',
                    userId: 'u6',
                    action: 'TASK_ASSIGNED',
                    details: { title: 'Marketing Strategy' },
                    createdAt: new Date(Date.now() - 600000).toISOString(),
                    user: { name: 'Admin User' }
                }
            ];
        }
        const response = await api.get('/activity-logs', {
            params: { projectId, taskId }
        });
        return response.data;
    }
};
