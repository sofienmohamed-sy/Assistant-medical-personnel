import { describe, it, expect } from 'vitest';
import { signInSchema, signUpSchema, forgotPasswordSchema } from '@/lib/auth-schemas';

describe('signInSchema', () => {
  it('accepts a well-formed email and any non-empty password', () => {
    const result = signInSchema.safeParse({ email: 'a@b.fr', password: 'whatever' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signInSchema.safeParse({ email: 'not-an-email', password: 'whatever' });
    expect(result.success).toBe(false);
  });

  it('requires a non-empty password', () => {
    const result = signInSchema.safeParse({ email: 'a@b.fr', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('accepts matching strong passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.fr',
      password: 'longenough1',
      confirmPassword: 'longenough1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects passwords shorter than 8 chars', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.fr',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when confirmPassword does not match', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.fr',
      password: 'longenough1',
      confirmPassword: 'longenough2',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.join(' ')).toMatch(/correspondent pas/i);
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.fr' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});
