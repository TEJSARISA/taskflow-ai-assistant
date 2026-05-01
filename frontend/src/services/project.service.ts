import { api } from '@/lib/api';
import { Project } from '../types';
import { mockProjects } from '../data/mockData';

export const projectService = {
    getProjects: async (): Promise<Project[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return mockProjects;
        }
        const response = await api.get('/projects');
        return response.data;
    },

    getProjectById: async (id: string): Promise<Project> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const project = mockProjects.find(p => p.id === id);
            if (!project) throw new Error('Project not found');
            return project;
        }
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },

    createProject: async (projectData: Partial<Project>): Promise<Project> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const newProject = {
                ...projectData,
                id: `p${mockProjects.length + 1}`,
                createdAt: new Date().toISOString(),
                teamMembers: projectData.teamMembers || []
            } as Project;
            mockProjects.push(newProject);
            return newProject;
        }
        const response = await api.post('/projects', projectData);
        return response.data;
    },

    updateProject: async (id: string, updates: Partial<Project>): Promise<Project> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const index = mockProjects.findIndex(p => p.id === id);
            if (index === -1) throw new Error('Project not found');
            mockProjects[index] = { ...mockProjects[index], ...updates };
            return mockProjects[index];
        }
        const response = await api.patch(`/projects/${id}`, updates);
        return response.data;
    },

    deleteProject: async (id: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const index = mockProjects.findIndex(p => p.id === id);
            if (index !== -1) mockProjects.splice(index, 1);
            return;
        }
        await api.delete(`/projects/${id}`);
    },

    getProjectAnalytics: async (id: string): Promise<any> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return {
                totalTasks: 10,
                completedTasks: 4,
                inProgressTasks: 3,
                pendingTasks: 3,
                completionRate: 40,
                priorityDistribution: { High: 3, Medium: 4, Low: 3 },
                totalEstimatedTime: 600,
                totalActualTime: 240
            };
        }
        const response = await api.get(`/projects/${id}/analytics`);
        return response.data;
    }
};
