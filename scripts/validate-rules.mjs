import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const firestoreRules = readFileSync('firestore.rules', 'utf-8');
const storageRules = readFileSync('storage.rules', 'utf-8');

const env = await initializeTestEnvironment({
  projectId: 'demo-project',
  firestore: {
    host: '127.0.0.1',
    port: 8080,
    rules: firestoreRules,
  },
  storage: {
    host: '127.0.0.1',
    port: 9199,
    rules: storageRules,
  },
});

await env.cleanup();
console.log('firestore.rules + storage.rules compiled successfully.');
