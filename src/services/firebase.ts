/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  increment
} from "firebase/firestore";

// Firebase configuration from user screenshot
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "AIzaSyAuNfngUPdQy92s8LYTXxtGoMaTygLNkhY",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "sweet-blast-game.firebaseapp.com",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "sweet-blast-game",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "sweet-blast-game.firebasestorage.app",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "562454632327",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "1:562454632327:web:db1eeb6a86676346086522",
  measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID || "G-17KNPGC6J"
};

// Check if config is valid
const isConfigValid = !!firebaseConfig.apiKey;

let app;
if (isConfigValid) {
  app = initializeApp(firebaseConfig);
} else {
  console.warn("Firebase config missing. Auth and Cloud Save will not work.");
  // Mock app for development if needed, or just let it fail gracefully
  app = initializeApp({ apiKey: "mock", authDomain: "mock", projectId: "mock", storageBucket: "mock", messagingSenderId: "mock", appId: "mock" });
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export interface UserProfile {
  uid: string;
  displayName: string;
  level: number;
  coins: number;
  gems: number;
  trophies: number;
  powerups: {
    hammer: number;
    shuffle: number;
    bomb: number;
    extraMoves: number;
  };
  lastSync: number;
}

const DEFAULT_PROFILE: Omit<UserProfile, 'uid' | 'displayName'> = {
  level: 1,
  coins: 100,
  gems: 10,
  trophies: 0,
  powerups: {
    hammer: 3,
    shuffle: 3,
    bomb: 1,
    extraMoves: 1
  },
  lastSync: Date.now()
};

export const syncUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, "users", uid);
    // setDoc with merge: true is safer than updateDoc
    await setDoc(userRef, { ...data, lastSync: Date.now() }, { merge: true });
    console.log("Profile synced successfully");
  } catch (error) {
    console.error("Error syncing profile:", error);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (error) {
    console.error("Error getting profile:", error);
  }
  return null;
};

export const createInitialProfile = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  const profile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || "Sweet Explorer",
    ...DEFAULT_PROFILE
  };
  await setDoc(userRef, profile);
  return profile;
};
