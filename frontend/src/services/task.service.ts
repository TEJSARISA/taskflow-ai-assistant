import { api } from '@/lib/api';
import { Task, Comment } from '../types';
import { mockTasks, mockComments } from '../data/mockData';

export const taskService = {
    getTasks: async (projectId?: string): Promise<Task[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return projectId ? mockTasks.filter(t => t.projectId === projectId) : mockTasks;
        }
        const response = await api.get('/tasks', {
            params: { projectId }
        });
        return response.data;
    },

    getTaskById: async (id: string): Promise<Task> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const task = mockTasks.find(t => t.id === id);
            if (!task) throw new Error('Task not found');
            return task;
        }
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },

    createTask: async (taskData: Partial<Task>): Promise<Task> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const newTask = {
                ...taskData,
                id: `t${mockTasks.length + 1}`,
                createdAt: new Date().toISOString()
            } as Task;
            mockTasks.push(newTask);
            return newTask;
        }
        const response = await api.post('/tasks', taskData);
        return response.data;
    },

    updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const taskIndex = mockTasks.findIndex(t => t.id === id);
            if (taskIndex === -1) throw new Error('Task not found');
            mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates };
            return mockTasks[taskIndex];
        }
        const response = await api.patch(`/tasks/${id}`, updates);
        return response.data;
    },

    deleteTask: async (id: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const taskIndex = mockTasks.findIndex(t => t.id === id);
            if (taskIndex !== -1) mockTasks.splice(taskIndex, 1);
            return;
        }
        await api.delete(`/tasks/${id}`);
    },

    getComments: async (taskId: string): Promise<Comment[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return mockComments.filter(c => c.taskId === taskId);
        }
        const response = await api.get(`/tasks/${taskId}/comments`);
        return response.data;
    },

    addComment: async (taskId: string, text: string): Promise<Comment> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const newComment = {
                id: `c${mockComments.length + 1}`,
                taskId,
                userId: 'u1', // Default mock user
                text,
                timestamp: new Date().toISOString()
            };
            mockComments.push(newComment);
            return newComment;
        }
        const response = await api.post(`/tasks/${taskId}/comments`, { text });
        return response.data;
    },

    addTaskDependency: async (taskId: string, dependsOnTaskId: string): Promise<any> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return { id: Math.random().toString(), taskId, dependsOnTaskId };
        }
        const response = await api.post(`/tasks/${taskId}/dependencies`, { dependsOnTaskId });
        return response.data;
    },

    getTaskDependencies: async (taskId: string): Promise<any[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return [];
        }
        const response = await api.get(`/tasks/${taskId}/dependencies`);
        return response.data;
    },

    removeTaskDependency: async (taskId: string, depId: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return;
        }
        await api.delete(`/tasks/${taskId}/dependencies/${depId}`);
    },

    getFileVersions: async (taskId: string): Promise<any[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return [];
        }
        const response = await api.get(`/tasks/${taskId}/files`);
        return response.data;
    },

    uploadFileVersion: async (taskId: string, fileName: string, fileUrl: string): Promise<any> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return {
                id: Math.random().toString(),
                taskId,
                fileName,
                fileUrl,
                versionNumber: 1,
                createdAt: new Date().toISOString()
            };
        }

        const response = await api.post(`/tasks/${taskId}/files`, { fileName, fileUrl });

        return response.data;
    },

    uploadFileToStorage: async (file: File): Promise<{ url: string; fileName: string }> => {
        const formData = new FormData();

        formData.append('file', file);

        const response = await api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    },

    downloadFile: async (key: string, fileName: string): Promise<void> => {
        const response = await api.post('/files/download', { key, fileName });

        window.open(response.data.url, '_blank');
    }
};
