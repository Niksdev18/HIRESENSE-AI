import { Router } from 'express';
import {
  applyJob,
  getCandidateApplications,
  getJobApplicants,
  updateApplicationStatus,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getAllCandidates,
} from '../controllers/application.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Candidate endpoints
router.post('/apply/:jobId', authenticate, requireRole(['Candidate']), applyJob);
router.get('/candidate', authenticate, requireRole(['Candidate']), getCandidateApplications);
router.post('/save/:id', authenticate, requireRole(['Candidate']), saveJob);
router.delete('/unsave/:id', authenticate, requireRole(['Candidate']), unsaveJob);
router.get('/saved', authenticate, requireRole(['Candidate']), getSavedJobs);

// HR applicant reviews and status updates
router.get('/job/:jobId', authenticate, requireRole(['HR', 'Admin']), getJobApplicants);
router.put('/:id/status', authenticate, requireRole(['HR', 'Admin']), updateApplicationStatus);
router.get('/pool', authenticate, requireRole(['HR', 'Admin']), getAllCandidates);

export default router;
