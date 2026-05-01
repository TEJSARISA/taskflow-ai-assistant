import { api } from '@/lib/api';
import { Meeting } from '@/types';
import { mockMeetings } from '@/data/mockData';
import { aiService } from './ai.service';

export const meetingService = {
    getMeetings: async (): Promise<Meeting[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return mockMeetings;
        }
        const response = await api.get('/meetings');
        return response.data;
    },

    getMeetingById: async (id: string): Promise<Meeting> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            return mockMeetings.find(m => m.id === id) || mockMeetings[0];
        }
        const response = await api.get(`/meetings/${id}`);
        return response.data;
    },

    createMeeting: async (meeting: Omit<Meeting, 'id'>): Promise<Meeting> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            const newMeeting = { ...meeting, id: Math.random().toString(36).substr(2, 9) };
            mockMeetings.push(newMeeting);
            return newMeeting;
        }
        const response = await api.post('/meetings', meeting);
        return response.data;
    },

    extractTasksFromTranscript: async (transcript: string, uid: string = 'u1') => {
        return await aiService.extractTasksFromTranscript(transcript, uid);
    }
};
