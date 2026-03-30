import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { getFirebaseConfig, isFirebaseEnabled, initFirebase, startRealtimeSync, saveFirebaseConfig, setFirebaseEnabled } from "./firebase";
import type { FirebaseConfig } from "./firebase";

// ── Configurazione Firebase da variabili d'ambiente ──────
// Se sono presenti le variabili VITE_FIREBASE_* nel file .env,
// le usiamo direttamente — funziona su TUTTI i dispositivi
// senza dover configurare nulla nell'admin.
const envConfig: Partial<FirebaseConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const envConfigComplete =
  envConfig.apiKey &&
  envConfig.authDomain &&
  envConfig.projectId &&
  envConfig.storageBucket &&
  envConfig.messagingSenderId &&
  envConfig.appId;

// Se le variabili d'ambiente sono presenti, le salviamo anche
// nel localStorage così l'admin le vede come già configurate
if (envConfigComplete) {
  saveFirebaseConfig(envConfig as FirebaseConfig);
  setFirebaseEnabled(true);
}

// ── Avvio Firebase ────────────────────────────────────────
// Usa env vars se disponibili, altrimenti il localStorage
const fbConfig = envConfigComplete
  ? (envConfig as FirebaseConfig)
  : getFirebaseConfig();

if (fbConfig && (envConfigComplete || isFirebaseEnabled())) {
  try {
    initFirebase(fbConfig);
    startRealtimeSync(() => {
      // ctv24-data-change viene dispatched automaticamente
      // e tutti i componenti si aggiornano
    });
    console.log("[Firebase] Sync realtime avviata ✅");
  } catch (e) {
    console.warn("[Firebase] Avvio fallito:", e);
  }
} else {
  console.log("[Firebase] Non configurato — uso localStorage locale");
}
// ──────────────────────────────────────────────────────────

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
