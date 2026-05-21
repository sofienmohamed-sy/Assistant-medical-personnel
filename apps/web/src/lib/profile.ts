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
  ActivePathologies,
  AsthmeProfile,
  DiabeteT2Profile,
  HtaProfile,
  PatientProfile,
  PatientProfileInput,
  PathologiesFormInput,
} from '@shared/index';
import {
  ASTHME_PROFILES,
  DIABETE_T2_PROFILES,
  HTA_PROFILES,
} from '@shared/pathologies';
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

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

function parsePathologies(raw: unknown): ActivePathologies {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: ActivePathologies = {};

  const diabete = r.diabeteT2 as Record<string, unknown> | undefined;
  if (diabete && isOneOf(diabete.treatmentProfile, DIABETE_T2_PROFILES)) {
    out.diabeteT2 = {
      treatmentProfile: diabete.treatmentProfile as DiabeteT2Profile,
      addedAt: toDate(diabete.addedAt),
    };
  }

  const hta = r.hta as Record<string, unknown> | undefined;
  if (hta && isOneOf(hta.treatmentProfile, HTA_PROFILES)) {
    out.hta = {
      treatmentProfile: hta.treatmentProfile as HtaProfile,
      addedAt: toDate(hta.addedAt),
    };
  }

  const asthme = r.asthme as Record<string, unknown> | undefined;
  if (asthme && isOneOf(asthme.treatmentProfile, ASTHME_PROFILES)) {
    out.asthme = {
      treatmentProfile: asthme.treatmentProfile as AsthmeProfile,
      addedAt: toDate(asthme.addedAt),
    };
  }

  return out;
}

export interface UserDoc {
  profile: PatientProfile | null;
  pathologies: ActivePathologies;
  pathologiesReviewedAt: Date | null;
}

export async function fetchUserDoc(uid: string): Promise<UserDoc> {
  const snapshot = await getDoc(profileDocRef(uid));
  if (!snapshot.exists()) {
    return { profile: null, pathologies: {}, pathologiesReviewedAt: null };
  }
  const data = snapshot.data();
  const profileComplete =
    typeof data.prenom === 'string' &&
    typeof data.nom === 'string' &&
    typeof data.dateOfBirth === 'string' &&
    typeof data.countryOfResidence === 'string' &&
    typeof data.countryOfOrigin === 'string' &&
    typeof data.profession === 'string';

  return {
    profile: profileComplete
      ? ({
          uid,
          prenom: data.prenom,
          nom: data.nom,
          dateOfBirth: data.dateOfBirth,
          countryOfResidence: data.countryOfResidence,
          countryOfOrigin: data.countryOfOrigin,
          profession: data.profession,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as PatientProfile)
      : null,
    pathologies: parsePathologies(data.pathologies),
    pathologiesReviewedAt: data.pathologiesReviewedAt
      ? toDate(data.pathologiesReviewedAt)
      : null,
  };
}

export async function fetchProfile(uid: string): Promise<PatientProfile | null> {
  const doc = await fetchUserDoc(uid);
  return doc.profile;
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

export async function upsertPathologies(
  uid: string,
  input: PathologiesFormInput,
): Promise<void> {
  // Build the storage shape: drop entries that the user unchecked, stamp each
  // active one with its current treatment profile + an addedAt timestamp. We
  // overwrite the whole `pathologies` map on purpose so unchecks actually take
  // effect (a merge:true with undefined wouldn't delete keys).
  const pathologies: Record<string, unknown> = {};
  if (input.diabeteT2) {
    pathologies.diabeteT2 = {
      treatmentProfile: input.diabeteT2.treatmentProfile,
      addedAt: serverTimestamp(),
    };
  }
  if (input.hta) {
    pathologies.hta = {
      treatmentProfile: input.hta.treatmentProfile,
      addedAt: serverTimestamp(),
    };
  }
  if (input.asthme) {
    pathologies.asthme = {
      treatmentProfile: input.asthme.treatmentProfile,
      addedAt: serverTimestamp(),
    };
  }

  await setDoc(
    profileDocRef(uid),
    {
      pathologies,
      pathologiesReviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
