import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Analytics - Khởi tạo động (dynamic import) để tránh lỗi trắng trang khi bị Adblock chặn
export const analytics = import("firebase/analytics")
  .then(async ({ getAnalytics, isSupported }) => {
    const supported = await isSupported();
    return supported ? getAnalytics(app) : null;
  })
  .catch((error) => {
    console.warn("Analytics module blocked by Adblocker or failed to load.", error);
    return null;
  });

export default app;
