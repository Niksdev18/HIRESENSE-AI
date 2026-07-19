"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getUsers = exports.getAuditLogs = void 0;
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
const getAuditLogs = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || userRole !== 'Admin') {
            throw new errors_1.AppError('Access denied: Admin credentials required', 403);
        }
        const logs = await db_1.prisma.auditLog.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json({
            success: true,
            logs,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAuditLogs = getAuditLogs;
const getUsers = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || userRole !== 'Admin') {
            throw new errors_1.AppError('Access denied: Admin credentials required', 403);
        }
        const users = await db_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json({
            success: true,
            users,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const deleteUser = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const id = req.params.id;
        if (!userId || userRole !== 'Admin') {
            throw new errors_1.AppError('Access denied: Admin credentials required', 403);
        }
        if (id === userId) {
            throw new errors_1.AppError('You cannot deactivate your own admin account', 400);
        }
        const userToDeactivate = await db_1.prisma.user.findUnique({ where: { id } });
        if (!userToDeactivate) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Verify last remaining active Admin guard
        if (userToDeactivate.role === 'Admin') {
            const activeAdminsCount = await db_1.prisma.user.count({
                where: { role: 'Admin', isActive: true },
            });
            if (activeAdminsCount <= 1) {
                throw new errors_1.AppError('Deactivation denied: Must have at least one active Admin in the system', 400);
            }
        }
        // Soft delete: set isActive to false
        await db_1.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
        // Audit log the admin action
        await (0, audit_1.logAction)(userId, 'USER_DEACTIVATED', { targetUserId: id, name: userToDeactivate.name, email: userToDeactivate.email });
        res.status(200).json({
            success: true,
            message: 'User account deactivated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
