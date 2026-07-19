"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const db_1 = require("../config/db");
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
            db_1.prisma.user.findUnique.mockResolvedValue(null);
            db_1.prisma.user.create.mockResolvedValue({
                id: 'user-123',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'Candidate',
                isActive: true,
            });
            const res = await (0, supertest_1.default)(server_1.default)
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
            db_1.prisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });
            const res = await (0, supertest_1.default)(server_1.default)
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
            db_1.prisma.job.findMany.mockResolvedValue([
                { id: 'job-1', title: 'React Developer', company: 'Tech LLC' },
            ]);
            const res = await (0, supertest_1.default)(server_1.default).get('/api/jobs');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.jobs.length).toBe(1);
        });
    });
});
