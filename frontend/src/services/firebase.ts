import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';

// Firebase credentials are injected at build time via Netlify Environment Variables.
// NEVER hardcode keys here — set them in Netlify Dashboard → Site settings → Environment variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (Firestore only — no Firebase Auth needed for this event)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface FirebaseRegistrationData {
  full_name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year_of_study: string;
  username: string;
  password?: string;
  github_profile?: string;
  linkedin_profile?: string;
  agree_terms: boolean;
}

/**
 * Saves participant registration directly to Firestore `participants` collection.
 * No Firebase Auth required — Firestore is used purely as a cloud database.
 * The `participants` collection is created automatically on first registration.
 */
export async function registerParticipantWithFirebase(data: FirebaseRegistrationData) {
  // Use email (sanitized) as document ID so duplicate registrations merge cleanly
  const docId = data.email.replace(/[.@]/g, '_');

  // Count existing participants for sequential anonymous label (P01, P02, ...)
  let label = `P${Math.floor(Math.random() * 90 + 10)}`; // fallback
  try {
    const snap = await getDocs(collection(db, 'participants'));
    const count = snap.size + 1;
    label = `P${count.toString().padStart(2, '0')}`;
  } catch {
    // Firestore read failed (e.g. rules) — use random fallback label, write still proceeds
  }

  const participantDoc = {
    uid: docId,
    name: data.full_name,
    email: data.email,
    phone: data.phone,
    college: data.college,
    department: data.department,
    year_of_study: data.year_of_study,
    username: data.username,
    github_profile: data.github_profile || '',
    linkedin_profile: data.linkedin_profile || '',
    anonymous_label: label,
    balance: 1000,
    algorithm_assigned: null,
    algorithm_assigned_name: null,
    is_active_participant: true,
    created_at: new Date().toISOString(),
    server_timestamp: serverTimestamp(),
  };

  const docRef = doc(db, 'participants', docId);
  await setDoc(docRef, participantDoc, { merge: true });

  return participantDoc;
}

/**
 * Fetches all registered participants from Firestore (sorted by registration time)
 */
export async function getAllFirebaseParticipants() {
  const q = query(collection(db, 'participants'), orderBy('created_at', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => d.data());
}
