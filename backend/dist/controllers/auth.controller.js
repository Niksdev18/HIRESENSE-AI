"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const env_1 = require("../config/env");
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new errors_1.AppError('Email already registered', 400);
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await db_1.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                },
            });
            if (role === 'Candidate') {
                await tx.candidateProfile.create({
                    data: {
                        userId: newUser.id,
                    },
                });
            }
            return newUser;
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new errors_1.AppError('Invalid email or password', 401);
        }
        if (!user.isActive) {
            throw new errors_1.AppError('Account has been deactivated. Please contact support.', 403);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.AppError('Invalid email or password', 401);
        }
        const payload = { userId: user.id, role: user.role };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        // Save refresh token to database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await db_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new errors_1.AppError('No refresh token provided', 401);
        }
        // Verify token structure/signature
        let decoded;
        try {
            decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch (e) {
            throw new errors_1.AppError('Invalid refresh token', 401);
        }
        // Verify token in DB
        const dbToken = await db_1.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
            throw new errors_1.AppError('Expired or revoked refresh token', 401);
        }
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: decoded.userId, role: decoded.role });
        res.status(200).json({
            success: true,
            accessToken,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            // Mark token as revoked in database
            await db_1.prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revoked: true },
            });
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const getMe = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true },
        });
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
