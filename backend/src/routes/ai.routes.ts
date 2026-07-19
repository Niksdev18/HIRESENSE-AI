import { Router } from 'express';
import { 
  analyzeResume, 
  matchJob, 
  improveResume, 
  generateQuestionsEndpoint, 
  generateCoverLetterEndpoint,
  analysisLimiter,
  generationLimiter
} from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all endpoints with JWT auth and enforce specific rate limit profiles
router.post('/analyze-resume', authenticate, analysisLimiter, analyzeResume);
router.post('/match-job', authenticate, analysisLimiter, matchJob);
router.post('/improve-resume', authenticate, generationLimiter, improveResume);
router.post('/generate-questions', authenticate, generationLimiter, generateQuestionsEndpoint);
router.post('/generate-cover-letter', authenticate, generationLimiter, generateCoverLetterEndpoint);

export default router;
