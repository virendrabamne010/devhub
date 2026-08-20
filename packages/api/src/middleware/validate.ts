import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      (req as any)[source] = data;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ error: 'Validation failed', details: errors });
      } else {
        res.status(400).json({ error: 'Invalid input' });
      }
    }
  };
}

export const AuthSchemas = {
  register: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  }),
  login: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  changePassword: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
};

export const UserSchemas = {
  update: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER']).optional(),
    isActive: z.boolean().optional(),
  }),
};

export const TeamSchemas = {
  create: z.object({
    name: z.string().min(2, 'Team name must be at least 2 characters'),
    description: z.string().optional(),
  }),
  addMember: z.object({
    userId: z.string().uuid('Valid user ID is required'),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
  }),
};

export const ProjectSchemas = {
  create: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters'),
    description: z.string().optional(),
    teamId: z.string().uuid('Valid team ID is required'),
  }),
  update: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').optional(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
  }),
};

export const DeploymentSchemas = {
  create: z.object({
    repositoryId: z.string().uuid('Valid repository ID is required'),
    environmentId: z.string().uuid('Valid environment ID is required'),
    commitId: z.string().uuid().optional(),
    version: z.string().optional(),
  }),
  update: z.object({
    status: z
      .enum(['PENDING', 'QUEUED', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'ROLLED_BACK', 'CANCELLED'])
      .optional(),
    logs: z.string().optional(),
  }),
  list: z.object({
    projectId: z.string().uuid().optional(),
    repositoryId: z.string().uuid().optional(),
    environmentId: z.string().uuid().optional(),
    status: z.string().optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
};

export const MonitoringSchemas = {
  createTarget: z.object({
    environmentId: z.string().uuid('Valid environment ID is required'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    url: z.string().url('Please provide a valid URL'),
    method: z.enum(['GET', 'POST', 'HEAD', 'PUT', 'DELETE']).default('GET'),
    checkInterval: z.number().int().min(10, 'Check interval must be at least 10 seconds').max(86400).default(60),
    timeout: z.number().int().min(1000, 'Timeout must be at least 1000ms').max(60000).default(5000),
  }),
  createPing: z.object({
    targetId: z.string().uuid('Valid target ID is required'),
    status: z.number().int(),
    responseTimeMs: z.number().int().nonnegative(),
    isUp: z.boolean(),
    errorMessage: z.string().optional(),
  }),
  listPings: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
  }),
  listTargets: z.object({
    environmentId: z.string().uuid().optional(),
  }),
};
