import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addGlycemiaMeasurement } from '@/lib/measurements';
import type { GlycemiaMeasurementInput } from '@shared/measurements';

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

const baseInput: GlycemiaMeasurementInput = {
  pathologyType: 'diabeteT2',
  measurementType: 'glycemia',
  unit: 'g/L',
  value: 1.25,
  moment: 'fasting',
  measuredAt: '2026-05-21T13:30:00.000Z',
};

describe('addGlycemiaMeasurement', () => {
  beforeEach(() => {
    addDocMock.mockClear();
  });

  it('omits the note field entirely when the input note is undefined', async () => {
    await addGlycemiaMeasurement('uid-1', baseInput);
    expect(addDocMock).toHaveBeenCalledTimes(1);
    const payload = addDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect('note' in payload).toBe(false);
    // No field should ever be sent as undefined — Firestore rejects that.
    for (const value of Object.values(payload)) {
      expect(value).not.toBeUndefined();
    }
  });

  it('omits the note field when the input note is an empty / whitespace string', async () => {
    await addGlycemiaMeasurement('uid-1', { ...baseInput, note: '   ' });
    const payload = addDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect('note' in payload).toBe(false);
  });

  it('includes a trimmed note when one is provided', async () => {
    await addGlycemiaMeasurement('uid-1', { ...baseInput, note: '  après le repas  ' });
    const payload = addDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(payload.note).toBe('après le repas');
  });

  it('passes through the required fields', async () => {
    await addGlycemiaMeasurement('uid-1', baseInput);
    const payload = addDocMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(payload).toMatchObject({
      pathologyType: 'diabeteT2',
      measurementType: 'glycemia',
      unit: 'g/L',
      value: 1.25,
      moment: 'fasting',
      measuredAt: '2026-05-21T13:30:00.000Z',
    });
    // createdAt is a serverTimestamp sentinel, just check it's not undefined.
    expect(payload.createdAt).not.toBeUndefined();
  });
});
