import { Context } from 'hono';
import { taskService } from '../services/taskService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const taskController = {
  getTasks: catchAsync(async (c: Context) => {
    const userId = c.get('userId');
    const projectId = c.req.query('projectId');
    const tasks = await taskService.getTasks(userId, projectId);
    return c.json(tasks);
  }),

  getTaskById: catchAsync(async (c: Context) => {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const task = await taskService.getTaskById(id, userId);
    return c.json(task);
  }),

  createTask: catchAsync(async (c: Context) => {
    const body = await c.req.json();
    const task = await taskService.createTask(body);
    return c.json(task, 201);
  }),

  updateTask: catchAsync(async (c: Context) => {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const body = await c.req.json();
    const task = await taskService.updateTask(id, userId, body);
    return c.json(task);
  }),

  deleteTask: catchAsync(async (c: Context) => {
    const id = c.req.param('id');
    const userId = c.get('userId');
    await taskService.deleteTask(id, userId);
    return c.json({ message: 'Task deleted successfully' });
  }),

  getComments: catchAsync(async (c: Context) => {
    const taskId = c.req.param('taskId');
    const comments = await taskService.getComments(taskId);
    return c.json(comments);
  }),

  addComment: catchAsync(async (c: Context) => {
    const taskId = c.req.param('taskId');
    const userId = c.get('userId');
    const { text } = await c.req.json();
    const comment = await taskService.addComment(taskId, userId, text);
    return c.json(comment, 201);
  }),

  addTaskDependency: catchAsync(async (c: Context) => {
    const taskId = c.req.param('id');
    const body = await c.req.json();
    const { dependsOnTaskId } = body;
    const dependency = await taskService.addTaskDependency(taskId, dependsOnTaskId);
    return c.json(dependency, 201);
  }),

  getTaskDependencies: catchAsync(async (c: Context) => {
    const taskId = c.req.param('id');
    const dependencies = await taskService.getTaskDependencies(taskId);
    return c.json(dependencies);
  }),

  removeTaskDependency: catchAsync(async (c: Context) => {
    const depId = c.req.param('depId');
    await taskService.removeTaskDependency(depId);
    return c.json({ message: 'Dependency removed successfully' });
  })
};