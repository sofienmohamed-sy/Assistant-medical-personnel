import { describe, it, expect } from 'vitest';
import {
  ASTHME_PROFILES,
  DIABETE_T2_PROFILES,
  HTA_PROFILES,
  PATHOLOGY_TYPES,
  pathologiesFormSchema,
  pathologyActivationSchema,
} from '@shared/pathologies';

describe('PATHOLOGY_TYPES', () => {
  it('lists the v1 pathologies', () => {
    expect(PATHOLOGY_TYPES).toEqual(['diabeteT2', 'hta', 'asthme']);
  });
});

describe('pathologyActivationSchema', () => {
  it('accepts diabetes T2 with a valid profile', () => {
    const result = pathologyActivationSchema.safeParse({
      type: 'diabeteT2',
      treatmentProfile: 'C',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown diabetes profile', () => {
    const result = pathologyActivationSchema.safeParse({
      type: 'diabeteT2',
      treatmentProfile: 'Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mixing diabetes type with an HTA profile', () => {
    const result = pathologyActivationSchema.safeParse({
      type: 'diabeteT2',
      treatmentProfile: 'monotherapie',
    });
    expect(result.success).toBe(false);
  });

  it('accepts every declared profile per pathology type', () => {
    for (const p of DIABETE_T2_PROFILES) {
      expect(
        pathologyActivationSchema.safeParse({ type: 'diabeteT2', treatmentProfile: p }).success,
      ).toBe(true);
    }
    for (const p of HTA_PROFILES) {
      expect(
        pathologyActivationSchema.safeParse({ type: 'hta', treatmentProfile: p }).success,
      ).toBe(true);
    }
    for (const p of ASTHME_PROFILES) {
      expect(
        pathologyActivationSchema.safeParse({ type: 'asthme', treatmentProfile: p }).success,
      ).toBe(true);
    }
  });
});

describe('pathologiesFormSchema', () => {
  it('accepts an empty form (no active pathology)', () => {
    expect(pathologiesFormSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a single pathology with a valid profile', () => {
    expect(pathologiesFormSchema.safeParse({ diabeteT2: { treatmentProfile: 'A' } }).success).toBe(
      true,
    );
  });

  it('accepts all three pathologies at once', () => {
    expect(
      pathologiesFormSchema.safeParse({
        diabeteT2: { treatmentProfile: 'B' },
        hta: { treatmentProfile: 'monotherapie' },
        asthme: { treatmentProfile: 'palier3' },
      }).success,
    ).toBe(true);
  });

  it('rejects a pathology entry missing its profile', () => {
    const result = pathologiesFormSchema.safeParse({
      diabeteT2: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects a wrong profile value for the pathology', () => {
    const result = pathologiesFormSchema.safeParse({
      asthme: { treatmentProfile: 'A' },
    });
    expect(result.success).toBe(false);
  });
});
