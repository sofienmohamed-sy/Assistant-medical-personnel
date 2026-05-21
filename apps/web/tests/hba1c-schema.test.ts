import { describe, it, expect } from 'vitest';
import { classifyHbA1c, HBA1C_MAX, HBA1C_MIN, hba1cMeasurementSchema } from '@shared/measurements';

const base = {
  pathologyType: 'diabeteT2' as const,
  measurementType: 'hba1c' as const,
  unit: '%' as const,
  value: 6.8,
  measuredAt: new Date('2026-01-15T10:00:00Z').toISOString(),
};

describe('hba1cMeasurementSchema', () => {
  it('accepts a well-formed reading', () => {
    expect(hba1cMeasurementSchema.safeParse(base).success).toBe(true);
  });

  it('rejects values below HBA1C_MIN', () => {
    expect(hba1cMeasurementSchema.safeParse({ ...base, value: HBA1C_MIN - 0.1 }).success).toBe(
      false,
    );
  });

  it('rejects values above HBA1C_MAX', () => {
    expect(hba1cMeasurementSchema.safeParse({ ...base, value: HBA1C_MAX + 1 }).success).toBe(false);
  });

  it('rejects NaN / Infinity', () => {
    expect(hba1cMeasurementSchema.safeParse({ ...base, value: Number.NaN }).success).toBe(false);
    expect(
      hba1cMeasurementSchema.safeParse({ ...base, value: Number.POSITIVE_INFINITY }).success,
    ).toBe(false);
  });

  it('rejects a future measuredAt date', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(hba1cMeasurementSchema.safeParse({ ...base, measuredAt: future }).success).toBe(false);
  });

  it('rejects a wrong measurement type', () => {
    expect(
      hba1cMeasurementSchema.safeParse({ ...base, measurementType: 'glycemia' as never }).success,
    ).toBe(false);
  });

  it('caps labName at 100 chars and note at 500', () => {
    expect(hba1cMeasurementSchema.safeParse({ ...base, labName: 'a'.repeat(101) }).success).toBe(
      false,
    );
    expect(hba1cMeasurementSchema.safeParse({ ...base, note: 'a'.repeat(501) }).success).toBe(
      false,
    );
    expect(hba1cMeasurementSchema.safeParse({ ...base, labName: 'a'.repeat(100) }).success).toBe(
      true,
    );
  });

  it('trims optional strings', () => {
    const parsed = hba1cMeasurementSchema.parse({ ...base, labName: '  Cerballiance  ' });
    expect(parsed.labName).toBe('Cerballiance');
  });
});

describe('classifyHbA1c', () => {
  it('returns "unknown" when no personal target is provided', () => {
    expect(classifyHbA1c(6.8, null)).toBe('unknown');
    expect(classifyHbA1c(6.8, undefined)).toBe('unknown');
  });

  it('classifies below the target band as "below-target"', () => {
    // target 7 % — below the −0.5 % band → below
    expect(classifyHbA1c(6.4, 7)).toBe('below-target');
  });

  it('classifies within the target band as "at-target"', () => {
    // target 7 % — anywhere in [6.5, 7] inclusive → at
    expect(classifyHbA1c(7.0, 7)).toBe('at-target');
    expect(classifyHbA1c(6.6, 7)).toBe('at-target');
  });

  it('classifies up to +1.5 % above target as "above-target"', () => {
    expect(classifyHbA1c(7.5, 7)).toBe('above-target');
    expect(classifyHbA1c(8.5, 7)).toBe('above-target');
  });

  it('classifies beyond +1.5 % above target as "far-above-target"', () => {
    expect(classifyHbA1c(9.0, 7)).toBe('far-above-target');
  });

  it('does NOT prescribe a target — caller passes their own', () => {
    // Same value, different targets → different buckets. The app never
    // assumes a target on its own.
    expect(classifyHbA1c(7.5, 7)).toBe('above-target');
    expect(classifyHbA1c(7.5, 8)).toBe('at-target');
  });
});
