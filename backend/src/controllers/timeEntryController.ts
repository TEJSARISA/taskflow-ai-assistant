import { Context } from 'hono';
import * as timeEntryService from '../services/timeEntryService.ts';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';

export const startTimer = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { taskId, description } = body;

  if (!taskId) {
    throw new ApiError(400, 'Task ID is required');
  }

  const entry = await timeEntryService.startTimer(userId, taskId, description);
  return c.json(entry, 201);
});

export const stopTimer = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const entry = await timeEntryService.stopTimer(userId);
  return c.json(entry);
});

export const getActiveTimer = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const timer = await timeEntryService.getActiveTimer(userId);
  return c.json(timer || null);
});

export const getTimeEntries = catchAsync(async (c: Context) => {
  const taskId = c.req.query('taskId');
  const userId = c.req.query('userId');
  
  const entries = await timeEntryService.getTimeEntries(taskId, userId);
  return c.json(entries);
});
