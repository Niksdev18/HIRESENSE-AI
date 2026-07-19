import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, requireRole(['HR', 'Admin']), getAnalytics);

export default router;
