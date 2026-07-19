"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.AppError('Authentication failed: Missing or invalid token format', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(new errors_1.AppError('Authentication failed: Invalid or expired access token', 401));
    }
};
exports.authenticate = authenticate;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            next(new errors_1.AppError('Authentication required', 401));
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(new errors_1.AppError('Access denied: Unauthorized role privileges', 403));
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
