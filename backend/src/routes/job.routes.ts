import { Router } from 'express';
import { createJob, getJobs, getJobById, updateJob, deleteJob } from '../controllers/job.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createJobSchema, updateJobSchema } from '../utils/validation';

const router = Router();

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', authenticate, requireRole(['HR', 'Admin']), validate(createJobSchema), createJob);
router.put('/:id', authenticate, requireRole(['HR', 'Admin']), validate(updateJobSchema), updateJob);
router.delete('/:id', authenticate, requireRole(['HR', 'Admin']), deleteJob);

export default router;
