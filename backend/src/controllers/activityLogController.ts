import { Context } from 'hono';
import * as activityLogService from '../services/activityLogService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const getActivityLogs = catchAsync(async (c: Context) => {
  const projectId = c.req.query('projectId');
  const taskId = c.req.query('taskId');
  
  const logs = await activityLogService.getActivityLogs(projectId, taskId);
  return c.json(logs);
});
