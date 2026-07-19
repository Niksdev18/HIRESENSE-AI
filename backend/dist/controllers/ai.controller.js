"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCoverLetterEndpoint = exports.generateQuestionsEndpoint = exports.improveResume = exports.matchJob = exports.analyzeResume = exports.generationLimiter = exports.analysisLimiter = void 0;
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const gemini_1 = require("../utils/gemini");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limiters keyed on user ID
exports.analysisLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 20,
    keyGenerator: (req) => req.user?.userId || req.ip,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many analysis requests. You are limited to 20 screen operations per hour.',
        });
    },
});
exports.generationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10,
    keyGenerator: (req) => req.user?.userId || req.ip,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many generation requests. Text writing operations are limited to 10 per hour.',
        });
    },
});
// Single authoritative function managing cache and Gemini queries
async function getOrRunAnalysis(candidateProfileId, jobId, resumeText, jobDescription) {
    const cached = await db_1.prisma.resumeAnalysis.findUnique({
        where: {
            candidateProfileId_jobId: {
                candidateProfileId,
                jobId,
            },
        },
    });
    if (cached) {
        const profile = await db_1.prisma.candidateProfile.findUnique({ where: { id: candidateProfileId } });
        const job = await db_1.prisma.job.findUnique({ where: { id: jobId } });
        if (profile && job) {
            const cachedTime = cached.updatedAt.getTime();
            const profileTime = profile.updatedAt.getTime();
            const jobTime = job.updatedAt.getTime();
            // Return cached row if newer than both candidate and job definitions
            if (cachedTime > profileTime && cachedTime > jobTime) {
                console.log('⚡ Short-circuiting: Returning cached resume analysis');
                return cached;
            }
        }
    }
    // Cache miss: Execute query and map subscores
    const raw = await (0, gemini_1.analyzeResumeWithGemini)(resumeText, jobDescription);
    const matchScore = (0, gemini_1.calculateWeightedMatch)(raw);
    return await db_1.prisma.resumeAnalysis.upsert({
        where: {
            candidateProfileId_jobId: {
                candidateProfileId,
                jobId,
            },
        },
        update: {
            atsScore: raw.atsScore,
            matchScore,
            skillsScore: raw.skillsScore,
            experienceScore: raw.experienceScore,
            educationScore: raw.educationScore,
            projectsScore: raw.projectsScore,
            certificationsScore: raw.certificationsScore,
            missingSkills: raw.missingSkills,
            matchedSkills: raw.matchedSkills,
            strengths: raw.strengths,
            weaknesses: raw.weaknesses,
            recommendation: raw.recommendation,
        },
        create: {
            candidateProfileId,
            jobId,
            atsScore: raw.atsScore,
            matchScore,
            skillsScore: raw.skillsScore,
            experienceScore: raw.experienceScore,
            educationScore: raw.educationScore,
            projectsScore: raw.projectsScore,
            certificationsScore: raw.certificationsScore,
            missingSkills: raw.missingSkills,
            matchedSkills: raw.matchedSkills,
            strengths: raw.strengths,
            weaknesses: raw.weaknesses,
            recommendation: raw.recommendation,
        },
    });
}
// Controller 1: Analyze Resume
const analyzeResume = async (req, res, next) => {
    try {
        const jobId = req.body.jobId;
        const candidateId = req.user?.userId;
        if (!candidateId)
            throw new errors_1.AppError('Unauthorized', 401);
        if (!jobId)
            throw new errors_1.AppError('Job ID is required', 400);
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId: candidateId },
        });
        if (!profile || !profile.resumeText) {
            throw new errors_1.AppError('Please upload a resume in the Resume section before running AI screening.', 400);
        }
        const job = await db_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new errors_1.AppError('Target job posting not found', 404);
        const analysis = await getOrRunAnalysis(profile.id, job.id, profile.resumeText, job.description);
        res.status(200).json({
            success: true,
            analysis,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.analyzeResume = analyzeResume;
// Controller 2: Match Job (reuses identical screen logic)
const matchJob = async (req, res, next) => {
    try {
        const jobId = req.body.jobId;
        const candidateId = req.user?.userId;
        if (!candidateId)
            throw new errors_1.AppError('Unauthorized', 401);
        if (!jobId)
            throw new errors_1.AppError('Job ID is required', 400);
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId: candidateId },
        });
        if (!profile || !profile.resumeText) {
            throw new errors_1.AppError('Please upload a resume in the Resume section before checking matches.', 400);
        }
        const job = await db_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new errors_1.AppError('Target job posting not found', 404);
        const analysis = await getOrRunAnalysis(profile.id, job.id, profile.resumeText, job.description);
        res.status(200).json({
            success: true,
            matchScore: analysis.matchScore,
            skillsScore: analysis.skillsScore,
            experienceScore: analysis.experienceScore,
            educationScore: analysis.educationScore,
            projectsScore: analysis.projectsScore,
            certificationsScore: analysis.certificationsScore,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.matchJob = matchJob;
// Controller 3: Improve Resume (actionable suggestions - Ephemeral)
const improveResume = async (req, res, next) => {
    try {
        const jobId = req.body.jobId;
        const candidateId = req.user?.userId;
        if (!candidateId)
            throw new errors_1.AppError('Unauthorized', 401);
        if (!jobId)
            throw new errors_1.AppError('Job ID is required', 400);
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId: candidateId },
        });
        if (!profile || !profile.resumeText) {
            throw new errors_1.AppError('Please upload a resume before requesting improvement tips.', 400);
        }
        const job = await db_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new errors_1.AppError('Target job posting not found', 404);
        const suggestions = await (0, gemini_1.generateSuggestions)(profile.resumeText, job.description);
        res.status(200).json({
            success: true,
            suggestions,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.improveResume = improveResume;
// Controller 4: Generate Questions (interview mock - Ephemeral)
const generateQuestionsEndpoint = async (req, res, next) => {
    try {
        const jobId = req.body.jobId;
        const candidateId = req.user?.userId;
        if (!candidateId)
            throw new errors_1.AppError('Unauthorized', 401);
        if (!jobId)
            throw new errors_1.AppError('Job ID is required', 400);
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId: candidateId },
        });
        if (!profile || !profile.resumeText) {
            throw new errors_1.AppError('Please upload a resume to generate tailored prep questions.', 400);
        }
        const job = await db_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new errors_1.AppError('Target job posting not found', 404);
        const questions = await (0, gemini_1.generateQuestions)(profile.resumeText, job.description);
        res.status(200).json({
            success: true,
            questions,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.generateQuestionsEndpoint = generateQuestionsEndpoint;
// Controller 5: Generate Cover Letter (cover letter writer - Ephemeral)
const generateCoverLetterEndpoint = async (req, res, next) => {
    try {
        const jobId = req.body.jobId;
        const candidateId = req.user?.userId;
        if (!candidateId)
            throw new errors_1.AppError('Unauthorized', 401);
        if (!jobId)
            throw new errors_1.AppError('Job ID is required', 400);
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId: candidateId },
        });
        if (!profile || !profile.resumeText) {
            throw new errors_1.AppError('Please upload a resume to write a targeted cover letter.', 400);
        }
        const job = await db_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new errors_1.AppError('Target job posting not found', 404);
        const coverLetter = await (0, gemini_1.generateCoverLetter)(profile.resumeText, job.description);
        res.status(200).json({
            success: true,
            coverLetter,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.generateCoverLetterEndpoint = generateCoverLetterEndpoint;
