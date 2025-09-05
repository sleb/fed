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

export type UserRole = "member" | "admin" | "missionary";

export interface UserData {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date;
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    // Check if user document exists, create if it doesn't
    await createUserDocumentIfNotExists(result.user);

    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Create user document if it doesn't exist
export const createUserDocumentIfNotExists = async (
  user: User,
): Promise<void> => {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const userData: UserData = {
      id: user.uid,
      name: user.displayName || "Unknown User",
      email: user.email || "",
      photoURL: user.photoURL || undefined,
      role: "member", // Default role for new users
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
      },
    };

    await setDoc(userDocRef, userData);
    console.log("Created new user document:", userData);
  } else {
    // Update last login time for existing users
    await setDoc(userDocRef, { lastLoginAt: new Date() }, { merge: true });
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

// Get redirect URL based on user role
export const getRedirectPath = async (user: User): Promise<string> => {
  const userData = await getUserData(user.uid);

  switch (userData?.role) {
    case "admin":
      return "/dashboard";
    case "missionary":
      return "/missionaries/me";
    case "member":
    default:
      return "/signup";
  }
};
