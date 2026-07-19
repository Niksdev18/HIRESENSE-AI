"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = void 0;
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const isHR = userRole === 'HR';
        const jobFilter = isHR ? { createdById: userId } : {};
        // 1. Applications per job (Bar Chart)
        const jobs = await db_1.prisma.job.findMany({
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
        const funnelData = await db_1.prisma.application.groupBy({
            by: ['status'],
            where: isHR ? { job: { createdById: userId } } : {},
            _count: { id: true },
        });
        // 3. Average ATS score
        const avgAts = await db_1.prisma.resumeAnalysis.aggregate({
            where: isHR ? { job: { createdById: userId } } : {},
            _avg: { atsScore: true },
        });
        // 4. Top required skills (scoped if HR)
        const allJobs = await db_1.prisma.job.findMany({
            where: jobFilter,
            select: { requiredSkills: true },
        });
        const skillsMap = {};
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAnalytics = getAnalytics;
