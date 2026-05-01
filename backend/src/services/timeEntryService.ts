import prisma from '../client.ts';
import ApiError from '../utils/ApiError.ts';

export const startTimer = async (userId: string, taskId: string, description?: string) => {
  // Check for existing active timer
  const activeTimer = await prisma.timeEntry.findFirst({
    where: {
      userId,
      endTime: null,
      isDeleted: false,
    },
  });

  if (activeTimer) {
    throw new ApiError(400, 'User already has an active timer');
  }

  return prisma.timeEntry.create({
    data: {
      userId,
      taskId,
      startTime: new Date(),
      description,
    },
  });
};

export const stopTimer = async (userId: string) => {
  const activeTimer = await prisma.timeEntry.findFirst({
    where: {
      userId,
      endTime: null,
      isDeleted: false,
    },
  });

  if (!activeTimer) {
    throw new ApiError(404, 'No active timer found');
  }

  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000); // In seconds

  const updatedEntry = await prisma.timeEntry.update({
    where: { id: activeTimer.id },
    data: {
      endTime,
      duration,
    },
  });

  // Update task's total actual time (in minutes)
  const allEntries = await prisma.timeEntry.findMany({
    where: {
      taskId: activeTimer.taskId,
      isDeleted: false,
      endTime: { not: null },
    },
  });

  const totalDurationSeconds = allEntries.reduce((sum: number, entry: any) => sum + (entry.duration || 0), 0);
  const totalDurationMinutes = Math.floor(totalDurationSeconds / 60);

  await prisma.task.update({
    where: { id: activeTimer.taskId },
    data: {
      actualTime: totalDurationMinutes,
    },
  });

  return updatedEntry;
};

export const getActiveTimer = async (userId: string) => {
  return prisma.timeEntry.findFirst({
    where: {
      userId,
      endTime: null,
      isDeleted: false,
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
};

export const getTimeEntries = async (taskId?: string, userId?: string) => {
  const where: any = { isDeleted: false };
  if (taskId) where.taskId = taskId;
  if (userId) where.userId = userId;

  return prisma.timeEntry.findMany({
    where,
    orderBy: { startTime: 'desc' },
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};
