import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    role: z.enum(['Candidate', 'HR']),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters long'),
    company: z.string().min(2, 'Company must be at least 2 characters long'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    requiredSkills: z.array(z.string()).min(1, 'At least one required skill is needed'),
    experience: z.string().min(1, 'Experience is required'),
    salary: z.string().min(1, 'Salary is required'),
    location: z.string().min(1, 'Location is required'),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    company: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    requiredSkills: z.array(z.string()).min(1).optional(),
    experience: z.string().min(1).optional(),
    salary: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
  }),
});
