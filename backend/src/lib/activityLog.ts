import prisma from './prisma';

export const createActivityLog = async (
  userId: string,
  action: string,
  details?: string,
  ipAddress?: string
) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
};