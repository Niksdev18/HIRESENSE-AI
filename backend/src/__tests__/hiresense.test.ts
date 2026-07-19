import request from 'supertest';
import app from '../server';
import { prisma } from '../config/db';
import jwt from 'jsonwebtoken';

// Mock DB client calls to prevent side-effects
jest.mock('../config/db', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    resumeAnalysis: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    candidateProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Mock Gemini AI responses
jest.mock('../utils/gemini', () => ({
  analyzeResumeWithGemini: jest.fn().mockResolvedValue({
    atsScore: 85,
    skillsScore: 90,
    experienceScore: 80,
    educationScore: 90,
    projectsScore: 80,
    certificationsScore: 90,
    matchedSkills: ['React', 'TypeScript'],
    missingSkills: ['DevOps'],
    strengths: ['Great frontend skills'],
    weaknesses: ['Needs cloud experience'],
    recommendation: 'Strong candidate.',
  }),
  calculateWeightedMatch: jest.fn().mockReturnValue(87),
}));

describe('HireSense AI API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Endpoints', () => {
    it('should register a candidate successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Candidate',
        isActive: true,
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'Candidate',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('john@example.com');
    });

    it('should return 400 when register email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          role: 'Candidate',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Job Board CRUD Operations', () => {
    it('should fetch all active job listings', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([
        { id: 'job-1', title: 'React Developer', company: 'Tech LLC' },
      ]);

      const res = await request(app).get('/api/jobs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.jobs.length).toBe(1);
    });
  });

  describe('AI Screening Operations', () => {
    it('should successfully analyze resume hitting mock fallback path', async () => {
      const mockToken = jwt.sign(
        { userId: 'user-123', role: 'Candidate' },
        process.env.JWT_SECRET || 'mockaccesssecretfortests123456789012'
      );

      (prisma.candidateProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-123',
        userId: 'user-123',
        resumeText: 'Experienced typescript engineer resume text.',
      });
      (prisma.job.findUnique as jest.Mock).mockResolvedValue({
        id: 'job-123',
        title: 'TypeScript Developer',
        description: 'TypeScript Developer job description.',
      });
      (prisma.resumeAnalysis.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.resumeAnalysis.upsert as jest.Mock).mockResolvedValue({
        atsScore: 85,
        matchScore: 87,
      });

      const res = await request(app)
        .post('/api/ai/analyze-resume')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ jobId: 'job-123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.analysis.atsScore).toBe(85);
    });
  });
});
