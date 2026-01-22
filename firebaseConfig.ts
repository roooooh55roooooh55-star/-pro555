
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { SYSTEM_CONFIG } from "./TechSpecs";

const firebaseConfig = SYSTEM_CONFIG.firebase;

const app = initializeApp(firebaseConfig);

// تحسين الاتصال لتجنب مشاكل WebSocket في بعض شبكات الأندرويد
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const storage = getStorage(app);

export const ensureAuth = async () => {
  try {
    if (auth.currentUser) return auth.currentUser;
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.warn("Firebase Auth Failover - Using Local Admin");
    return { uid: 'local_admin_bypass', isAnonymous: true };
  }
};
