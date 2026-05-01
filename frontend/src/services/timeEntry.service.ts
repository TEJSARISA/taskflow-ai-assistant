import { api } from '@/lib/api';

export const timeEntryService = {
    getTimeEntries: async (taskId?: string, userId?: string): Promise<any[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return [];
        }
        const response = await api.get('/time-entries', {
            params: { taskId, userId }
        });
        return response.data;
    },

    startTimer: async (taskId: string, description?: string): Promise<any> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return { id: 'timer1', taskId, startTime: new Date().toISOString() };
        }
        const response = await api.post('/time-entries/start', { taskId, description });
        return response.data;
    },

    stopTimer: async (): Promise<any> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return { id: 'timer1', endTime: new Date().toISOString(), duration: 3600 };
        }
        const response = await api.post('/time-entries/stop');
        return response.data;
    },

    getActiveTimer: async (): Promise<any> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return null;
        }
        const response = await api.get('/time-entries/active');
        return response.data;
    }
};
