import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export const getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Run simple query to check DB connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
