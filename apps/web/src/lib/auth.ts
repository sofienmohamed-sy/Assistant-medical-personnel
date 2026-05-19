import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

function requireAuth(): Auth {
  if (!auth) {
    throw new Error(
      'Firebase Auth is not initialised. Set the VITE_FIREBASE_* environment variables.',
    );
  }
  return auth;
}

export type AuthErrorCode =
  | 'auth/email-already-in-use'
  | 'auth/invalid-email'
  | 'auth/invalid-credential'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/weak-password'
  | 'auth/too-many-requests'
  | 'auth/network-request-failed'
  | 'auth/missing-password'
  | 'auth/operation-not-allowed'
  | (string & {});

const FRENCH_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Cette adresse e-mail est déjà utilisée.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/invalid-credential': 'Identifiants invalides.',
  'auth/user-not-found': 'Aucun compte ne correspond à cette adresse e-mail.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 8 caractères.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/network-request-failed': 'Erreur réseau. Vérifie ta connexion et réessaie.',
  'auth/missing-password': 'Le mot de passe est requis.',
  'auth/operation-not-allowed':
    "Cette méthode d'authentification n'est pas activée sur le projet Firebase.",
};

export function translateAuthError(code: string | undefined): string {
  if (!code) {
    return "Une erreur inattendue est survenue. Réessaie dans un instant.";
  }
  return (
    FRENCH_MESSAGES[code] ?? "Une erreur inattendue est survenue. Réessaie dans un instant."
  );
}

export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(requireAuth(), email, password);
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(requireAuth(), email, password);
}

export async function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(requireAuth(), email);
}

export async function signOut(): Promise<void> {
  return firebaseSignOut(requireAuth());
}
