import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { logAction } from '../utils/audit';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'Admin') {
      throw new AppError('Access denied: Admin credentials required', 403);
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'Admin') {
      throw new AppError('Access denied: Admin credentials required', 403);
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const id = req.params.id as string;

    if (!userId || userRole !== 'Admin') {
      throw new AppError('Access denied: Admin credentials required', 403);
    }

    if (id === userId) {
      throw new AppError('You cannot deactivate your own admin account', 400);
    }

    const userToDeactivate = await prisma.user.findUnique({ where: { id } });
    if (!userToDeactivate) {
      throw new AppError('User not found', 404);
    }

    // Verify last remaining active Admin guard
    if (userToDeactivate.role === 'Admin') {
      const activeAdminsCount = await prisma.user.count({
        where: { role: 'Admin', isActive: true },
      });
      if (activeAdminsCount <= 1) {
        throw new AppError('Deactivation denied: Must have at least one active Admin in the system', 400);
      }
    }

    // Soft delete: set isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log the admin action
    await logAction(userId as string, 'USER_DEACTIVATED', { targetUserId: id, name: userToDeactivate.name, email: userToDeactivate.email });

    res.status(200).json({
      success: true,
      message: 'User account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
