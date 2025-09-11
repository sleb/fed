// This file contains shared types for Firebase Functions
// Based on the main app types but adapted for Firestore usage

export interface Signup {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  companionshipId: string;
  dinnerDate: Date;
  dayOfWeek: string;
  guestCount: number;
  status: "confirmed" | "pending" | "completed";
  contactPreference: "email" | "phone" | "both";
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Companionship {
  id: string;
  area: string;
  address: string;
  apartmentNumber?: string;
  phone: string;
  missionaryIds: string[];
  daysOfWeek: number[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Missionary {
  id: string;
  name: string;
  email?: string;
  dinnerPreferences?: string[];
  allergies?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Firebase-specific types for handling Firestore timestamps
export interface SignupFirestore extends Omit<Signup, "dinnerDate" | "createdAt" | "updatedAt"> {
  dinnerDate: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CompanionshipFirestore extends Omit<Companionship, "createdAt" | "updatedAt"> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface MissionaryFirestore extends Omit<Missionary, "createdAt" | "updatedAt"> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
