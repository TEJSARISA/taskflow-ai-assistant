import prisma from '../client.ts';
import ApiError from '../utils/ApiError.ts';
import { sendEmail } from './emailService.ts';
import { logActivity } from './activityLogService.ts';

export const projectService = {
  getProjects: async (userId: string) => {
    return prisma.project.findMany({
      where: {
        isDeleted: false,
        OR: [
          { createdBy: userId },
          { teamMembers: { has: userId } }
        ]
      },
      include: {
        _count: {
          select: { 
            tasks: { where: { isDeleted: false } },
          }
        },
        tasks: {
          where: { isDeleted: false, status: 'Done' },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  getProjectById: async (id: string, userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const project = await prisma.project.findFirst({
      where: {
        id,
        isDeleted: false,
        OR: user?.role === 'Admin' || user?.role === 'Manager' ? undefined : [
          { createdBy: userId },
          { teamMembers: { has: userId } }
        ]
      },
      include: {
        tasks: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    return project;
  },

  createProject: async (data: { name: string; description?: string; deadline?: string; createdBy: string; teamMembers?: string[] }) => {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline) : null,
        createdBy: data.createdBy,
        teamMembers: data.teamMembers || []
      }
    });

    await logActivity(data.createdBy, 'PROJECT_CREATED', { projectId: project.id, projectName: project.name });

    if (data.teamMembers && data.teamMembers.length > 0) {
      try {
        const creator = await prisma.user.findFirst({
          where: { id: data.createdBy, isDeleted: false }
        });

        const users = await prisma.user.findMany({
          where: { id: { in: data.teamMembers }, isDeleted: false }
        });

        const frontendUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:5173';
        const creatorName = creator?.name || 'a team member';
        
        for (const user of users) {
          if (user.email) {
            const projectUrl = `${frontendUrl}/projects/${project.id}`;
            try {
              await sendEmail({
                to: [user.email],
                subject: `Added to new project: ${project.name}`,
                text: `Hello ${user.name || 'there'},

You have been added to a new project "${project.name}" by ${creatorName}.

View Project: ${projectUrl}`,
                html: `<p>You have been added to a new project <strong>"${project.name}"</strong> by ${creatorName}.</p><a href="${projectUrl}">View Project</a>`,
              });
            } catch (err) {
              console.error(`Failed to send email to ${user.email}:`, err);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch users or send emails:', error);
      }
    }

    return project;
  },

  updateProject: async (id: string, userId: string, data: any) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const project = await prisma.project.findFirst({
      where: { id, isDeleted: false }
    });

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (project.createdBy !== userId && user?.role !== 'Admin' && user?.role !== 'Manager') {
      throw new ApiError(403, 'Unauthorized to update this project');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.status) updateData.status = data.status;

    let newlyAddedMemberIds: string[] = [];
    if (data.teamMembers) {
      updateData.teamMembers = data.teamMembers;
      newlyAddedMemberIds = data.teamMembers.filter((mId: string) => !project.teamMembers.includes(mId));
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData
    });

    await logActivity(userId, 'PROJECT_UPDATED', { projectId: id, projectName: updatedProject.name, updates: data });

    if (newlyAddedMemberIds.length > 0) {
      try {
        const updater = await prisma.user.findFirst({
          where: { id: userId, isDeleted: false }
        });
        const users = await prisma.user.findMany({
          where: { id: { in: newlyAddedMemberIds }, isDeleted: false }
        });
        const frontendUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:5173';
        const updaterName = updater?.name || 'a team member';
        for (const user of users) {
          if (user.email) {
            const projectUrl = `${frontendUrl}/projects/${id}`;
            try {
              await sendEmail({
                to: [user.email],
                subject: `Added to project: ${updatedProject.name}`,
                text: `Hello ${user.name || 'there'},

You have been added to the project "${updatedProject.name}" by ${updaterName}.`,
                html: `<p>You have been added to the project <strong>"${updatedProject.name}"</strong> by ${updaterName}.</p><a href="${projectUrl}">View Project</a>`,
              });
            } catch (err) {
              console.error(`Failed to send email to ${user.email}:`, err);
            }
          }
        }
      } catch (error) {
        console.error('Failed to send project member notification emails:', error);
      }
    }

    return updatedProject;
  },

  deleteProject: async (id: string, userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const project = await prisma.project.findFirst({
      where: { id, isDeleted: false }
    });

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (project.createdBy !== userId && user?.role !== 'Admin' && user?.role !== 'Manager') {
      throw new ApiError(403, 'Unauthorized to delete this project');
    }

    await prisma.project.update({
      where: { id },
      data: { isDeleted: true }
    });

    await prisma.task.updateMany({
      where: { projectId: id },
      data: { isDeleted: true }
    });

    await logActivity(userId, 'PROJECT_DELETED', { projectId: id, projectName: project.name });

    return { message: 'Project and its tasks soft deleted' };
  },

  getProjectAnalytics: async (projectId: string) => {
    const tasks = await prisma.task.findMany({
      where: { projectId, isDeleted: false }
    });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Done').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter((t) => t.status === 'To Do').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const priorityDistribution = {
      High: tasks.filter((t) => t.priority === 'High').length,
      Medium: tasks.filter((t) => t.priority === 'Medium').length,
      Low: tasks.filter((t) => t.priority === 'Low').length,
    };
    const totalEstimatedTime = tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
    const totalActualTime = tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate,
      priorityDistribution,
      totalEstimatedTime,
      totalActualTime,
    };
  }
};