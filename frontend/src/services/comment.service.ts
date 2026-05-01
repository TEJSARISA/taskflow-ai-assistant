import { Comment } from '../types';
import { mockComments } from '../data/mockData';
import { api } from '@/lib/api';

let localComments: Comment[] = [...mockComments];

export const commentService = {
    getTaskComments: async (taskId: string): Promise<Comment[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return localComments
                .filter(c => c.taskId === taskId)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
        const res = await api.get(`/tasks/${taskId}/comments`);
        return res.data;
    },

    addComment: async (taskId: string, userId: string, text: string): Promise<Comment> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const newComment: Comment = {
                id: `c${Date.now()}`,
                taskId,
                userId,
                text,
                timestamp: new Date().toISOString()
            };
            localComments.push(newComment);
            return newComment;
        }
        const res = await api.post(`/tasks/${taskId}/comments`, { text });
        return res.data;
    },

    deleteComment: async (id: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            localComments = localComments.filter(c => c.id !== id);
            return;
        }
        await api.delete(`/comments/${id}`);
    }
};
