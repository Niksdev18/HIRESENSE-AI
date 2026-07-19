import { Router } from 'express';
import { getAuditLogs, getUsers, deleteUser } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Protect all admin endpoints with authentication and strict role validation
router.get('/audit-logs', authenticate, requireRole(['Admin']), getAuditLogs);
router.get('/users', authenticate, requireRole(['Admin']), getUsers);
router.delete('/users/:id', authenticate, requireRole(['Admin']), deleteUser);

export default router;
