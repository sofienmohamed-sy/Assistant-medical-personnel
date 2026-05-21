import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import type { GlycemiaMeasurementInput, StoredMeasurement } from '@shared/measurements';
import { GLYCEMIA_MOMENTS } from '@shared/measurements';
import { db } from '@/lib/firebase';

function requireDb(): Firestore {
  if (!db) {
    throw new Error(
      'Firestore is not initialised. Set the VITE_FIREBASE_* environment variables.',
    );
  }
  return db;
}

function measurementsCol(uid: string) {
  return collection(requireDb(), 'users', uid, 'measurements');
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function toIsoString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

export async function addGlycemiaMeasurement(
  uid: string,
  input: GlycemiaMeasurementInput,
): Promise<void> {
  // Build the payload explicitly. Firestore's addDoc rejects fields whose
  // value is `undefined`, so we only include `note` when the caller provided
  // a non-empty one. Omitting the key entirely is different from setting it
  // to undefined: the latter throws "Unsupported field value: undefined".
  const payload: Record<string, unknown> = {
    pathologyType: input.pathologyType,
    measurementType: input.measurementType,
    unit: input.unit,
    value: input.value,
    moment: input.moment,
    measuredAt: input.measuredAt,
    createdAt: serverTimestamp(),
  };
  const trimmedNote = input.note?.trim();
  if (trimmedNote) {
    payload.note = trimmedNote;
  }
  await addDoc(measurementsCol(uid), payload);
}

export async function listGlycemiaMeasurements(
  uid: string,
  options: { max?: number } = {},
): Promise<StoredMeasurement[]> {
  // Most-recent first; capped client-side. We deliberately don't paginate yet —
  // a user logging 4-6 times/day takes years to accumulate 1000 entries.
  const max = options.max ?? 50;
  const q = query(measurementsCol(uid), orderBy('measuredAt', 'desc'), limit(max));
  const snapshot = await getDocs(q);
  const out: StoredMeasurement[] = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (
      data.measurementType !== 'glycemia' ||
      typeof data.value !== 'number' ||
      typeof data.moment !== 'string' ||
      !(GLYCEMIA_MOMENTS as readonly string[]).includes(data.moment)
    ) {
      continue;
    }
    out.push({
      id: docSnap.id,
      pathologyType: 'diabeteT2',
      measurementType: 'glycemia',
      value: data.value,
      unit: 'g/L',
      moment: data.moment as StoredMeasurement['moment'],
      measuredAt: toIsoString(data.measuredAt),
      note: typeof data.note === 'string' ? data.note : undefined,
      createdAt: toDate(data.createdAt),
    });
  }
  return out;
}
