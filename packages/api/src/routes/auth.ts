import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '@devhub/database';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, AuthSchemas } from '../middleware/validate';

const router = Router();

function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
}

async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.refreshToken.create({ data: { userId, token, expiresAt } });
  return token;
}

// POST /api/auth/register
router.post('/register', validate(AuthSchemas.register), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { email, passwordHash, name, role: 'DEVELOPER' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = signAccessToken(user.id, user.role);
    const refreshToken = await issueRefreshToken(user.id);

    await db.auditLog.create({
      data: { userId: user.id, action: 'REGISTER', resource: 'User', resourceId: user.id },
    });

    return res.status(201).json({ user, token, refreshToken });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', validate(AuthSchemas.login), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const token = signAccessToken(user.id, user.role);
    const refreshToken = await issueRefreshToken(user.id);

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await db.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', resource: 'Session', metadata: JSON.stringify({ ip: req.ip }) },
    });

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, email: true, name: true, role: true, avatarUrl: true,
        isActive: true, emailVerified: true, lastLoginAt: true, createdAt: true,
        _count: { select: { teams: true, notifications: { where: { isRead: false } } } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/auth/refresh - Exchange a valid refresh token for a new access token (with rotation)
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const stored = await db.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await db.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    // Rotate: revoke the current refresh token and issue a new one
    await db.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });
    const newRefreshToken = await issueRefreshToken(user.id);

    const token = signAccessToken(user.id, user.role);
    return res.json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// POST /api/auth/logout - Revoke the refresh token
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.userId },
        data: { isRevoked: true },
      });
    }
    await db.auditLog.create({
      data: { userId: req.userId, action: 'LOGOUT', resource: 'Session' },
    });
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, validate(AuthSchemas.changePassword), async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await db.user.findUnique({ where: { id: req.userId } });
    if (!user || !user.passwordHash) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid old password' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });
    
    await db.auditLog.create({
      data: { userId: user.id, action: 'UPDATE_PASSWORD', resource: 'User', resourceId: user.id },
    });

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/auth/verify-email?token=... - Verify a user's email address
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await db.user.findFirst({ where: { verificationToken: token as string } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Failed to verify email' });
  }
});

export default router;
