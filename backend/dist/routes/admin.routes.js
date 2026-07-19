"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all admin endpoints with authentication and strict role validation
router.get('/audit-logs', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Admin']), admin_controller_1.getAuditLogs);
router.get('/users', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Admin']), admin_controller_1.getUsers);
router.delete('/users/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['Admin']), admin_controller_1.deleteUser);
exports.default = router;
