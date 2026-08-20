import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

describe('Security validation', () => {
  it('accepts a strong login payload', () => {
    const result = schema.safeParse({ email: 'user@example.com', password: 'Strong@123' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = schema.safeParse({ email: 'bad-email', password: 'Strong@123' });
    expect(result.success).toBe(false);
  });
});
