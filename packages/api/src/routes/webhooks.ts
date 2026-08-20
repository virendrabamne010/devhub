import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const WebhookSchemas = {
  create: z.object({
    repositoryId: z.string().uuid('Valid repository ID is required'),
    providerId: z.string().min(1, 'Provider ID is required'),
    url: z.string().url('Please provide a valid URL'),
    secret: z.string().optional(),
    events: z.array(z.string()).min(1, 'At least one event is required'),
  }),
  update: z.object({
    url: z.string().url('Please provide a valid URL').optional(),
    secret: z.string().optional(),
    events: z.array(z.string()).min(1).optional(),
    isActive: z.boolean().optional(),
  }),
};

// GET /api/webhooks - List all webhooks
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), async (_req: AuthRequest, res: Response) => {
  try {
    const webhooks = await db.webhook.findMany({
      include: { repository: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ webhooks });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// POST /api/webhooks - Create a webhook
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), validate(WebhookSchemas.create), async (req: AuthRequest, res: Response) => {
  try {
    const { repositoryId, providerId, url, secret, events } = req.body;
    const webhook = await db.webhook.create({
      data: { repositoryId, providerId, url, secret, events: JSON.stringify(events) },
      include: { repository: { select: { id: true, name: true } } },
    });
    return res.status(201).json({ webhook });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// PATCH /api/webhooks/:id - Update a webhook
router.patch('/:id', authenticate, authorize('ADMIN', 'MANAGER'), validate(WebhookSchemas.update), async (req: AuthRequest, res: Response) => {
  try {
    const { url, secret, events, isActive } = req.body;
    const data: any = {};
    if (url) data.url = url;
    if (secret) data.secret = secret;
    if (events) data.events = JSON.stringify(events);
    if (isActive !== undefined) data.isActive = isActive;

    const webhook = await db.webhook.update({
      where: { id: req.params.id },
      data,
      include: { repository: { select: { id: true, name: true } } },
    });
    return res.json({ webhook });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// DELETE /api/webhooks/:id - Delete a webhook
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await db.webhook.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

export default router;