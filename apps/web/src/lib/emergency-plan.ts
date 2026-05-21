import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import type {
  DiabeteEmergencyPlanInput,
  StoredDiabeteEmergencyPlan,
} from '@shared/emergency-plan';
import { db } from '@/lib/firebase';

function requireDb(): Firestore {
  if (!db) {
    throw new Error(
      'Firestore is not initialised. Set the VITE_FIREBASE_* environment variables.',
    );
  }
  return db;
}

function planDocRef(uid: string): DocumentReference {
  return doc(requireDb(), 'users', uid, 'diabete', 'plan-urgence');
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

export async function fetchDiabeteEmergencyPlan(
  uid: string,
): Promise<StoredDiabeteEmergencyPlan | null> {
  const snapshot = await getDoc(planDocRef(uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    hypoSugarSource: typeof data.hypoSugarSource === 'string' ? data.hypoSugarSource : undefined,
    hypoQuickContact: typeof data.hypoQuickContact === 'string' ? data.hypoQuickContact : undefined,
    hypoNotes: typeof data.hypoNotes === 'string' ? data.hypoNotes : undefined,
    hyperRecheckMinutes:
      typeof data.hyperRecheckMinutes === 'number' ? data.hyperRecheckMinutes : undefined,
    hyperMedicalContact:
      typeof data.hyperMedicalContact === 'string' ? data.hyperMedicalContact : undefined,
    hyperNotes: typeof data.hyperNotes === 'string' ? data.hyperNotes : undefined,
    ketoEmergencyNumber:
      typeof data.ketoEmergencyNumber === 'string' ? data.ketoEmergencyNumber : undefined,
    ketoNearestEmergencyRoom:
      typeof data.ketoNearestEmergencyRoom === 'string' ? data.ketoNearestEmergencyRoom : undefined,
    ketoNotes: typeof data.ketoNotes === 'string' ? data.ketoNotes : undefined,
    updatedAt: toDate(data.updatedAt),
  };
}

export async function upsertDiabeteEmergencyPlan(
  uid: string,
  input: DiabeteEmergencyPlanInput,
): Promise<void> {
  // Firestore rejects `undefined` field values, so omit keys whose user value
  // is undefined rather than letting them through with `...spread`.
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  const setIfDefined = (key: keyof DiabeteEmergencyPlanInput) => {
    const v = input[key];
    if (v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '')) {
      payload[key] = typeof v === 'string' ? v.trim() : v;
    }
  };
  setIfDefined('hypoSugarSource');
  setIfDefined('hypoQuickContact');
  setIfDefined('hypoNotes');
  setIfDefined('hyperRecheckMinutes');
  setIfDefined('hyperMedicalContact');
  setIfDefined('hyperNotes');
  setIfDefined('ketoEmergencyNumber');
  setIfDefined('ketoNearestEmergencyRoom');
  setIfDefined('ketoNotes');

  // Note: setDoc without merge here so a field cleared by the user really
  // disappears from the doc on next save (no stale leftovers). The list of
  // fields above is closed, so we're not nuking other unrelated data.
  await setDoc(planDocRef(uid), payload);
}
