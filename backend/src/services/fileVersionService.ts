import prisma from '../client.ts';

export const uploadFileVersion = async (taskId: string, fileName: string, fileUrl: string, uploadedBy: string) => {
  const lastVersion = await prisma.fileVersion.findFirst({
    where: {
      taskId,
      fileName,
      isDeleted: false,
    },
    orderBy: { versionNumber: 'desc' },
  });

  const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

  return prisma.fileVersion.create({
    data: {
      taskId,
      fileName,
      fileUrl,
      versionNumber: nextVersionNumber,
      uploadedBy,
    },
  });
};

export const getFileVersions = async (taskId: string) => {
  return prisma.fileVersion.findMany({
    where: {
      taskId,
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
  });
};
