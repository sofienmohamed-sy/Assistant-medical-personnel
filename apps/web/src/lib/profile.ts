import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import type { PatientProfile, PatientProfileInput } from '@shared/profile';
import { db } from '@/lib/firebase';

function requireDb(): Firestore {
  if (!db) {
    throw new Error(
      'Firestore is not initialised. Set the VITE_FIREBASE_* environment variables.',
    );
  }
  return db;
}

function profileDocRef(uid: string): DocumentReference {
  return doc(requireDb(), 'users', uid);
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

export async function fetchProfile(uid: string): Promise<PatientProfile | null> {
  const snapshot = await getDoc(profileDocRef(uid));
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data();
  // The profile is considered "complete" only when all required fields are present.
  // Until then we report null so the UI sends the user to onboarding.
  if (
    typeof data.prenom !== 'string' ||
    typeof data.nom !== 'string' ||
    typeof data.dateOfBirth !== 'string' ||
    typeof data.countryOfResidence !== 'string' ||
    typeof data.countryOfOrigin !== 'string' ||
    typeof data.profession !== 'string'
  ) {
    return null;
  }
  return {
    uid,
    prenom: data.prenom,
    nom: data.nom,
    dateOfBirth: data.dateOfBirth,
    countryOfResidence: data.countryOfResidence,
    countryOfOrigin: data.countryOfOrigin,
    profession: data.profession,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as PatientProfile;
}

export async function upsertProfile(uid: string, input: PatientProfileInput): Promise<void> {
  await setDoc(
    profileDocRef(uid),
    {
      ...input,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
