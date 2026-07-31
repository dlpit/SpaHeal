// =============================================================================
// Firebase Admin SDK - Server-Side Initialization
// Singleton pattern to avoid multiple instances during Next.js hot reload
// =============================================================================

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let firebaseApp: App | null = null;
let firestore: Firestore | null = null;

function getFirebaseApp(): App {
  if (firebaseApp) return firebaseApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
    );
  }

  firebaseApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Firebase private key contains \n escape sequences that need to be converted
      // to actual newlines when loaded from environment variables
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  return firebaseApp;
}

/**
 * Get Firestore instance (lazy initialization)
 * Throws if Firebase credentials are not configured
 */
export function getDb(): Firestore {
  if (firestore) return firestore;
  firestore = getFirestore(getFirebaseApp());
  return firestore;
}

/**
 * Check if Firebase is configured (credentials present in env)
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

// Lazy proxy: `db` getter that initializes on first access
// This prevents build-time crash when credentials aren't set
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export default db;
