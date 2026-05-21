import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore';
import type {
  HbA1cMeasurementInput,
  StoredHbA1cMeasurement,
} from '@shared/measurements';
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

export async function addHbA1cMeasurement(
  uid: string,
  input: HbA1cMeasurementInput,
): Promise<void> {
  // Same defensive payload-building pattern as the other writers: drop empty
  // / undefined fields so Firestore doesn't reject them.
  const payload: Record<string, unknown> = {
    pathologyType: input.pathologyType,
    measurementType: input.measurementType,
    unit: input.unit,
    value: input.value,
    measuredAt: input.measuredAt,
    createdAt: serverTimestamp(),
  };
  const trimmedLab = input.labName?.trim();
  if (trimmedLab) payload.labName = trimmedLab;
  const trimmedNote = input.note?.trim();
  if (trimmedNote) payload.note = trimmedNote;
  await addDoc(measurementsCol(uid), payload);
}

export async function listHbA1cMeasurements(
  uid: string,
  options: { max?: number } = {},
): Promise<StoredHbA1cMeasurement[]> {
  const max = options.max ?? 30;
  // Filtered by measurementType so we don't pull all glycémies just to
  // ignore them client-side.
  const q = query(
    measurementsCol(uid),
    where('measurementType', '==', 'hba1c'),
    orderBy('measuredAt', 'desc'),
    limit(max),
  );
  const snapshot = await getDocs(q);
  const out: StoredHbA1cMeasurement[] = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.measurementType !== 'hba1c' || typeof data.value !== 'number') continue;
    out.push({
      id: docSnap.id,
      pathologyType: 'diabeteT2',
      measurementType: 'hba1c',
      unit: '%',
      value: data.value,
      measuredAt: toIsoString(data.measuredAt),
      labName: typeof data.labName === 'string' ? data.labName : undefined,
      note: typeof data.note === 'string' ? data.note : undefined,
      createdAt: toDate(data.createdAt),
    });
  }
  return out;
}
