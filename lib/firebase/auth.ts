import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
    UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

export type UserRole = 'member' | 'admin' | 'missionary';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}

// Sign up new user
export const signUp = async (
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update the user's profile with their name
  await updateProfile(userCredential.user, {
    displayName: name,
  });

  // Create user document in Firestore
  const userData: UserData = {
    id: userCredential.user.uid,
    name,
    email,
    phone,
    role: 'member', // Default role
    createdAt: new Date(),
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
    },
  };

  await setDoc(doc(db, 'users', userCredential.user.uid), userData);

  return userCredential;
};

// Sign in existing user
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Sign out current user
export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Update user role (admin only)
export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  await setDoc(doc(db, 'users', uid), { role }, { merge: true });
};

// Check if user is admin
export const isAdmin = async (user: User): Promise<boolean> => {
  const userData = await getUserData(user.uid);
  return userData?.role === 'admin' || false;
};

// Get current user's role
export const getCurrentUserRole = async (): Promise<UserRole | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const userData = await getUserData(user.uid);
  return userData?.role || null;
};
