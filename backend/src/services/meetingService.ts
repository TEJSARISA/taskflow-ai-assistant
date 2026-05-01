import prisma from '../client.ts';
import ApiError from '../utils/ApiError.ts';
import { logActivity } from './activityLogService.ts';

export const meetingService = {
  getMeetings: async (userId: string, projectId?: string) => {
    const where: any = { isDeleted: false };
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      // Return meetings for projects the user belongs to or created
      where.project = {
        OR: [
          { createdBy: userId },
          { teamMembers: { has: userId } }
        ]
      };
    }

    return prisma.meeting.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        project: { select: { name: true } }
      }
    });
  },

  getMeetingById: async (id: string, userId: string) => {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        isDeleted: false,
        project: {
          OR: [
            { createdBy: userId },
            { teamMembers: { has: userId } }
          ]
        }
      },
      include: {
        project: true
      }
    });

    if (!meeting) {
      throw new ApiError(404, 'Meeting not found');
    }

    return meeting;
  },

  createMeeting: async (data: { title: string; date: string; transcript?: string; summary?: string; tasks?: any; projectId?: string }, userId?: string) => {
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        transcript: data.transcript,
        summary: data.summary,
        tasks: data.tasks,
        projectId: data.projectId
      }
    });

    if (userId) {
      await logActivity(userId, 'MEETING_CREATED', { meetingId: meeting.id, title: meeting.title, projectId: meeting.projectId });
    }

    return meeting;
  },

  updateMeeting: async (id: string, data: any, userId?: string) => {
    const meeting = await prisma.meeting.findFirst({
      where: { id, isDeleted: false }
    });

    if (!meeting) {
      throw new ApiError(404, 'Meeting not found');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.date) updateData.date = new Date(data.date);
    if (data.transcript !== undefined) updateData.transcript = data.transcript;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.tasks !== undefined) updateData.tasks = data.tasks;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: updateData
    });

    if (userId) {
      await logActivity(userId, 'MEETING_UPDATED', { meetingId: id, title: updatedMeeting.title, updates: data });
    }

    return updatedMeeting;
  },

  deleteMeeting: async (id: string, userId?: string) => {
    const meeting = await prisma.meeting.update({
      where: { id },
      data: { isDeleted: true }
    });

    if (userId) {
      await logActivity(userId, 'MEETING_DELETED', { meetingId: id, title: meeting.title });
    }

    return meeting;
  }
};
