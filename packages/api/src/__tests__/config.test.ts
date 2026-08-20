import { describe, it, expect } from '@jest/globals';
import { parseCorsOrigins } from '../config';

describe('Configuration helpers', () => {
  it('parses comma-separated CORS origins', () => {
    expect(parseCorsOrigins('https://app.example.com, https://admin.example.com')).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('trims whitespace and drops empty values', () => {
    expect(parseCorsOrigins(' https://app.example.com , , https://admin.example.com ')).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('returns the default origin when no value is provided', () => {
    expect(parseCorsOrigins('')).toEqual(['http://localhost:5173']);
  });
});
