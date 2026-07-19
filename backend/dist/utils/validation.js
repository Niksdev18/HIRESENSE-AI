"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobSchema = exports.createJobSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
        role: zod_1.z.enum(['Candidate', 'HR']),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.createJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2, 'Title must be at least 2 characters long'),
        company: zod_1.z.string().min(2, 'Company must be at least 2 characters long'),
        description: zod_1.z.string().min(10, 'Description must be at least 10 characters long'),
        requiredSkills: zod_1.z.array(zod_1.z.string()).min(1, 'At least one required skill is needed'),
        experience: zod_1.z.string().min(1, 'Experience is required'),
        salary: zod_1.z.string().min(1, 'Salary is required'),
        location: zod_1.z.string().min(1, 'Location is required'),
    }),
});
exports.updateJobSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        company: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().min(10).optional(),
        requiredSkills: zod_1.z.array(zod_1.z.string()).min(1).optional(),
        experience: zod_1.z.string().min(1).optional(),
        salary: zod_1.z.string().min(1).optional(),
        location: zod_1.z.string().min(1).optional(),
    }),
});
