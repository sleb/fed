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

export interface Companionship {
  id: string;
  area: string; // Primary identifier - missionaries serving in this area
  address: string;
  apartmentNumber?: string;
  phone: string; // Required shared phone number for the companionship
  missionaryIds: string[];
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc. Default: [1,2,3,4,5,6,0] (Mon-Sun)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Slots are generated dynamically - no database storage needed

export interface Signup {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  // Slot information is now embedded directly in signup
  companionshipId: string;
  dinnerDate: Date;
  dayOfWeek: string;
  guestCount: number; // Number of missionaries eating
  status: "confirmed" | "pending" | "completed";
  contactPreference: "email" | "phone" | "both";
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: "member" | "admin" | "missionary";
  onboardingCompleted: boolean;
  preferences: {
    contactMethod: "email" | "sms" | "both";
    signupReminders: boolean;
    appointmentReminders: boolean;
    changeNotifications: boolean;
    reminderDaysBefore: number;
  };
  stats?: {
    totalSignups: number;
    completedDinners: number;
    lastDinnerDate?: Date;
  };
  createdAt: Date;
  lastLoginAt: Date;
}

export interface SignupFormData {
  companionshipId: string;
  dinnerDate: Date;
  dayOfWeek: string;
  guestCount: number;
  userPhone?: string;
  contactPreference: "email" | "phone" | "both";
  notes?: string;
}

// Virtual slots for calendar display - generated from companionship schedules
export interface VirtualDinnerSlot {
  companionshipId: string;
  date: Date;
  dayOfWeek: string;
  guestCount: number;
  status: "available" | "taken";
  signup?: Signup; // If someone has signed up for this slot
}

export interface SignupWithDetails extends Signup {
  companionship: Companionship;
  missionaries: Missionary[];
}

// Search and filter interfaces
export interface SignupFilters {
  status?: Signup["status"];
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  companionshipId?: string;
}

// Utility types for data conversion
export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

// Onboarding form data
export interface OnboardingFormData {
  phone?: string;
  address?: string;
  contactMethod: "email" | "sms" | "both";
  signupReminders: boolean;
  appointmentReminders: boolean;
  changeNotifications: boolean;
  reminderDaysBefore: number;
}

// Utility types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}
