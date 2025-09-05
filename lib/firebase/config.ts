import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug Firebase config in development
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Firebase Config Debug:");
  console.log("- Project ID:", firebaseConfig.projectId);
  console.log("- Auth Domain:", firebaseConfig.authDomain);
  console.log("- API Key:", firebaseConfig.apiKey ? "✅ Set" : "❌ Missing");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  try {
    console.log("🔌 Connecting to Firebase emulators...");

    console.log("🔐 Connecting to Auth emulator on localhost:9099");
    connectAuthEmulator(auth, "http://localhost:9099", {
      disableWarnings: true,
    });

    console.log("🗄️ Connecting to Firestore emulator on localhost:8080");
    connectFirestoreEmulator(db, "localhost", 8080);

    console.log("✅ Emulator connections established");
  } catch {
    // Silently handle reconnection attempts - Firebase handles this gracefully
    console.log("ℹ️ Emulator connection attempt (may already be connected)");
  }
}

export { app };
export default app;
