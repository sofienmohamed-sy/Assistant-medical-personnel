import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertDiabeteEmergencyPlan } from '@/lib/emergency-plan';

const setDocMock = vi.fn().mockResolvedValue(undefined);
const docMock = vi.fn().mockReturnValue({ __ref: 'planRef' });
const serverTimestampMock = vi.fn().mockReturnValue({ __sentinel: 'serverTimestamp' });

vi.mock('firebase/firestore', () => ({
  setDoc: (...args: unknown[]) => setDocMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: vi.fn(),
  serverTimestamp: () => serverTimestampMock(),
  Timestamp: class {
    toDate() {
      return new Date();
    }
  },
}));

vi.mock('@/lib/firebase', () => ({
  db: { __mock: true },
}));

describe('upsertDiabeteEmergencyPlan', () => {
  beforeEach(() => {
    setDocMock.mockClear();
  });

  it('never sends undefined fields to Firestore', async () => {
    await upsertDiabeteEmergencyPlan('uid-1', {
      hypoSugarSource: 'sucre',
      hypoQuickContact: undefined,
      hyperRecheckMinutes: 15,
      ketoEmergencyNumber: undefined,
    });
    const payload = setDocMock.mock.calls[0]![1] as Record<string, unknown>;
    for (const v of Object.values(payload)) {
      expect(v).not.toBeUndefined();
    }
    expect('hypoQuickContact' in payload).toBe(false);
    expect('ketoEmergencyNumber' in payload).toBe(false);
  });

  it('drops empty / whitespace-only strings instead of persisting them', async () => {
    await upsertDiabeteEmergencyPlan('uid-1', {
      hypoSugarSource: '   ',
      hyperMedicalContact: '',
      hyperRecheckMinutes: 15,
    });
    const payload = setDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect('hypoSugarSource' in payload).toBe(false);
    expect('hyperMedicalContact' in payload).toBe(false);
    expect(payload.hyperRecheckMinutes).toBe(15);
  });

  it('trims non-empty strings', async () => {
    await upsertDiabeteEmergencyPlan('uid-1', {
      hypoSugarSource: '  3 morceaux  ',
    });
    const payload = setDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(payload.hypoSugarSource).toBe('3 morceaux');
  });

  it('always stamps updatedAt', async () => {
    await upsertDiabeteEmergencyPlan('uid-1', {});
    const payload = setDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(payload.updatedAt).toBeDefined();
  });
});
