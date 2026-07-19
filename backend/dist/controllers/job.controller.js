"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJob = exports.updateJob = exports.getJobById = exports.getJobs = exports.createJob = void 0;
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
const createJob = async (req, res, next) => {
    try {
        const { title, company, description, requiredSkills, experience, salary, location } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const job = await db_1.prisma.job.create({
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
        await (0, audit_1.logAction)(userId, 'JOB_CREATED', { jobId: job.id, title: job.title });
        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            job,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createJob = createJob;
const getJobs = async (req, res, next) => {
    try {
        const jobs = await db_1.prisma.job.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            jobs,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobs = getJobs;
const getJobById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const job = await db_1.prisma.job.findUnique({
            where: { id },
        });
        if (!job) {
            throw new errors_1.AppError('Job not found', 404);
        }
        res.status(200).json({
            success: true,
            job,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobById = getJobById;
const updateJob = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const existingJob = await db_1.prisma.job.findUnique({
            where: { id },
        });
        if (!existingJob) {
            throw new errors_1.AppError('Job not found', 404);
        }
        if (existingJob.createdById !== userId && userRole !== 'Admin') {
            throw new errors_1.AppError('Access denied: You can only edit jobs you created', 403);
        }
        const updatedJob = await db_1.prisma.job.update({
            where: { id },
            data: req.body,
        });
        await (0, audit_1.logAction)(userId, 'JOB_EDITED', { jobId: id, title: updatedJob.title });
        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const existingJob = await db_1.prisma.job.findUnique({
            where: { id },
        });
        if (!existingJob) {
            throw new errors_1.AppError('Job not found', 404);
        }
        if (existingJob.createdById !== userId && userRole !== 'Admin') {
            throw new errors_1.AppError('Access denied: You can only delete jobs you created', 403);
        }
        await db_1.prisma.job.delete({
            where: { id },
        });
        await (0, audit_1.logAction)(userId, 'JOB_DELETED', { jobId: id, title: existingJob.title });
        res.status(200).json({
            success: true,
            message: 'Job deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteJob = deleteJob;
