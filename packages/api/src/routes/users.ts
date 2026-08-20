import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate, UserSchemas } from '../middleware/validate';

const router = Router();

// GET /api/users - List all users
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await db.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, avatarUrl: true,
        isActive: true, lastLoginAt: true, createdAt: true,
        _count: { select: { teams: true, commits: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isOwnProfile = req.params.id === req.userId;
    const isPrivileged = req.userRole === 'ADMIN' || req.userRole === 'MANAGER';

    // Full profile for own user or privileged roles
    if (isOwnProfile || isPrivileged) {
      const user = await db.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true, email: true, name: true, role: true, avatarUrl: true,
          isActive: true, createdAt: true, lastLoginAt: true,
          teams: { include: { team: true } },
          _count: { select: { commits: true, deployments: true, comments: true } },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user });
    }

    // Limited public profile for other users
    const user = await db.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, role: true, avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/users/:id - Update user (Admin only)
router.patch('/:id', authenticate, authorize('ADMIN'), validate(UserSchemas.update), async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.userId) {
    // Prevent an admin from deactivating themselves
    if (req.body.isActive === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }
    // Prevent an admin from demoting themselves (to avoid lockout)
    if (req.body.role && req.body.role !== 'ADMIN') {
      return res.status(400).json({ error: 'You cannot demote your own account.' });
    }
  }

  try {
    const { name, role, isActive } = req.body;

    // If trying to change the role of another ADMIN, ensure we don't remove the last admin
    if (role && role !== 'ADMIN') {
      const target = await db.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
      if (target?.role === 'ADMIN') {
        const adminCount = await db.user.count({ where: { role: 'ADMIN', isActive: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot demote the last active administrator.' });
        }
      }
    }

    // If deactivating an admin, ensure not the last active admin
    if (isActive === false) {
      const target = await db.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
      if (target?.role === 'ADMIN') {
        const adminCount = await db.user.count({ where: { role: 'ADMIN', isActive: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot deactivate the last active administrator.' });
        }
      }
    }

    const user = await db.user.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await db.auditLog.create({
      data: {
        userId: req.userId,
        action: 'UPDATE',
        resource: 'User',
        resourceId: user.id,
        metadata: JSON.stringify({ role, isActive }),
      },
    });

    return res.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Soft delete (deactivate)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: 'You cannot deactivate your own account.' });
  }

  try {
    const target = await db.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
    if (target?.role === 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate the last active administrator.' });
      }
    }

    await db.user.update({
      where: { id: req.params.id },
      data: { isActive: false, deletedAt: new Date() },
    });

    await db.auditLog.create({
      data: { userId: req.userId, action: 'DELETE', resource: 'User', resourceId: req.params.id },
    });

    return res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

export default router;
