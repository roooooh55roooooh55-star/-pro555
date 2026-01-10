import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { SYSTEM_CONFIG } from "./TechSpecs";

// Using the strict configuration from TechSpecs.ts
const firebaseConfig = SYSTEM_CONFIG.firebase;

const app = initializeApp(firebaseConfig);

// Fix for "Could not reach Cloud Firestore backend":
// 1. Force experimentalForceLongPolling to true to bypass WebSocket issues.
// 2. Use persistent local cache for robust offline/instability handling.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false, // Ensure standard fetch for stability
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const storage = getStorage(app);

// Auth helper to ensure access to Firestore rules
export const ensureAuth = async () => {
  try {
    if (auth.currentUser) return auth.currentUser;
    const result = await signInAnonymously(auth);
    console.log("🔥 Firebase Connected. User:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("🔥 Auth Error:", error);
    return null;
  }
};