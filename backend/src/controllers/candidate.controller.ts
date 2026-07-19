import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { uploadBuffer, deleteFile } from '../utils/cloudinary';
import { parseResume } from '../utils/parser';

export const uploadResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    const userId = req.user?.userId;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // 1. Signature analysis to prevent extension spoofing
    const buffer = file.buffer;
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04; // PK.. (DOCX is a zip)

    let detectedMime = '';
    if (isPdf) {
      detectedMime = 'application/pdf';
    } else if (isZip) {
      detectedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      throw new AppError('Invalid file signature. Only PDF and DOCX files are allowed.', 400);
    }

    // 2. Parse text from resume (with OCR fallback)
    console.log(`Parsing resume text. Mime: ${detectedMime}...`);
    const parsedText = await parseResume(buffer, detectedMime);

    // 3. Upload file to Cloudinary / Local storage
    console.log(`Uploading file to storage...`);
    const uploadResult = await uploadBuffer(buffer, 'resumes', file.originalname);

    // 4. Delete old resume if exists
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (profile && profile.resumeUrl) {
      let oldPublicId = '';
      if (profile.resumeUrl.startsWith('/uploads/')) {
        oldPublicId = profile.resumeUrl.replace('/uploads/', '');
      } else {
        const parts = profile.resumeUrl.split('/');
        const folderIndex = parts.indexOf('resumes');
        if (folderIndex !== -1) {
          const publicIdWithExt = parts.slice(folderIndex).join('/');
          oldPublicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
        }
      }
      if (oldPublicId) {
        await deleteFile(oldPublicId);
      }
    }

    // 5. Save to profile
    const updatedProfile = await prisma.candidateProfile.update({
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
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.resumeUrl) {
      throw new AppError('No resume uploaded', 400);
    }

    let publicId = '';
    if (profile.resumeUrl.startsWith('/uploads/')) {
      publicId = profile.resumeUrl.replace('/uploads/', '');
    } else {
      const parts = profile.resumeUrl.split('/');
      const folderIndex = parts.indexOf('resumes');
      if (folderIndex !== -1) {
        const publicIdWithExt = parts.slice(folderIndex).join('/');
        publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
      }
    }

    if (publicId) {
      await deleteFile(publicId);
    }

    await prisma.candidateProfile.update({
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
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const {
      phone,
      location,
      bio,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      skills,
      experienceYears,
      education,
      experience,
    } = req.body;

    const updatedProfile = await prisma.candidateProfile.update({
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
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const profile = await prisma.candidateProfile.findUnique({
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
      throw new AppError('Profile not found', 404);
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};
