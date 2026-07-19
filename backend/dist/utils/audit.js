"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
const db_1 = require("../config/db");
const logAction = async (userId, action, details) => {
    try {
        await db_1.prisma.auditLog.create({
            data: {
                userId,
                action,
                details: typeof details === 'string' ? details : JSON.stringify(details),
            },
        });
    }
    catch (err) {
        console.error('Failed to write audit log entry:', err);
    }
};
exports.logAction = logAction;
