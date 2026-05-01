import prisma from '../client.ts';

export const logActivity = async (userId: string | null, action: string, details?: any) => {
  return prisma.activityLog.create({
    data: {
      userId,
      action,
      details,
    },
  });
};

export const getActivityLogs = async (projectId?: string, taskId?: string) => {
  const where: any = { isDeleted: false };
  
  if (projectId) {
    where.details = {
      path: ['projectId'],
      equals: projectId,
    };
  }
  
  if (taskId) {
    where.details = {
      path: ['taskId'],
      equals: taskId,
    };
  }

  return prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};
