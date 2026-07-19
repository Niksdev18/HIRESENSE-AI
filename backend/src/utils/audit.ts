import { prisma } from '../config/db';

export const logAction = async (userId: string, action: string, details: any): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: typeof details === 'string' ? details : JSON.stringify(details),
      },
    });
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
  }
};
