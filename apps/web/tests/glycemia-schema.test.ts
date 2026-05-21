import { describe, it, expect } from 'vitest';
import { GLYCEMIA_MOMENTS, glycemiaMeasurementSchema } from '@shared/measurements';

const base = {
  pathologyType: 'diabeteT2' as const,
  measurementType: 'glycemia' as const,
  unit: 'g/L' as const,
  value: 1.25,
  moment: 'fasting' as const,
  measuredAt: new Date('2026-01-15T08:30:00Z').toISOString(),
};

describe('glycemiaMeasurementSchema', () => {
  it('accepts a well-formed measurement', () => {
    expect(glycemiaMeasurementSchema.safeParse(base).success).toBe(true);
  });

  it('accepts all moment codes', () => {
    for (const m of GLYCEMIA_MOMENTS) {
      expect(glycemiaMeasurementSchema.safeParse({ ...base, moment: m }).success).toBe(true);
    }
  });

  it('rejects a value below 0.1 g/L', () => {
    expect(glycemiaMeasurementSchema.safeParse({ ...base, value: 0.05 }).success).toBe(false);
  });

  it('rejects a value above 10 g/L', () => {
    expect(glycemiaMeasurementSchema.safeParse({ ...base, value: 12 }).success).toBe(false);
  });

  it('rejects NaN / non-finite values', () => {
    expect(glycemiaMeasurementSchema.safeParse({ ...base, value: Number.NaN }).success).toBe(false);
    expect(
      glycemiaMeasurementSchema.safeParse({ ...base, value: Number.POSITIVE_INFINITY }).success,
    ).toBe(false);
  });

  it('rejects an unknown moment code', () => {
    expect(glycemiaMeasurementSchema.safeParse({ ...base, moment: 'lunch' as never }).success).toBe(
      false,
    );
  });

  it('rejects a future measuredAt date', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(glycemiaMeasurementSchema.safeParse({ ...base, measuredAt: future }).success).toBe(
      false,
    );
  });

  it('rejects an unparseable measuredAt string', () => {
    expect(glycemiaMeasurementSchema.safeParse({ ...base, measuredAt: 'not-a-date' }).success).toBe(
      false,
    );
  });

  it('rejects a wrong pathology / measurement type', () => {
    expect(
      glycemiaMeasurementSchema.safeParse({ ...base, pathologyType: 'hta' as never }).success,
    ).toBe(false);
    expect(
      glycemiaMeasurementSchema.safeParse({ ...base, measurementType: 'tension' as never }).success,
    ).toBe(false);
  });

  it('rejects a note longer than 500 chars', () => {
    expect(glycemiaMeasurementSchema.safeParse({ ...base, note: 'a'.repeat(501) }).success).toBe(
      false,
    );
    expect(glycemiaMeasurementSchema.safeParse({ ...base, note: 'a'.repeat(500) }).success).toBe(
      true,
    );
  });
});
