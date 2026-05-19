import { describe, it, expect } from 'vitest';
import { patientProfileSchema, COUNTRY_CODES } from '@shared/profile';

const baseValid = {
  prenom: 'Sofien',
  nom: 'Mohamed',
  dateOfBirth: '1990-05-12',
  countryOfResidence: 'FR' as const,
  countryOfOrigin: 'FR' as const,
  profession: 'développeur',
};

describe('patientProfileSchema', () => {
  it('accepts a well-formed profile', () => {
    const result = patientProfileSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
  });

  it('rejects empty prenom and nom', () => {
    expect(patientProfileSchema.safeParse({ ...baseValid, prenom: '' }).success).toBe(false);
    expect(patientProfileSchema.safeParse({ ...baseValid, nom: '   ' }).success).toBe(false);
  });

  it('rejects malformed date strings', () => {
    expect(
      patientProfileSchema.safeParse({ ...baseValid, dateOfBirth: '12-05-1990' }).success,
    ).toBe(false);
    expect(
      patientProfileSchema.safeParse({ ...baseValid, dateOfBirth: '1990/05/12' }).success,
    ).toBe(false);
  });

  it('rejects future dates of birth', () => {
    expect(
      patientProfileSchema.safeParse({ ...baseValid, dateOfBirth: '2999-01-01' }).success,
    ).toBe(false);
  });

  it('rejects dates before 1900', () => {
    expect(
      patientProfileSchema.safeParse({ ...baseValid, dateOfBirth: '1850-01-01' }).success,
    ).toBe(false);
  });

  it('rejects unknown country codes', () => {
    expect(patientProfileSchema.safeParse({ ...baseValid, countryOfResidence: 'XX' }).success).toBe(
      false,
    );
  });

  it('accepts all declared country codes', () => {
    for (const code of COUNTRY_CODES) {
      expect(
        patientProfileSchema.safeParse({
          ...baseValid,
          countryOfResidence: code,
          countryOfOrigin: code,
        }).success,
      ).toBe(true);
    }
  });

  it('rejects empty profession', () => {
    expect(patientProfileSchema.safeParse({ ...baseValid, profession: '' }).success).toBe(false);
  });

  it('trims whitespace on string fields', () => {
    const parsed = patientProfileSchema.parse({ ...baseValid, prenom: '  Sofien ' });
    expect(parsed.prenom).toBe('Sofien');
  });
});
