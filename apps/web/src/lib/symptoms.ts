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
import type {
  DiabeteSymptomCode,
  DiabeteSymptomReportInput,
  StoredDiabeteSymptomReport,
} from '@shared/symptoms';
import { DIABETE_SYMPTOM_CODES } from '@shared/symptoms';
import { db } from '@/lib/firebase';

function requireDb(): Firestore {
  if (!db) {
    throw new Error(
      'Firestore is not initialised. Set the VITE_FIREBASE_* environment variables.',
    );
  }
  return db;
}

function reportsCol(uid: string) {
  return collection(requireDb(), 'users', uid, 'symptom-reports');
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

const SYMPTOM_CODE_SET = new Set<string>(DIABETE_SYMPTOM_CODES);

export async function addDiabeteSymptomReport(
  uid: string,
  input: DiabeteSymptomReportInput,
): Promise<void> {
  // Build the payload explicitly. Drop undefined values so Firestore's
  // addDoc doesn't reject them (same pattern as glycémie and plan-urgence).
  const payload: Record<string, unknown> = {
    pathologyType: input.pathologyType,
    symptoms: input.symptoms,
    reportedAt: input.reportedAt,
    createdAt: serverTimestamp(),
  };
  const trimmedNote = input.note?.trim();
  if (trimmedNote) payload.note = trimmedNote;
  await addDoc(reportsCol(uid), payload);
}

export async function listDiabeteSymptomReports(
  uid: string,
  options: { max?: number } = {},
): Promise<StoredDiabeteSymptomReport[]> {
  const max = options.max ?? 50;
  const q = query(reportsCol(uid), orderBy('reportedAt', 'desc'), limit(max));
  const snapshot = await getDocs(q);
  const out: StoredDiabeteSymptomReport[] = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.pathologyType !== 'diabeteT2' || !Array.isArray(data.symptoms)) continue;
    const validSymptoms: DiabeteSymptomCode[] = [];
    for (const s of data.symptoms) {
      if (typeof s === 'string' && SYMPTOM_CODE_SET.has(s)) {
        validSymptoms.push(s as DiabeteSymptomCode);
      }
    }
    if (validSymptoms.length === 0) continue;
    out.push({
      id: docSnap.id,
      pathologyType: 'diabeteT2',
      symptoms: validSymptoms,
      reportedAt: toIsoString(data.reportedAt),
      note: typeof data.note === 'string' ? data.note : undefined,
      createdAt: toDate(data.createdAt),
    });
  }
  return out;
}
