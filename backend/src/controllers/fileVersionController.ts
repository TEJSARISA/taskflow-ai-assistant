import { Context } from 'hono';
import * as fileVersionService from '../services/fileVersionService.ts';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';

export const uploadFileVersion = catchAsync(async (c: Context) => {
  const taskId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { fileName, fileUrl } = body;

  if (!fileName || !fileUrl) {
    throw new ApiError(400, 'File name and URL are required');
  }

  const version = await fileVersionService.uploadFileVersion(taskId, fileName, fileUrl, userId);
  return c.json(version, 201);
});

export const getFileVersions = catchAsync(async (c: Context) => {
  const taskId = c.req.param('id');
  const versions = await fileVersionService.getFileVersions(taskId);
  return c.json(versions);
});
