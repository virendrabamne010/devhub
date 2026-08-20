import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Authentication Utilities', () => {
  it('should hash passwords correctly with bcrypt', async () => {
    const hash = await bcrypt.hash('Test@1234', 12);
    expect(hash).toBeDefined();
    expect(hash).not.toBe('Test@1234');

    const isValid = await bcrypt.compare('Test@1234', hash);
    expect(isValid).toBe(true);

    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should sign and verify JWT tokens with correct payload', () => {
    const secret = 'test-secret-key';
    const token = jwt.sign({ userId: 'user-123', role: 'ADMIN' }, secret, { expiresIn: '7d' });

    const decoded = jwt.verify(token, secret) as { userId: string; role: string };
    expect(decoded.userId).toBe('user-123');
    expect(decoded.role).toBe('ADMIN');
  });

  it('should reject tokens signed with a different secret', () => {
    const token = jwt.sign({ userId: 'user-123', role: 'ADMIN' }, 'wrong-secret');

    expect(() => jwt.verify(token, 'correct-secret')).toThrow();
  });

  it('should reject expired tokens', async () => {
    const secret = 'test-secret-key';
    const token = jwt.sign({ userId: 'user-123', role: 'ADMIN' }, secret, { expiresIn: '-10s' });

    expect(() => jwt.verify(token, secret)).toThrow('expired');
  });
});