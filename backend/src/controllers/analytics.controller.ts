import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';

export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const isHR = userRole === 'HR';
    const jobFilter = isHR ? { createdById: userId } : {};

    // 1. Applications per job (Bar Chart)
    const jobs = await prisma.job.findMany({
      where: jobFilter,
      select: {
        title: true,
        _count: { select: { applications: true } },
      },
    });

    const barData = jobs.map((j) => ({
      name: j.title,
      value: j._count.applications,
    }));

    // 2. Funnel status counts (Pie Chart)
    const funnelData = await prisma.application.groupBy({
      by: ['status'],
      where: isHR ? { job: { createdById: userId } } : {},
      _count: { id: true },
    });

    // 3. Average ATS score
    const avgAts = await prisma.resumeAnalysis.aggregate({
      where: isHR ? { job: { createdById: userId } } : {},
      _avg: { atsScore: true },
    });

    // 4. Top required skills (scoped if HR)
    const allJobs = await prisma.job.findMany({ 
      where: jobFilter,
      select: { requiredSkills: true },
    });
    
    const skillsMap: Record<string, number> = {};
    allJobs.forEach((job) => {
      job.requiredSkills.forEach((skill) => {
        const cleanSkill = skill.trim();
        if (cleanSkill) {
          skillsMap[cleanSkill] = (skillsMap[cleanSkill] || 0) + 1;
        }
      });
    });
    
    const topSkills = Object.entries(skillsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.status(200).json({
      success: true,
      barData,
      pieData: funnelData.map((f) => ({ name: f.status, value: f._count.id })),
      averageAts: Math.round(avgAts._avg.atsScore || 0),
      topSkills,
    });
  } catch (error) {
    next(error);
  }
};
