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
import { Apartment, SystemConfig, DutyMessage } from '../types';
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
    // Mark initial_seed as completed so auto-seeding does not recreate deleted apartments
    const metaRef = doc(db, SYSTEM_COLLECTION, 'initial_seed');
    await setDoc(metaRef, { seeded: true, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error deleting apartment from cloud:', err);
    return false;
  }
}

/**
 * Deletes ALL apartments from Firestore (clean wipe by duty officer).
 */
export async function deleteAllApartmentsFromCloud(): Promise<boolean> {
  try {
    const aptsRef = collection(db, APARTMENTS_COLLECTION);
    const snapshot = await getDocs(aptsRef);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    // Prevent auto-seed from repopulating after deliberate clearing
    const metaRef = doc(db, SYSTEM_COLLECTION, 'initial_seed');
    await setDoc(metaRef, { seeded: true, lastClearedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error deleting all apartments from cloud:', err);
    return false;
  }
}

/**
 * Restores initial demo apartments (101-105) into Firestore on demand.
 */
export async function restoreDemoApartmentsToCloud(): Promise<boolean> {
  try {
    for (const apt of INITIAL_APARTMENTS) {
      const ref = doc(db, APARTMENTS_COLLECTION, apt.id);
      await setDoc(ref, apt);
    }
    const metaRef = doc(db, SYSTEM_COLLECTION, 'initial_seed');
    await setDoc(metaRef, { seeded: true, restoredAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error restoring demo apartments to cloud:', err);
    return false;
  }
}

/**
 * Seeds initial demo apartments into Firestore ONLY ONCE on very first setup.
 * Does not re-seed if the collection was deliberately cleared by the duty officer.
 */
export async function seedCloudIfEmpty(): Promise<boolean> {
  try {
    const metaRef = doc(db, SYSTEM_COLLECTION, 'initial_seed');
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists() && metaSnap.data()?.seeded) {
      // Cloud database was already initialized or deliberately cleared
      return false;
    }

    const aptsRef = collection(db, APARTMENTS_COLLECTION);
    const snapshot = await getDocs(aptsRef);
    if (snapshot.empty) {
      console.log('[Firebase] Cloud database is virgin. Seeding initial demo apartments...');
      for (const apt of INITIAL_APARTMENTS) {
        const ref = doc(db, APARTMENTS_COLLECTION, apt.id);
        await setDoc(ref, apt);
      }
      await setDoc(metaRef, { seeded: true, seededAt: new Date().toISOString() });
      return true;
    } else {
      // Apartments already exist
      await setDoc(metaRef, { seeded: true, markedAt: new Date().toISOString() }, { merge: true });
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

const DUTY_MESSAGES_COLLECTION = 'duty_messages';

/**
 * Subscribes to duty officer messages from residents in real-time.
 */
export function subscribeToDutyMessages(
  onSuccess: (messages: DutyMessage[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const ref = collection(db, DUTY_MESSAGES_COLLECTION);
    const q = query(ref);
    return onSnapshot(
      q,
      (snapshot) => {
        const list: DutyMessage[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as DutyMessage), id: d.id });
        });
        // Sort descending by creation date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onSuccess(list);
      },
      (err) => {
        console.warn('[Firebase] Duty messages subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Firebase] Duty messages setup failed:', err);
    if (onError) onError(err as Error);
    return () => {};
  }
}

/**
 * Sends a message/request from a resident to the Duty Officer.
 */
export async function sendDutyMessageToCloud(msg: DutyMessage): Promise<boolean> {
  try {
    const ref = doc(db, DUTY_MESSAGES_COLLECTION, msg.id);
    await setDoc(ref, msg);
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to send duty message:', err);
    return false;
  }
}

/**
 * Updates a duty message (e.g. duty officer reply or status update).
 */
export async function updateDutyMessageInCloud(
  id: string, 
  updates: Partial<DutyMessage>
): Promise<boolean> {
  try {
    const ref = doc(db, DUTY_MESSAGES_COLLECTION, id);
    await setDoc(ref, updates, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to update duty message:', err);
    return false;
  }
}

/**
 * Deletes a duty message from cloud.
 */
export async function deleteDutyMessageFromCloud(id: string): Promise<boolean> {
  try {
    const ref = doc(db, DUTY_MESSAGES_COLLECTION, id);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to delete duty message:', err);
    return false;
  }
}
