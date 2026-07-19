import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { logAction } from '../utils/audit';

export const createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, company, description, requiredSkills, experience, salary, location } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const job = await prisma.job.create({
      data: {
        title,
        company,
        description,
        requiredSkills,
        experience,
        salary,
        location,
        createdById: userId,
      },
    });

    await logAction(userId, 'JOB_CREATED', { jobId: job.id, title: job.title });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      throw new AppError('Job not found', 404);
    }

    if (existingJob.createdById !== userId && userRole !== 'Admin') {
      throw new AppError('Access denied: You can only edit jobs you created', 403);
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: req.body,
    });

    await logAction(userId as string, 'JOB_EDITED', { jobId: id, title: updatedJob.title });

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      throw new AppError('Job not found', 404);
    }

    if (existingJob.createdById !== userId && userRole !== 'Admin') {
      throw new AppError('Access denied: You can only delete jobs you created', 403);
    }

    await prisma.job.delete({
      where: { id },
    });

    await logAction(userId as string, 'JOB_DELETED', { jobId: id, title: existingJob.title });

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
