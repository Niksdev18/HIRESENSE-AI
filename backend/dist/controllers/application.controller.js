"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCandidates = exports.getSavedJobs = exports.unsaveJob = exports.saveJob = exports.updateApplicationStatus = exports.getJobApplicants = exports.getCandidateApplications = exports.applyJob = void 0;
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
const email_service_1 = require("../services/email.service");
const applyJob = async (req, res, next) => {
    try {
        const jobId = req.params.jobId;
        const candidateId = req.user?.userId;
        if (!candidateId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        // Check if profile exists and has a resume uploaded
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId: candidateId },
        });
        if (!profile || !profile.resumeUrl) {
            throw new errors_1.AppError('Please upload a resume in the Resume section before applying.', 400);
        }
        // Check unique application constraint
        const existingApplication = await db_1.prisma.application.findUnique({
            where: {
                jobId_candidateId: {
                    jobId,
                    candidateId,
                },
            },
        });
        if (existingApplication) {
            throw new errors_1.AppError('You have already applied for this job opening.', 400);
        }
        const application = await db_1.prisma.application.create({
            data: {
                jobId,
                candidateId,
            },
        });
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.applyJob = applyJob;
const getCandidateApplications = async (req, res, next) => {
    try {
        const candidateId = req.user?.userId;
        if (!candidateId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const applications = await db_1.prisma.application.findMany({
            where: { candidateId },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        location: true,
                        salary: true,
                    },
                },
            },
            orderBy: { appliedAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            applications,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCandidateApplications = getCandidateApplications;
const getJobApplicants = async (req, res, next) => {
    try {
        const jobId = req.params.jobId;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const job = await db_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new errors_1.AppError('Job not found', 404);
        }
        // Verify ownership (Admin bypasses)
        if (job.createdById !== userId && userRole !== 'Admin') {
            throw new errors_1.AppError('Access denied: You can only view applicants for jobs you created', 403);
        }
        const applications = await db_1.prisma.application.findMany({
            where: { jobId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                phone: true,
                                location: true,
                                bio: true,
                                skills: true,
                                experienceYears: true,
                                education: true,
                                experience: true,
                                githubUrl: true,
                                linkedinUrl: true,
                                portfolioUrl: true,
                                resumeUrl: true, // Exposed safely since HR creator is authenticated
                            },
                        },
                    },
                },
            },
            orderBy: { appliedAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            applications,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobApplicants = getJobApplicants;
const updateApplicationStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const application = await db_1.prisma.application.findUnique({
            where: { id },
            include: {
                job: {
                    select: {
                        title: true,
                        company: true,
                        createdById: true,
                    },
                },
                candidate: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!application) {
            throw new errors_1.AppError('Application not found', 404);
        }
        // Verify job creator ownership
        if (application.job.createdById !== userId && userRole !== 'Admin') {
            throw new errors_1.AppError('Access denied: You can only update applicant status for jobs you created', 403);
        }
        const updatedApplication = await db_1.prisma.application.update({
            where: { id },
            data: { status },
        });
        await (0, audit_1.logAction)(userId, 'APPLICATION_STATUS_CHANGED', { applicationId: id, status });
        if (status !== 'Applied') {
            const emailService = email_service_1.EmailServiceFactory.getService();
            const emailSubject = `Update on your application for ${application.job.title}`;
            const emailHtml = `
        <h3>Application Status Update</h3>
        <p>Dear ${application.candidate.name},</p>
        <p>The recruiter has updated your application status for <strong>${application.job.title}</strong> at <strong>${application.job.company}</strong> to <strong>${status}</strong>.</p>
        <p>Please log in to your HireSense AI Candidate Dashboard to review details.</p>
      `;
            emailService.sendMail(application.candidate.email, emailSubject, emailHtml).catch(console.error);
        }
        res.status(200).json({
            success: true,
            message: `Status updated to ${status} successfully`,
            application: updatedApplication,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
const saveJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const candidateId = req.user?.userId;
        if (!candidateId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        // Guard unique saved job
        const existing = await db_1.prisma.savedJob.findUnique({
            where: {
                jobId_candidateId: {
                    jobId,
                    candidateId,
                },
            },
        });
        if (existing) {
            throw new errors_1.AppError('You have already saved this job posting.', 400);
        }
        await db_1.prisma.savedJob.create({
            data: {
                jobId,
                candidateId,
            },
        });
        res.status(201).json({
            success: true,
            message: 'Job saved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.saveJob = saveJob;
const unsaveJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const candidateId = req.user?.userId;
        if (!candidateId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        await db_1.prisma.savedJob.delete({
            where: {
                jobId_candidateId: {
                    jobId,
                    candidateId,
                },
            },
        });
        res.status(200).json({
            success: true,
            message: 'Job unsaved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unsaveJob = unsaveJob;
const getSavedJobs = async (req, res, next) => {
    try {
        const candidateId = req.user?.userId;
        if (!candidateId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const savedJobs = await db_1.prisma.savedJob.findMany({
            where: { candidateId },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        location: true,
                        salary: true,
                        experience: true,
                        requiredSkills: true,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            savedJobs: savedJobs.map((sj) => sj.job),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSavedJobs = getSavedJobs;
const getAllCandidates = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || (userRole !== 'HR' && userRole !== 'Admin')) {
            throw new errors_1.AppError('Access denied: HR / Admin credentials required', 403);
        }
        const candidates = await db_1.prisma.user.findMany({
            where: { role: 'Candidate' },
            select: {
                id: true,
                name: true,
                email: true,
                profile: {
                    select: {
                        phone: true,
                        location: true,
                        bio: true,
                        skills: true,
                        experienceYears: true,
                        education: true,
                        experience: true,
                        githubUrl: true,
                        linkedinUrl: true,
                        portfolioUrl: true,
                        resumeUrl: true, // Exposed to verified HR users browsing pool
                        resumeAnalyses: {
                            include: {
                                job: {
                                    select: {
                                        title: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            candidates,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllCandidates = getAllCandidates;
