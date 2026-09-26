import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';

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

// ── Event capacity limit ────────────────────────────────────────────────────
export const MAX_PARTICIPANTS = 40;

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
 * Returns the current count of registered participants.
 * Used to show live slot availability on the Register page.
 */
export async function getParticipantCount(): Promise<number> {
  const snap = await getDocs(collection(db, 'participants'));
  return snap.size;
}

/**
 * Saves participant registration directly to Firestore `participants` collection.
 *
 * Rules enforced:
 *  1. Hard cap at MAX_PARTICIPANTS (40). Throws if full.
 *  2. Duplicate email check — throws if already registered.
 *  3. Labels assigned sequentially (P01 … P40).
 */
export async function registerParticipantWithFirebase(data: FirebaseRegistrationData) {
  const docId = data.email.replace(/[.@]/g, '_');

  // 1. Fetch current snapshot once (used for both cap + label)
  const snap = await getDocs(collection(db, 'participants'));
  const currentCount = snap.size;

  // 2. Hard capacity check — block if event is full
  if (currentCount >= MAX_PARTICIPANTS) {
    throw new Error(
      `Registration is closed. BID2CODE 2026 has reached its maximum capacity of ${MAX_PARTICIPANTS} participants.`
    );
  }

  // 3. Duplicate email check — block if already registered
  const existing = await getDoc(doc(db, 'participants', docId));
  if (existing.exists()) {
    throw new Error(
      `This email is already registered. If you need help, contact the event organizers.`
    );
  }

  // 4. Assign sequential label (P01 … P40)
  const nextNumber = currentCount + 1;
  const label = `P${nextNumber.toString().padStart(2, '0')}`;

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

  await setDoc(doc(db, 'participants', docId), participantDoc);

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
