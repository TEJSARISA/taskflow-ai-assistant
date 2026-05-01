import { Context } from 'hono';
import { meetingService } from '../services/meetingService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const meetingController = {
  getMeetings: catchAsync(async (c: Context) => {
    const userId = c.get('userId');
    const projectId = c.req.query('projectId');
    const meetings = await meetingService.getMeetings(userId, projectId);
    return c.json(meetings);
  }),

  getMeetingById: catchAsync(async (c: Context) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const meeting = await meetingService.getMeetingById(id, userId);
    return c.json(meeting);
  }),

  createMeeting: catchAsync(async (c: Context) => {
    const userId = c.get('userId');
    const data = await c.req.json();
    const meeting = await meetingService.createMeeting(data, userId);
    return c.json(meeting, 201);
  }),

  updateMeeting: catchAsync(async (c: Context) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const data = await c.req.json();
    const meeting = await meetingService.updateMeeting(id, data, userId);
    return c.json(meeting);
  }),

  deleteMeeting: catchAsync(async (c: Context) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    await meetingService.deleteMeeting(id, userId);
    return c.json({ message: 'Meeting deleted successfully' });
  })
};
