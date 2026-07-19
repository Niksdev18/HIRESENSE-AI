import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { 
  analyzeResumeWithGemini, 
  calculateWeightedMatch, 
  generateSuggestions, 
  generateQuestions, 
  generateCoverLetter 
} from '../utils/gemini';
import rateLimit from 'express-rate-limit';

// Rate limiters keyed on user ID
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20,
  keyGenerator: (req: any) => req.user?.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many analysis requests. You are limited to 20 screen operations per hour.',
    });
  },
});

export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10,
  keyGenerator: (req: any) => req.user?.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many generation requests. Text writing operations are limited to 10 per hour.',
    });
  },
});

// Single authoritative function managing cache and Gemini queries
async function getOrRunAnalysis(candidateProfileId: string, jobId: string, resumeText: string, jobDescription: string) {
  const cached = await prisma.resumeAnalysis.findUnique({
    where: {
      candidateProfileId_jobId: {
        candidateProfileId,
        jobId,
      },
    },
  });

  if (cached) {
    const profile = await prisma.candidateProfile.findUnique({ where: { id: candidateProfileId } });
    const job = await prisma.job.findUnique({ where: { id: jobId } });

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
  const raw = await analyzeResumeWithGemini(resumeText, jobDescription);
  const matchScore = calculateWeightedMatch(raw);

  return await prisma.resumeAnalysis.upsert({
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
export const analyzeResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobId = req.body.jobId as string;
    const candidateId = req.user?.userId;

    if (!candidateId) throw new AppError('Unauthorized', 401);
    if (!jobId) throw new AppError('Job ID is required', 400);

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
    });

    if (!profile || !profile.resumeText) {
      throw new AppError('Please upload a resume in the Resume section before running AI screening.', 400);
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new AppError('Target job posting not found', 404);

    const analysis = await getOrRunAnalysis(profile.id, job.id, profile.resumeText, job.description);

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

// Controller 2: Match Job (reuses identical screen logic)
export const matchJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobId = req.body.jobId as string;
    const candidateId = req.user?.userId;

    if (!candidateId) throw new AppError('Unauthorized', 401);
    if (!jobId) throw new AppError('Job ID is required', 400);

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
    });

    if (!profile || !profile.resumeText) {
      throw new AppError('Please upload a resume in the Resume section before checking matches.', 400);
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new AppError('Target job posting not found', 404);

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
  } catch (error) {
    next(error);
  }
};

// Controller 3: Improve Resume (actionable suggestions - Ephemeral)
export const improveResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobId = req.body.jobId as string;
    const candidateId = req.user?.userId;

    if (!candidateId) throw new AppError('Unauthorized', 401);
    if (!jobId) throw new AppError('Job ID is required', 400);

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
    });

    if (!profile || !profile.resumeText) {
      throw new AppError('Please upload a resume before requesting improvement tips.', 400);
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new AppError('Target job posting not found', 404);

    const suggestions = await generateSuggestions(profile.resumeText, job.description);

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

// Controller 4: Generate Questions (interview mock - Ephemeral)
export const generateQuestionsEndpoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobId = req.body.jobId as string;
    const candidateId = req.user?.userId;

    if (!candidateId) throw new AppError('Unauthorized', 401);
    if (!jobId) throw new AppError('Job ID is required', 400);

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
    });

    if (!profile || !profile.resumeText) {
      throw new AppError('Please upload a resume to generate tailored prep questions.', 400);
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new AppError('Target job posting not found', 404);

    const questions = await generateQuestions(profile.resumeText, job.description);

    res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// Controller 5: Generate Cover Letter (cover letter writer - Ephemeral)
export const generateCoverLetterEndpoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobId = req.body.jobId as string;
    const candidateId = req.user?.userId;

    if (!candidateId) throw new AppError('Unauthorized', 401);
    if (!jobId) throw new AppError('Job ID is required', 400);

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
    });

    if (!profile || !profile.resumeText) {
      throw new AppError('Please upload a resume to write a targeted cover letter.', 400);
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new AppError('Target job posting not found', 404);

    const coverLetter = await generateCoverLetter(profile.resumeText, job.description);

    res.status(200).json({
      success: true,
      coverLetter,
    });
  } catch (error) {
    next(error);
  }
};
