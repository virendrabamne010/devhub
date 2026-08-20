import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const ApiKeySchemas = {
  create: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    expiresAt: z.string().optional(),
  }),
  update: z.object({
    name: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
  }),
};

// GET /api/apikeys - List all API keys (without hashes)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), async (_req: AuthRequest, res: Response) => {
  try {
    const keys = await db.apiKey.findMany({
      select: { id: true, name: true, prefix: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ apiKeys: keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// POST /api/apikeys - Create a new API key (returns the plaintext key once)
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), validate(ApiKeySchemas.create), async (req: AuthRequest, res: Response) => {
  try {
    const { name, expiresAt } = req.body;
    const rawKey = `dev_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const prefix = rawKey.slice(0, 12);

    const apiKey = await db.apiKey.create({
      data: {
        name,
        keyHash,
        prefix,
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      },
      select: { id: true, name: true, prefix: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
    });

    return res.status(201).json({ apiKey, key: rawKey });
  } catch (error) {
    console.error('Error creating API key:', error);
    return res.status(500).json({ error: 'Failed to create API key' });
  }
});

// PATCH /api/apikeys/:id - Update an API key
router.patch('/:id', authenticate, authorize('ADMIN', 'MANAGER'), validate(ApiKeySchemas.update), async (req: AuthRequest, res: Response) => {
  try {
    const { name, isActive } = req.body;
    const data: any = {};
    if (name) data.name = name;
    if (isActive !== undefined) data.isActive = isActive;

    const apiKey = await db.apiKey.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, prefix: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
    });
    return res.json({ apiKey });
  } catch (error) {
    console.error('Error updating API key:', error);
    return res.status(500).json({ error: 'Failed to update API key' });
  }
});

// DELETE /api/apikeys/:id - Delete an API key
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await db.apiKey.delete({ where: { id: req.params.id } });
    return res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;