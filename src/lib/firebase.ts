import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

import appletConfig from '../../firebase-applet-config.json'

const FALLBACK_CONFIG = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId,
  databaseId: appletConfig.firestoreDatabaseId,
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FALLBACK_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FALLBACK_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FALLBACK_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FALLBACK_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FALLBACK_CONFIG.appId,
}

// Critical: Always target the provisioned Firestore database
export const databaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  appletConfig.firestoreDatabaseId ||
  FALLBACK_CONFIG.databaseId

// Initialize Firebase App
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth: Auth = getAuth(app)

// Initialize Firestore with the targeted database instance and auto-detect long polling
let firestoreDb: Firestore
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    databaseId
  )
} catch {
  firestoreDb = getFirestore(app, databaseId)
}

export const db: Firestore = firestoreDb

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app)

// Validate connection to Firestore as recommended by Firebase guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'))
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database is unreachable. Check network/config.')
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection()
}

export default app
