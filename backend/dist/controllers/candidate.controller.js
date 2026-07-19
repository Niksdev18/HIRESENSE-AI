"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.updateProfile = exports.deleteResume = exports.uploadResume = void 0;
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const cloudinary_1 = require("../utils/cloudinary");
const parser_1 = require("../utils/parser");
const uploadResume = async (req, res, next) => {
    try {
        const file = req.file;
        const userId = req.user?.userId;
        if (!file) {
            throw new errors_1.AppError('No file uploaded', 400);
        }
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        // 1. Signature analysis to prevent extension spoofing
        const buffer = file.buffer;
        const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
        const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04; // PK.. (DOCX is a zip)
        let detectedMime = '';
        if (isPdf) {
            detectedMime = 'application/pdf';
        }
        else if (isZip) {
            detectedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
        else {
            throw new errors_1.AppError('Invalid file signature. Only PDF and DOCX files are allowed.', 400);
        }
        // 2. Parse text from resume (with OCR fallback)
        console.log(`Parsing resume text. Mime: ${detectedMime}...`);
        const parsedText = await (0, parser_1.parseResume)(buffer, detectedMime);
        // 3. Upload file to Cloudinary / Local storage
        console.log(`Uploading file to storage...`);
        const uploadResult = await (0, cloudinary_1.uploadBuffer)(buffer, 'resumes', file.originalname);
        // 4. Delete old resume if exists
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId },
        });
        if (profile && profile.resumeUrl) {
            let oldPublicId = '';
            if (profile.resumeUrl.startsWith('/uploads/')) {
                oldPublicId = profile.resumeUrl.replace('/uploads/', '');
            }
            else {
                const parts = profile.resumeUrl.split('/');
                const folderIndex = parts.indexOf('resumes');
                if (folderIndex !== -1) {
                    const publicIdWithExt = parts.slice(folderIndex).join('/');
                    oldPublicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
                }
            }
            if (oldPublicId) {
                await (0, cloudinary_1.deleteFile)(oldPublicId);
            }
        }
        // 5. Save to profile
        const updatedProfile = await db_1.prisma.candidateProfile.update({
            where: { userId },
            data: {
                resumeUrl: uploadResult.url,
                resumeText: parsedText,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Resume uploaded and parsed successfully',
            resumeUrl: updatedProfile.resumeUrl,
            resumeText: parsedText,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadResume = uploadResume;
const deleteResume = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId },
        });
        if (!profile || !profile.resumeUrl) {
            throw new errors_1.AppError('No resume uploaded', 400);
        }
        let publicId = '';
        if (profile.resumeUrl.startsWith('/uploads/')) {
            publicId = profile.resumeUrl.replace('/uploads/', '');
        }
        else {
            const parts = profile.resumeUrl.split('/');
            const folderIndex = parts.indexOf('resumes');
            if (folderIndex !== -1) {
                const publicIdWithExt = parts.slice(folderIndex).join('/');
                publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
            }
        }
        if (publicId) {
            await (0, cloudinary_1.deleteFile)(publicId);
        }
        await db_1.prisma.candidateProfile.update({
            where: { userId },
            data: {
                resumeUrl: null,
                resumeText: null,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Resume deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteResume = deleteResume;
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const { phone, location, bio, githubUrl, linkedinUrl, portfolioUrl, skills, experienceYears, education, experience, } = req.body;
        const updatedProfile = await db_1.prisma.candidateProfile.update({
            where: { userId },
            data: {
                phone,
                location,
                bio,
                githubUrl,
                linkedinUrl,
                portfolioUrl,
                skills: skills ? skills : [],
                experienceYears: experienceYears ? parseInt(experienceYears) : null,
                education: education ? JSON.stringify(education) : null,
                experience: experience ? JSON.stringify(experience) : null,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            profile: updatedProfile,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const profile = await db_1.prisma.candidateProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!profile) {
            throw new errors_1.AppError('Profile not found', 404);
        }
        res.status(200).json({
            success: true,
            profile,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
