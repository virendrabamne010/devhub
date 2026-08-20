import { describe, it, expect } from '@jest/globals';
import { AuthSchemas, TeamSchemas, ProjectSchemas, DeploymentSchemas, MonitoringSchemas } from '../middleware/validate';

describe('Zod Validation Schemas', () => {
  describe('AuthSchemas.register', () => {
    it('should accept valid registration input', () => {
      const result = AuthSchemas.register.safeParse({
        email: 'user@example.com',
        password: 'Strong@123',
        name: 'John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = AuthSchemas.register.safeParse({
        email: 'not-an-email',
        password: 'Strong@123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak passwords (no uppercase)', () => {
      const result = AuthSchemas.register.safeParse({
        email: 'user@example.com',
        password: 'lowercase123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short passwords', () => {
      const result = AuthSchemas.register.safeParse({
        email: 'user@example.com',
        password: 'Short1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TeamSchemas.addMember', () => {
    it('should accept a valid UUID', () => {
      const result = TeamSchemas.addMember.safeParse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'MEMBER',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const result = TeamSchemas.addMember.safeParse({
        userId: 'not-a-uuid',
        role: 'MEMBER',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DeploymentSchemas.create', () => {
    it('should accept valid deployment input', () => {
      const result = DeploymentSchemas.create.safeParse({
        repositoryId: '123e4567-e89b-12d3-a456-426614174000',
        environmentId: '123e4567-e89b-12d3-a456-426614174001',
        version: 'v1.0.0',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid repositoryId', () => {
      const result = DeploymentSchemas.create.safeParse({
        repositoryId: 'bad-id',
        environmentId: '123e4567-e89b-12d3-a456-426614174001',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('MonitoringSchemas.createTarget', () => {
    it('should accept valid monitoring target input', () => {
      const result = MonitoringSchemas.createTarget.safeParse({
        environmentId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Production API',
        url: 'https://api.example.com/health',
        method: 'GET',
        checkInterval: 60,
        timeout: 5000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const result = MonitoringSchemas.createTarget.safeParse({
        environmentId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Bad URL',
        url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject check intervals below 10 seconds', () => {
      const result = MonitoringSchemas.createTarget.safeParse({
        environmentId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Too Fast',
        url: 'https://example.com',
        checkInterval: 5,
      });
      expect(result.success).toBe(false);
    });
  });
});