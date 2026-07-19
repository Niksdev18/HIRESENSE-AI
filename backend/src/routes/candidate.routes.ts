import { Router } from 'express';
import multer from 'multer';
import { uploadResume, deleteResume, updateProfile, getProfile } from '../controllers/candidate.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Multer memory storage setup with 5MB file cap
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.post('/upload-resume', authenticate, requireRole(['Candidate']), upload.single('resume'), uploadResume);
router.delete('/resume', authenticate, requireRole(['Candidate']), deleteResume);
router.put('/profile', authenticate, requireRole(['Candidate']), updateProfile);
router.get('/profile', authenticate, requireRole(['Candidate']), getProfile);

export default router;
