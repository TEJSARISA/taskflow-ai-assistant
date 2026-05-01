import prisma from '../client.ts';
import ApiError from '../utils/ApiError.ts';
import { sendEmail } from './emailService.ts';
import { getUserById } from './userService.ts';
import { logActivity } from './activityLogService.ts';

/**
 * Helper function to send task-related email notifications
 */
async function sendTaskNotification(userId: string, taskTitle: string, action: string, details?: string) {
  try {
    const user = await getUserById(userId);
    if (!user || !user.email) {
      console.warn(`[TaskNotification] No valid email found for user ${userId}, skipping notification.`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:5173';
    
    let subject = '';
    let message = '';
    const userName = user.name || user.email.split('@')[0];

    if (action === 'ASSIGNED' || action === 'CREATED') {
      subject = 'New Task Assigned';
      message = `Hello ${userName}, you have been assigned a new task: ${taskTitle}. Please check the dashboard for details.`;
    } else if (action === 'STATUS_UPDATED') {
      subject = 'Task Status Updated';
      message = `Hello ${userName}, the status of your task "${taskTitle}" has been updated to: ${details}. Please check the dashboard for details.`;
    }

    if (subject && message) {
      await sendEmail({
        to: [user.email],
        subject,
        text: message,
        html: `
          <div style="font-family: sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #E5E5E5; border-radius: 12px; background-color: #FFFFFF;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #171717; margin: 0; font-size: 24px;">TaskFlow AI</h1>
            </div>
            <hr style="border: 0; border-top: 1px solid #E5E5E5; margin-bottom: 25px;" />
            <h2 style="color: #007bff; margin-top: 0;">${subject}</h2>
            <p style="font-size: 16px; line-height: 1.5;">Hello <strong>${userName}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5;">${message}</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${frontendUrl}/tasks" 
                 style="display: inline-block; padding: 14px 30px; background-color: #171717; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                View Task on Dashboard
              </a>
            </div>
          </div>
        `
      });
    }
  } catch (error) {
    console.error('[TaskNotification] Error during task notification process:', error);
  }
}

export const taskService = {
  getTasks: async (userId: string, projectId?: string) => {
    const where: any = { isDeleted: false };
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      where.OR = [
        { assignedTo: userId },
        { project: { OR: [{ createdBy: userId }, { teamMembers: { has: userId } }] } }
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        dependencies: { where: { isDeleted: false }, include: { dependsOnTask: true } }
      },
      orderBy: { position: 'asc' }
    });
  },

  getTaskById: async (id: string, userId: string) => {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false },
      include: {
        project: true,
        assignee: true,
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        dependencies: { where: { isDeleted: false }, include: { dependsOnTask: true } },
        fileVersions: { where: { isDeleted: false } }
      }
    });

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    return task;
  },

  createTask: async (data: any) => {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assignedTo: data.assignedTo,
        priority: data.priority || 'Medium',
        status: data.status || 'To Do',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedTime: data.estimatedTime || 0,
        position: data.position || 0
      }
    });

    await logActivity(data.createdBy, 'TASK_CREATED', { taskId: task.id, title: task.title, projectId: task.projectId });

    if (task.assignedTo) {
      sendTaskNotification(task.assignedTo, task.title, 'CREATED');
    }

    return task;
  },

  updateTask: async (id: string, userId: string, data: any) => {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false }
    });

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime;

    if (data.status === 'Done') {
      const deps = await prisma.taskDependency.findMany({
        where: { taskId: id, isDeleted: false },
        include: { dependsOnTask: true }
      });
      
      const incompleteDeps = deps.filter(d => d.dependsOnTask.status !== 'Done');
      if (incompleteDeps.length > 0) {
        throw new ApiError(400, `Cannot mark task as Done. Dependencies incomplete: ${incompleteDeps.map(d => d.dependsOnTask.title).join(', ')}`);
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData
    });

    await logActivity(userId, 'TASK_UPDATED', { taskId: id, title: updatedTask.title, updates: data });

    if (data.assignedTo && data.assignedTo !== task.assignedTo) {
      sendTaskNotification(updatedTask.assignedTo!, updatedTask.title, 'ASSIGNED');
    } else if (data.status && data.status !== task.status && updatedTask.assignedTo) {
      sendTaskNotification(updatedTask.assignedTo, updatedTask.title, 'STATUS_UPDATED', data.status);
    }

    return updatedTask;
  },

  deleteTask: async (id: string, userId: string) => {
    const task = await prisma.task.update({
      where: { id },
      data: { isDeleted: true },
    });
    await logActivity(userId, 'TASK_DELETED', { taskId: id, title: task.title });
    return task;
  },

  addTaskDependency: async (taskId: string, dependsOnTaskId: string) => {
    return prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
    });
  },

  getTaskDependencies: async (taskId: string) => {
    return prisma.taskDependency.findMany({
      where: { taskId, isDeleted: false },
      include: { dependsOnTask: true },
    });
  },

  removeTaskDependency: async (id: string) => {
    return prisma.taskDependency.update({
      where: { id },
      data: { isDeleted: true },
    });
  },

  getComments: async (taskId: string) => {
    return prisma.comment.findMany({
      where: { taskId, isDeleted: false },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    });
  },

  addComment: async (taskId: string, userId: string, text: string) => {
    const comment = await prisma.comment.create({
      data: { taskId, userId, text },
      include: { user: { select: { name: true, email: true } } }
    });
    await logActivity(userId, 'COMMENT_ADDED', { taskId, commentId: comment.id });
    return comment;
  }
};
