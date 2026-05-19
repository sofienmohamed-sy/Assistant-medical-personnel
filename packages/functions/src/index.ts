import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 10,
});

export const ping = onCall((request) => {
  logger.info('ping called', { uid: request.auth?.uid ?? null });
  return { ok: true, ts: Date.now() };
});

export const whoami = onCall((request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  return { uid: request.auth.uid, email: request.auth.token.email ?? null };
});
