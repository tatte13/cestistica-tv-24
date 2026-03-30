// ============================================================
// CESTISTICA TV 24 — FIREBASE MODULE
// ============================================================
// Questo modulo gestisce la connessione a Firebase Firestore.
// Le chiavi di configurazione vengono salvate nel localStorage
// e caricate da qui ad ogni avvio.
// ============================================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';

// ============================================================
// TIPI
// ============================================================
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type FirebaseSyncStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// ============================================================
// CHIAVE DI STORAGE PER LA CONFIGURAZIONE
// ============================================================
const FB_CONFIG_KEY = 'ctv24_firebase_config';
const FB_ENABLED_KEY = 'ctv24_firebase_enabled';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let unsubscribers: Unsubscribe[] = [];

// ============================================================
// GESTIONE CONFIGURAZIONE
// ============================================================
export function getFirebaseConfig(): FirebaseConfig | null {
  try {
    const stored = localStorage.getItem(FB_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(FB_CONFIG_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(FB_CONFIG_KEY);
  localStorage.removeItem(FB_ENABLED_KEY);
}

export function isFirebaseEnabled(): boolean {
  return localStorage.getItem(FB_ENABLED_KEY) === 'true';
}

export function setFirebaseEnabled(value: boolean): void {
  if (value) {
    localStorage.setItem(FB_ENABLED_KEY, 'true');
  } else {
    localStorage.removeItem(FB_ENABLED_KEY);
  }
}

// ============================================================
// INIZIALIZZAZIONE
// ============================================================
export function initFirebase(config: FirebaseConfig): { app: FirebaseApp; db: Firestore } {
  // Evita di inizializzare due volte
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    app = initializeApp(config);
  }
  db = getFirestore(app);
  return { app, db };
}

export function getDb(): Firestore | null {
  return db;
}

// ============================================================
// OPERAZIONI FIRESTORE
// ============================================================
const COLLECTION = 'ctv24';

async function readDoc(docId: string): Promise<unknown> {
  if (!db) throw new Error('Firebase non inizializzato');
  const ref = doc(db, COLLECTION, docId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function writeDoc(docId: string, data: unknown): Promise<void> {
  if (!db) throw new Error('Firebase non inizializzato');
  const ref = doc(db, COLLECTION, docId);
  await setDoc(ref, data as Record<string, unknown>);
}

// ============================================================
// SINCRONIZZAZIONE DATI
// ============================================================

// Carica i dati da Firestore e li mette nel localStorage
export async function pullFromFirestore(): Promise<{ success: boolean; message: string }> {
  try {
    const playlist = await readDoc('playlist');
    const config = await readDoc('config');
    const overlay = await readDoc('overlay');

    if (playlist) localStorage.setItem('ctv24_playlist', JSON.stringify((playlist as { items: unknown }).items));
    if (config) localStorage.setItem('ctv24_config', JSON.stringify(config));
    if (overlay) localStorage.setItem('ctv24_overlay', JSON.stringify(overlay));
    const broadcast = await readDoc('broadcast');
    if (broadcast) localStorage.setItem('ctv24_broadcast', JSON.stringify(broadcast));

    window.dispatchEvent(new CustomEvent('ctv24-data-change'));
    return { success: true, message: '✅ Dati caricati da Firebase!' };
  } catch (e) {
    return { success: false, message: `❌ Errore: ${(e as Error).message}` };
  }
}

// Carica i dati dal localStorage e li salva su Firestore
export async function pushToFirestore(): Promise<{ success: boolean; message: string }> {
  try {
    const playlist = localStorage.getItem('ctv24_playlist');
    const config = localStorage.getItem('ctv24_config');
    const overlay = localStorage.getItem('ctv24_overlay');

    await writeDoc('playlist', { items: playlist ? JSON.parse(playlist) : [] });
    if (config) await writeDoc('config', JSON.parse(config));
    if (overlay) await writeDoc('overlay', JSON.parse(overlay));
    const broadcast = localStorage.getItem('ctv24_broadcast');
    if (broadcast) await writeDoc('broadcast', JSON.parse(broadcast));

    return { success: true, message: '✅ Dati salvati su Firebase!' };
  } catch (e) {
    return { success: false, message: `❌ Errore: ${(e as Error).message}` };
  }
}

// Avvia la sincronizzazione in tempo reale
export function startRealtimeSync(onChange: () => void): void {
  if (!db) return;
  stopRealtimeSync();

  const docs = ['playlist', 'config', 'overlay', 'broadcast'];
  docs.forEach((docId) => {
    if (!db) return;
    const ref = doc(db, COLLECTION, docId);
    const unsub = onSnapshot(ref, (snap) => {
      if (docId === 'broadcast' && !snap.exists()) return;
      if (!snap.exists()) return;
      const data = snap.data();
      if (docId === 'playlist') {
        localStorage.setItem('ctv24_playlist', JSON.stringify(data.items ?? []));
      } else {
        localStorage.setItem(`ctv24_${docId}`, JSON.stringify(data));
      }
      window.dispatchEvent(new CustomEvent('ctv24-data-change'));
      onChange();
    });
    unsubscribers.push(unsub);
  });
}

export function stopRealtimeSync(): void {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
}


// Salva solo lo stato broadcast su Firestore (veloce, usata dalla regia)
export async function pushBroadcastToFirestore(state: unknown): Promise<void> {
  try {
    await writeDoc('broadcast', state as Record<string, unknown>);
  } catch (e) {
    console.warn('[Firebase] Errore salvataggio broadcast:', e);
  }
}

// ============================================================
// TEST CONNESSIONE
// ============================================================
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!db) throw new Error('Firebase non inizializzato');
    // Prova a leggere un documento (non importa se esiste)
    await readDoc('connection-test');
    return { success: true, message: '✅ Connessione a Firebase riuscita!' };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('permission-denied')) {
      return { success: true, message: '✅ Firebase raggiunto! (Controlla le Firestore Rules se necessario)' };
    }
    return { success: false, message: `❌ Connessione fallita: ${msg}` };
  }
}
