import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query
} from 'firebase/firestore';
import { Apartment, SystemConfig } from '../types';
import { INITIAL_APARTMENTS } from '../data/initialData';

// Configuration from Firebase project provisioned for CYCLON
const firebaseConfig = {
  apiKey: "AIzaSyDeISsdr6AX1HsXagdYMqMGcifIMGp4Ces",
  authDomain: "gen-lang-client-0219383499.firebaseapp.com",
  projectId: "gen-lang-client-0219383499",
  storageBucket: "gen-lang-client-0219383499.firebasestorage.app",
  messagingSenderId: "407048257438",
  appId: "1:407048257438:web:c78a04de8074d2af45e08f"
};

const DATABASE_ID = "ai-studio-on-1317be24-128c-4def-89d2-3dc411270542";

let app: FirebaseApp;
let db: Firestore;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // Connect to the provisioned database instance
  db = getFirestore(app, DATABASE_ID);
} catch (err) {
  console.error('[Firebase] Failed to initialize Firestore with custom database ID, falling back to default:', err);
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { app, db };

const APARTMENTS_COLLECTION = 'apartments';
const SYSTEM_COLLECTION = 'system';
const SYSTEM_CONFIG_DOC = 'starosta_config';

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  starostaPin: '7777',
  starostaName: 'Дежурный по дому',
  houseName: 'ЖК ЦИКЛON 🌀',
  announcement: 'Добро пожаловать в единую систему чистоты дома!',
};

/**
 * Real-time subscription to all apartments in Firestore.
 * Automatically synchronizes tasks, completed state, points and members across all devices.
 */
export function subscribeToCloudApartments(
  onSuccess: (apartments: Apartment[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const aptsRef = collection(db, APARTMENTS_COLLECTION);
    const q = query(aptsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Apartment[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Apartment;
          loaded.push({ ...data, id: d.id });
        });

        // Sort by apartment number
        loaded.sort((a, b) => a.apartmentNumber - b.apartmentNumber);
        onSuccess(loaded);
      },
      (err) => {
        console.warn('[Firebase] Firestore onSnapshot error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase] subscribeToCloudApartments setup failed:', err);
    if (onError) onError(err as Error);
    return () => {};
  }
}

/**
 * Saves or updates a single apartment in Firestore.
 */
export async function syncApartmentToCloud(apartment: Apartment): Promise<boolean> {
  try {
    const aptRef = doc(db, APARTMENTS_COLLECTION, apartment.id);
    await setDoc(aptRef, apartment, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error syncing apartment to cloud:', err);
    return false;
  }
}

/**
 * Deletes an apartment from Firestore (Starosta admin capability).
 */
export async function deleteApartmentFromCloud(apartmentId: string): Promise<boolean> {
  try {
    const aptRef = doc(db, APARTMENTS_COLLECTION, apartmentId);
    await deleteDoc(aptRef);
    return true;
  } catch (err) {
    console.error('[Firebase] Error deleting apartment from cloud:', err);
    return false;
  }
}

/**
 * Seeds initial demo apartments into Firestore if the collection is currently empty.
 */
export async function seedCloudIfEmpty(): Promise<boolean> {
  try {
    const aptsRef = collection(db, APARTMENTS_COLLECTION);
    const snapshot = await getDocs(aptsRef);
    if (snapshot.empty) {
      console.log('[Firebase] Cloud database is empty. Seeding initial apartments...');
      for (const apt of INITIAL_APARTMENTS) {
        const ref = doc(db, APARTMENTS_COLLECTION, apt.id);
        await setDoc(ref, apt);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Firebase] Error checking or seeding cloud apartments:', err);
    return false;
  }
}

/**
 * Subscribes to Starosta configuration in real-time.
 */
export function subscribeToSystemConfig(
  onSuccess: (config: SystemConfig) => void
): () => void {
  try {
    const sysRef = doc(db, SYSTEM_COLLECTION, SYSTEM_CONFIG_DOC);
    return onSnapshot(
      sysRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onSuccess({ ...DEFAULT_SYSTEM_CONFIG, ...(docSnap.data() as SystemConfig) });
        } else {
          // Initialize if does not exist
          setDoc(sysRef, DEFAULT_SYSTEM_CONFIG).catch(() => {});
          onSuccess(DEFAULT_SYSTEM_CONFIG);
        }
      },
      (err) => {
        console.warn('[Firebase] System config subscription error:', err);
        onSuccess(DEFAULT_SYSTEM_CONFIG);
      }
    );
  } catch (err) {
    console.warn('[Firebase] System config setup failed:', err);
    onSuccess(DEFAULT_SYSTEM_CONFIG);
    return () => {};
  }
}

/**
 * Updates Starosta configuration (e.g. change master PIN or announcement).
 */
export async function saveSystemConfig(newConfig: Partial<SystemConfig>): Promise<boolean> {
  try {
    const sysRef = doc(db, SYSTEM_COLLECTION, SYSTEM_CONFIG_DOC);
    await setDoc(sysRef, newConfig, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to save system config:', err);
    return false;
  }
}
