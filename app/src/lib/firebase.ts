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

  const projectId = process.env.FIREBASE_PROJECT_ID || 'spa-heal-dev';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'dummy@localhost';
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\ndummy\n-----END PRIVATE KEY-----\n';

  // Tự động ép dùng Emulator khi ở môi trường development
  if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATOR !== 'false') {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    }
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    }
    console.log('🔥 Firebase Admin: Kết nối vào Local Emulator');
  }

  // Cảnh báo nếu thiếu credential VÀ không dùng emulator
  if (!process.env.FIRESTORE_EMULATOR_HOST && (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) {
    console.warn(
      '⚠️ Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your Vercel Environment Variables.'
    );
  }

  firebaseApp = initializeApp({
    projectId,
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
  if (process.env.NODE_ENV === 'development') return true;
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
