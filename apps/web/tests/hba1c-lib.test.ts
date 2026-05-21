import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addHbA1cMeasurement } from '@/lib/hba1c';
import type { HbA1cMeasurementInput } from '@shared/measurements';

const addDocMock = vi.fn().mockResolvedValue({ id: 'm-fake' });
const collectionMock = vi.fn().mockReturnValue({ __ref: 'measurements' });
const serverTimestampMock = vi.fn().mockReturnValue({ __sentinel: 'serverTimestamp' });

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDocMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
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

const baseInput: HbA1cMeasurementInput = {
  pathologyType: 'diabeteT2',
  measurementType: 'hba1c',
  unit: '%',
  value: 6.8,
  measuredAt: '2026-01-15T10:00:00.000Z',
};

describe('addHbA1cMeasurement', () => {
  beforeEach(() => {
    addDocMock.mockClear();
  });

  it('omits labName + note when input doesn’t set them', async () => {
    await addHbA1cMeasurement('uid-1', baseInput);
    expect(addDocMock).toHaveBeenCalledTimes(1);
    const payload = addDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect('labName' in payload).toBe(false);
    expect('note' in payload).toBe(false);
    for (const v of Object.values(payload)) {
      expect(v).not.toBeUndefined();
    }
  });

  it('trims and persists labName + note when provided', async () => {
    await addHbA1cMeasurement('uid-1', {
      ...baseInput,
      labName: '  Cerballiance  ',
      note: '  bilan annuel  ',
    });
    const payload = addDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(payload.labName).toBe('Cerballiance');
    expect(payload.note).toBe('bilan annuel');
  });

  it('passes through the required fields with the right shape', async () => {
    await addHbA1cMeasurement('uid-1', baseInput);
    const payload = addDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(payload).toMatchObject({
      pathologyType: 'diabeteT2',
      measurementType: 'hba1c',
      unit: '%',
      value: 6.8,
      measuredAt: '2026-01-15T10:00:00.000Z',
    });
    expect(payload.createdAt).not.toBeUndefined();
  });
});
