import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
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
 * Registers a participant in Firebase Authentication and stores their details
 * in the Firestore `participants` collection with 1,000 starting points.
 */
export async function registerParticipantWithFirebase(data: FirebaseRegistrationData) {
  let uid = `local_${Date.now()}`;
  
  // 1. Try creating Firebase Auth account if valid API key is present
  try {
    if (data.password && !import.meta.env.VITE_FIREBASE_API_KEY?.includes("Dummy")) {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      uid = userCredential.user.uid;
    }
  } catch (authError: any) {
    // If user already exists or auth config is default, continue with document creation
    console.warn("Firebase Auth notice:", authError.message);
  }

  // 2. Count existing participants for anonymous label (e.g. P01, P02...)
  let label = "P01";
  try {
    const snap = await getDocs(collection(db, "participants"));
    const count = snap.size + 1;
    label = `P${count.toString().padStart(2, '0')}`;
  } catch {
    label = `P${Math.floor(Math.random() * 90 + 10)}`;
  }

  const participantDoc = {
    uid,
    name: data.full_name,
    email: data.email,
    phone: data.phone,
    college: data.college,
    department: data.department,
    year_of_study: data.year_of_study,
    username: data.username,
    github_profile: data.github_profile || "",
    linkedin_profile: data.linkedin_profile || "",
    anonymous_label: label,
    balance: 1000,
    algorithm_assigned: null,
    algorithm_assigned_name: null,
    is_active_participant: true,
    created_at: new Date().toISOString(),
    server_timestamp: serverTimestamp()
  };

  // 3. Save to Firestore `participants` collection using email/uid as doc key
  const docRef = doc(db, "participants", data.email.replace(/[.@]/g, '_'));
  await setDoc(docRef, participantDoc, { merge: true });

  return participantDoc;
}

/**
 * Fetches all registered participants from Firestore
 */
export async function getAllFirebaseParticipants() {
  const q = query(collection(db, "participants"), orderBy("created_at", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}
