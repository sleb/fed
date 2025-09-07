import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

// Re-export the useAuth hook
export { useAuth } from "../../hooks/useAuth";

export type UserRole = "member" | "admin" | "missionary";

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  onboardingCompleted: boolean;
  preferences: {
    contactMethod: "email" | "sms" | "both";
    signupReminders: boolean;
    appointmentReminders: boolean;
    changeNotifications: boolean;
    reminderDaysBefore: number;
  };
  stats: {
    totalSignups: number;
    completedDinners: number;
    cancelledDinners: number;
    lastDinnerDate?: Date;
  };
  createdAt: Date;
  lastLoginAt: Date;
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    console.log("🚀 Starting Google sign-in...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("✅ Google sign-in successful:", result.user.email);

    // Check if user document exists, create if it doesn't
    console.log("📝 Creating/updating user document...");
    await createUserDocumentIfNotExists(result.user);
    console.log("✅ User document processed");

    return result;
  } catch (error) {
    console.error("❌ Error signing in with Google:", error);
    throw error;
  }
};

// Create user document if it doesn't exist
export const createUserDocumentIfNotExists = async (
  user: User,
): Promise<void> => {
  try {
    console.log("🔍 Checking user document for:", user.uid);
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    console.log("📄 Document exists:", userDoc.exists());

    if (!userDoc.exists()) {
      console.log("📝 Creating new user document...");
      const userData: UserData = {
        id: user.uid,
        name: user.displayName || "Unknown User",
        email: user.email || "",
        role: "member",
        onboardingCompleted: false,
        preferences: {
          contactMethod: "email",
          signupReminders: true,
          appointmentReminders: true,
          changeNotifications: true,
          reminderDaysBefore: 1,
        },
        stats: {
          totalSignups: 0,
          completedDinners: 0,
          cancelledDinners: 0,
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      console.log("💾 Saving user data:", userData);
      await setDoc(userDocRef, userData);
      console.log("✅ Created new user document successfully");
    } else {
      console.log("⏰ Updating last login time for existing user");
      await setDoc(userDocRef, { lastLoginAt: new Date() }, { merge: true });
      console.log("✅ Updated last login time");
    }
  } catch (error) {
    console.error("❌ Error in createUserDocumentIfNotExists:", error);
    throw error;
  }
};

// Sign out current user
export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Update user role (admin only)
export const updateUserRole = async (
  uid: string,
  role: UserRole,
): Promise<void> => {
  await setDoc(doc(db, "users", uid), { role }, { merge: true });
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<UserData, "id" | "createdAt">>,
): Promise<void> => {
  // Filter out undefined values - Firestore doesn't allow them
  const cleanUpdates: Record<string, unknown> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  const updateData = {
    ...cleanUpdates,
    lastLoginAt: new Date(),
  };
  await setDoc(doc(db, "users", uid), updateData, { merge: true });
};

// Check if user is admin
export const isAdmin = async (user: User): Promise<boolean> => {
  const userData = await getUserData(user.uid);
  return userData?.role === "admin" || false;
};

// Get current user's role
export const getCurrentUserRole = async (): Promise<UserRole | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const userData = await getUserData(user.uid);
  return userData?.role || null;
};

// Auth state change listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get redirect URL based on user role and onboarding status
export const getRedirectPath = async (user: User): Promise<string> => {
  const userData = await getUserData(user.uid);

  if (!userData?.onboardingCompleted) {
    return "/onboarding";
  }

  switch (userData?.role) {
    case "admin":
      return "/admin";
    case "missionary":
    case "member":
    default:
      return "/calendar";
  }
};
