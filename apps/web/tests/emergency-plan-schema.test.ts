import { describe, it, expect } from 'vitest';
import { diabeteEmergencyPlanSchema, pickEmergencyPlanForReason } from '@shared/emergency-plan';

describe('diabeteEmergencyPlanSchema', () => {
  it('accepts an entirely empty object', () => {
    expect(diabeteEmergencyPlanSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a full plan', () => {
    const result = diabeteEmergencyPlanSchema.safeParse({
      hypoSugarSource: '3 morceaux de sucre',
      hypoQuickContact: 'Sophie 06 12 34 56 78',
      hypoNotes: 'Glucagon dans le tiroir',
      hyperRecheckMinutes: 15,
      hyperMedicalContact: 'Dr. Dupont',
      hyperNotes: '',
      ketoEmergencyNumber: '15',
      ketoNearestEmergencyRoom: 'CHU Henri Mondor',
      ketoNotes: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects hyperRecheckMinutes below 5 or above 120', () => {
    expect(diabeteEmergencyPlanSchema.safeParse({ hyperRecheckMinutes: 4 }).success).toBe(false);
    expect(diabeteEmergencyPlanSchema.safeParse({ hyperRecheckMinutes: 121 }).success).toBe(false);
  });

  it('rejects non-integer recheck minutes', () => {
    expect(diabeteEmergencyPlanSchema.safeParse({ hyperRecheckMinutes: 15.5 }).success).toBe(false);
  });

  it('rejects unsafe characters in the emergency phone number', () => {
    expect(
      diabeteEmergencyPlanSchema.safeParse({ ketoEmergencyNumber: '15<script>' }).success,
    ).toBe(false);
    expect(diabeteEmergencyPlanSchema.safeParse({ ketoEmergencyNumber: '15' }).success).toBe(true);
    expect(
      diabeteEmergencyPlanSchema.safeParse({ ketoEmergencyNumber: '+33 1 23 45' }).success,
    ).toBe(true);
  });

  it('rejects strings longer than the per-field cap', () => {
    expect(diabeteEmergencyPlanSchema.safeParse({ hypoSugarSource: 'a'.repeat(201) }).success).toBe(
      false,
    );
    expect(diabeteEmergencyPlanSchema.safeParse({ hypoNotes: 'a'.repeat(1001) }).success).toBe(
      false,
    );
  });

  it('trims whitespace on string fields', () => {
    const parsed = diabeteEmergencyPlanSchema.parse({ hypoSugarSource: '  jus de fruit  ' });
    expect(parsed.hypoSugarSource).toBe('jus de fruit');
  });
});

describe('pickEmergencyPlanForReason', () => {
  it('returns undefined when no plan is provided', () => {
    expect(pickEmergencyPlanForReason('severe-hypo', null)).toBeUndefined();
    expect(pickEmergencyPlanForReason('severe-hypo', undefined)).toBeUndefined();
  });

  it('returns the hypoglycemia slice for severe-hypo and hypo-resucrage reasons', () => {
    const plan = { hypoSugarSource: '3 morceaux', hypoQuickContact: 'Sophie' };
    const a = pickEmergencyPlanForReason('severe-hypo', plan);
    const b = pickEmergencyPlanForReason('hypo-resucrage', plan);
    expect(a?.scenario).toBe('hypoglycemia');
    expect(b?.scenario).toBe('hypoglycemia');
    expect(a?.lines).toHaveLength(2);
    expect(a?.lines[0]).toEqual({ label: 'Resucrage', value: '3 morceaux' });
  });

  it('returns the hyperglycemia slice for fasting / postmeal high reasons', () => {
    const plan = { hyperRecheckMinutes: 20, hyperMedicalContact: 'Dr. X' };
    for (const reason of [
      'fasting-high',
      'fasting-very-high',
      'postmeal-high',
      'postmeal-very-high',
    ]) {
      const slice = pickEmergencyPlanForReason(reason, plan);
      expect(slice?.scenario).toBe('hyperglycemia');
      expect(slice?.lines.find((l) => l.label === 'Recontrôle')?.value).toBe('20 minutes');
    }
  });

  it('returns the acidocetose slice for severe-hyper', () => {
    const plan = { ketoEmergencyNumber: '+33 1 23 45 67 89' };
    const slice = pickEmergencyPlanForReason('severe-hyper', plan);
    expect(slice?.scenario).toBe('acidocetose');
    expect(slice?.lines[0]?.value).toBe('+33 1 23 45 67 89');
  });

  it('returns undefined when no field for the matching scenario is filled in', () => {
    const plan = { hypoSugarSource: '3 morceaux' };
    expect(pickEmergencyPlanForReason('fasting-very-high', plan)).toBeUndefined();
    expect(pickEmergencyPlanForReason('severe-hyper', plan)).toBeUndefined();
  });

  it('returns undefined for reasons that don’t map to any scenario', () => {
    const plan = { hypoSugarSource: '3 morceaux', hyperRecheckMinutes: 15 };
    expect(pickEmergencyPlanForReason('in-target', plan)).toBeUndefined();
    expect(pickEmergencyPlanForReason('fasting-above-target', plan)).toBeUndefined();
    expect(pickEmergencyPlanForReason('postmeal-above-target', plan)).toBeUndefined();
  });
});
