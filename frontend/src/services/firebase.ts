import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

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
 * Gets registration status (open/closed) from Firestore. Defaults to true (open).
 */
export async function getRegistrationStatus(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'registration'));
    if (snap.exists()) {
      const data = snap.data();
      return data.is_open !== false;
    }
  } catch (err) {
    console.warn('Failed to fetch registration status from Firestore:', err);
  }
  return true;
}

/**
 * Toggles registration open/closed in Firestore settings collection.
 */
export async function setRegistrationStatus(isOpen: boolean): Promise<void> {
  await setDoc(doc(db, 'settings', 'registration'), {
    is_open: isOpen,
    updated_at: new Date().toISOString(),
  }, { merge: true });
}

export interface ManualParticipantData {
  full_name: string;
  email: string;
  username: string;
  password?: string;
  phone?: string;
  college?: string;
  department?: string;
  year_of_study?: string;
  balance?: number;
}

/**
 * Manually adds a participant from the Admin Portal into Firestore.
 */
export async function adminAddParticipant(data: ManualParticipantData) {
  const docId = data.email.replace(/[.@]/g, '_');

  // Check duplicate email
  const existing = await getDoc(doc(db, 'participants', docId));
  if (existing.exists()) {
    throw new Error(`Participant with email "${data.email}" already exists.`);
  }

  const snap = await getDocs(collection(db, 'participants'));
  const nextNumber = snap.size + 1;
  const label = `P${nextNumber.toString().padStart(2, '0')}`;

  const participantDoc = {
    uid: docId,
    name: data.full_name,
    email: data.email,
    phone: data.phone || '',
    college: data.college || 'Manual Registration',
    department: data.department || '',
    year_of_study: data.year_of_study || 'Year 2',
    username: data.username.trim(),
    password: data.password || 'bid2code2026',
    github_profile: '',
    linkedin_profile: '',
    anonymous_label: label,
    balance: data.balance ?? 1000,
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
 * Saves participant registration directly to Firestore `participants` collection.
 *
 * Rules enforced:
 *  1. Admin registration toggle check — blocks if closed.
 *  2. Hard cap at MAX_PARTICIPANTS (40). Throws if full.
 *  3. Duplicate email check — throws if already registered.
 *  4. Labels assigned sequentially (P01 … P40).
 */
export async function registerParticipantWithFirebase(data: FirebaseRegistrationData) {
  // 1. Check if registration was closed by admin
  const isOpen = await getRegistrationStatus();
  if (!isOpen) {
    throw new Error('Registration is currently closed by the event organizers.');
  }

  const docId = data.email.replace(/[.@]/g, '_');

  // 2. Fetch current snapshot once (used for both cap + label)
  const snap = await getDocs(collection(db, 'participants'));
  const currentCount = snap.size;

  // 3. Hard capacity check — block if event is full
  if (currentCount >= MAX_PARTICIPANTS) {
    throw new Error(
      `Registration is closed. BID2CODE 2026 has reached its maximum capacity of ${MAX_PARTICIPANTS} participants.`
    );
  }

  // 4. Duplicate email check — block if already registered
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
    password: data.password || '',
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
 * Authenticates a participant against Firestore cloud registrations.
 * Allows login via registered username or email.
 */
export async function loginParticipantWithFirebase(credentials: { username: string; password: string }) {
  const searchKey = credentials.username.trim().toLowerCase();
  const rawInput = credentials.username.trim();

  const snap = await getDocs(collection(db, 'participants'));
  let matchedDoc: any = null;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const docEmail = (data.email || '').trim().toLowerCase();
    const docUsername = (data.username || '').trim().toLowerCase();
    
    if (docUsername === searchKey || docEmail === searchKey || data.username === rawInput || data.email === rawInput) {
      matchedDoc = { ...data, uid: docSnap.id };
      break;
    }
  }

  if (!matchedDoc) {
    throw new Error('No registered participant found with that username or email. Please register first.');
  }

  // Check password if saved
  if (matchedDoc.password && matchedDoc.password !== credentials.password) {
    throw new Error('Incorrect password. Please verify your credentials.');
  }

  // If password was missing from legacy registration, save it now
  if (!matchedDoc.password && credentials.password) {
    try {
      await setDoc(doc(db, 'participants', matchedDoc.uid), { password: credentials.password }, { merge: true });
    } catch {
      // Non-blocking
    }
  }

  const participantUser = {
    id: matchedDoc.uid,
    username: matchedDoc.username,
    anonymous_label: matchedDoc.anonymous_label || 'P01',
    name: matchedDoc.name || matchedDoc.full_name || matchedDoc.username,
    email: matchedDoc.email,
    phone: matchedDoc.phone || '',
    college: matchedDoc.college || '',
    department: matchedDoc.department || '',
    year_of_study: matchedDoc.year_of_study || '',
    github_profile: matchedDoc.github_profile || '',
    linkedin_profile: matchedDoc.linkedin_profile || '',
    balance: matchedDoc.balance ?? 1000,
    algorithm_assigned: matchedDoc.algorithm_assigned ?? null,
    algorithm_assigned_name: matchedDoc.algorithm_assigned_name ?? null,
    coding_started_at: matchedDoc.coding_started_at ?? null,
    coding_deadline: matchedDoc.coding_deadline ?? null,
    remaining_coding_seconds: matchedDoc.remaining_coding_seconds ?? 2400,
    has_algorithm: !!matchedDoc.algorithm_assigned,
    is_coding: !!matchedDoc.is_coding,
    is_coding_finished: !!matchedDoc.is_coding_finished,
    is_staff: !!matchedDoc.is_staff,
    created_at: matchedDoc.created_at || new Date().toISOString(),
  };

  return participantUser;
}

/**
 * Deletes a participant document from Firestore by their document ID.
 */
export async function deleteFirebaseParticipant(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'participants', docId));
}

/**
 * Fetches all registered participants from Firestore (sorted by registration time)
 */
export async function getAllFirebaseParticipants() {
  const q = query(collection(db, 'participants'), orderBy('created_at', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
}
