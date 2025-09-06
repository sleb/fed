export interface Missionary {
  id: string;
  name: string;
  email?: string;
  dinnerPreferences?: string[];
  allergies?: string[];
  notes?: string;
  isActive: boolean;
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
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DinnerSlot {
  id: string;
  missionaryId: string;
  date: Date;
  dayOfWeek: string;
  time: string; // e.g., "6:00 PM"
  status: "available" | "assigned" | "completed" | "cancelled";
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserEmail?: string;
  assignedUserPhone?: string;
  specialRequests?: string;
  guestCount: number; // Number of missionaries eating (usually 2)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin who created the slot
}

export interface Signup {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  dinnerSlotId: string;
  missionaryId: string;
  missionaryName: string;
  dinnerDate: Date;
  dinnerTime: string;
  guestCount: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  specialRequests?: string;
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
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderDaysBefore: number;
  };
  stats?: {
    totalSignups: number;
    completedDinners: number;
    cancelledDinners: number;
    lastDinnerDate?: Date;
  };
  createdAt: Date;
  lastLoginAt: Date;
}

export interface SignupFormData {
  dinnerSlotId: string;
  guestCount: number;
  specialRequests?: string;
  userPhone?: string;
  contactPreference: "email" | "phone" | "both";
  notes?: string;
}

export interface DinnerSlotWithMissionary extends DinnerSlot {
  missionary: Missionary;
}

export interface SignupWithDetails extends Signup {
  missionary: Missionary;
  dinnerSlot: DinnerSlot;
}

// Filters and search types
export interface DinnerSlotFilters {
  dateFrom?: Date;
  dateTo?: Date;
  area?: string;
  zone?: string;
  district?: string;
  availableOnly?: boolean;
  missionaryId?: string;
}

export interface SignupFilters {
  status?: Signup["status"];
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  missionaryId?: string;
}

// Firebase document converters helper types
export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

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
