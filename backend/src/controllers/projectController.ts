import { Context } from 'hono';
import { projectService } from '../services/projectService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const projectController = {
  getProjects: catchAsync(async (c: Context) => {
    const userId = c.get('userId');
    const projects = await projectService.getProjects(userId);
    return c.json(projects);
  }),

  getProjectById: catchAsync(async (c: Context) => {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const project = await projectService.getProjectById(id, userId);
    return c.json(project);
  }),

  createProject: catchAsync(async (c: Context) => {
    const userId = c.get('userId');
    const body = await c.req.json();
    const project = await projectService.createProject({ ...body, createdBy: userId });
    return c.json(project, 201);
  }),

  updateProject: catchAsync(async (c: Context) => {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const body = await c.req.json();
    const project = await projectService.updateProject(id, userId, body);
    return c.json(project);
  }),

  deleteProject: catchAsync(async (c: Context) => {
    const id = c.req.param('id');
    const userId = c.get('userId');
    await projectService.deleteProject(id, userId);
    return c.json({ message: 'Project deleted successfully' });
  }),

  getProjectAnalytics: catchAsync(async (c: Context) => {
    const id = c.req.param('id');
    const analytics = await projectService.getProjectAnalytics(id);
    return c.json(analytics);
  })
};