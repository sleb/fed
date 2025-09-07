import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";

// Import types from the main types file
import {
  CalendarTemplate,
  Companionship,
  CompanionshipCalendar,
  DinnerSlot,
  Missionary,
  Signup,
} from "@/types";

// Generic Firestore operations
export class FirestoreService {
  // Get single document
  static async getDocument<T>(
    collectionName: string,
    docId: string,
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Get multiple documents with optional query constraints
  static async getDocuments<T>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const q =
        constraints.length > 0
          ? query(collectionRef, ...constraints)
          : collectionRef;
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Add new document
  static async addDocument<T>(
    collectionName: string,
    data: Omit<T, "id">,
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  // Update existing document
  static async updateDocument<T>(
    collectionName: string,
    docId: string,
    data: Partial<Omit<T, "id">>,
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete document
  static async deleteDocument(
    collectionName: string,
    docId: string,
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }
}

// Missionary-specific operations
export class MissionaryService {
  private static collectionName = "missionaries";

  static async getAllMissionaries(): Promise<Missionary[]> {
    return FirestoreService.getDocuments<Missionary>(this.collectionName, [
      orderBy("name"),
    ]);
  }

  static async getActiveMissionaries(): Promise<Missionary[]> {
    return FirestoreService.getDocuments<Missionary>(this.collectionName, [
      where("isActive", "==", true),
      orderBy("name"),
    ]);
  }

  static async getMissionary(id: string): Promise<Missionary | null> {
    return FirestoreService.getDocument<Missionary>(this.collectionName, id);
  }

  static async createMissionary(
    missionary: Omit<Missionary, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const missionaryData = {
      ...missionary,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return FirestoreService.addDocument<Missionary>(
      this.collectionName,
      missionaryData,
    );
  }

  static async updateMissionary(
    id: string,
    updates: Partial<Omit<Missionary, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };
    return FirestoreService.updateDocument<Missionary>(
      this.collectionName,
      id,
      updatesWithTimestamp,
    );
  }

  static async deleteMissionary(id: string): Promise<void> {
    return FirestoreService.deleteDocument(this.collectionName, id);
  }
}

// Companionship-specific operations
export class CompanionshipService {
  private static collectionName = "companionships";

  static async getAllCompanionships(): Promise<Companionship[]> {
    return FirestoreService.getDocuments<Companionship>(this.collectionName, [
      orderBy("area"),
    ]);
  }

  static async getActiveCompanionships(): Promise<Companionship[]> {
    return FirestoreService.getDocuments<Companionship>(this.collectionName, [
      where("isActive", "==", true),
      orderBy("area"),
    ]);
  }

  static async getCompanionship(id: string): Promise<Companionship | null> {
    return FirestoreService.getDocument<Companionship>(this.collectionName, id);
  }

  static async getCompanionshipByArea(
    area: string,
  ): Promise<Companionship | null> {
    const companionships = await FirestoreService.getDocuments<Companionship>(
      this.collectionName,
      [where("area", "==", area), where("isActive", "==", true), limit(1)],
    );
    return companionships.length > 0 ? companionships[0] : null;
  }

  static async createCompanionship(
    companionship: Omit<Companionship, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const companionshipData = {
      ...companionship,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return FirestoreService.addDocument<Companionship>(
      this.collectionName,
      companionshipData,
    );
  }

  static async updateCompanionship(
    id: string,
    updates: Partial<Omit<Companionship, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };
    return FirestoreService.updateDocument<Companionship>(
      this.collectionName,
      id,
      updatesWithTimestamp,
    );
  }

  static async deleteCompanionship(id: string): Promise<void> {
    return FirestoreService.deleteDocument(this.collectionName, id);
  }
}

// DinnerSlot-specific operations
export class DinnerSlotService {
  private static collectionName = "dinnerSlots";

  static async getAllSlots(): Promise<DinnerSlot[]> {
    return FirestoreService.getDocuments<DinnerSlot>(this.collectionName, [
      orderBy("date"),
    ]);
  }

  static async getSlotsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<DinnerSlot[]> {
    // Convert string dates to Date objects for Firestore comparison
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999); // Include entire end date

    return FirestoreService.getDocuments<DinnerSlot>(this.collectionName, [
      where("date", ">=", startDateObj),
      where("date", "<=", endDateObj),
      orderBy("date"),
    ]);
  }

  static async getOpenSlots(): Promise<DinnerSlot[]> {
    return FirestoreService.getDocuments<DinnerSlot>(this.collectionName, [
      where("status", "==", "open"),
      orderBy("date"),
    ]);
  }

  static async getSlotsByCompanionship(
    companionshipId: string,
  ): Promise<DinnerSlot[]> {
    return FirestoreService.getDocuments<DinnerSlot>(this.collectionName, [
      where("companionshipId", "==", companionshipId),
      orderBy("date"),
    ]);
  }

  static async getSlotsByUser(userId: string): Promise<DinnerSlot[]> {
    return FirestoreService.getDocuments<DinnerSlot>(this.collectionName, [
      where("assignedUserId", "==", userId),
      orderBy("date"),
    ]);
  }

  static async getDinnerSlot(id: string): Promise<DinnerSlot | null> {
    return FirestoreService.getDocument<DinnerSlot>(this.collectionName, id);
  }

  static async createDinnerSlot(
    slot: Omit<DinnerSlot, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const slotData = {
      ...slot,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return FirestoreService.addDocument<DinnerSlot>(
      this.collectionName,
      slotData,
    );
  }

  static async updateDinnerSlot(
    id: string,
    updates: Partial<Omit<DinnerSlot, "id" | "createdAt">>,
  ): Promise<void> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };
    return FirestoreService.updateDocument<DinnerSlot>(
      this.collectionName,
      id,
      updatesWithTimestamp,
    );
  }

  static async deleteDinnerSlot(id: string): Promise<void> {
    return FirestoreService.deleteDocument(this.collectionName, id);
  }
}

// Signup-specific operations
// Calendar Template operations
export class CalendarTemplateService {
  private static collectionName = "calendarTemplates";

  static async getAllTemplates(): Promise<CalendarTemplate[]> {
    return FirestoreService.getDocuments<CalendarTemplate>(
      this.collectionName,
      [orderBy("isDefault", "desc"), orderBy("name")],
    );
  }

  static async getActiveTemplates(): Promise<CalendarTemplate[]> {
    return FirestoreService.getDocuments<CalendarTemplate>(
      this.collectionName,
      [
        where("isActive", "==", true),
        orderBy("isDefault", "desc"),
        orderBy("name"),
      ],
    );
  }

  static async getDefaultTemplate(): Promise<CalendarTemplate | null> {
    const templates = await FirestoreService.getDocuments<CalendarTemplate>(
      this.collectionName,
      [where("isDefault", "==", true), where("isActive", "==", true), limit(1)],
    );
    return templates.length > 0 ? templates[0] : null;
  }

  static async getTemplate(id: string): Promise<CalendarTemplate | null> {
    return FirestoreService.getDocument<CalendarTemplate>(
      this.collectionName,
      id,
    );
  }

  static async createTemplate(
    template: Omit<CalendarTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    // If this is set as default, unset all other defaults
    if (template.isDefault) {
      const existingDefaults = await this.getActiveTemplates();
      for (const existing of existingDefaults.filter((t) => t.isDefault)) {
        await this.updateTemplate(existing.id, { isDefault: false });
      }
    }

    const templateData = {
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return FirestoreService.addDocument<CalendarTemplate>(
      this.collectionName,
      templateData,
    );
  }

  static async updateTemplate(
    id: string,
    updates: Partial<Omit<CalendarTemplate, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> {
    // If setting as default, unset all other defaults
    if (updates.isDefault) {
      const existingDefaults = await this.getActiveTemplates();
      for (const existing of existingDefaults.filter(
        (t) => t.isDefault && t.id !== id,
      )) {
        await FirestoreService.updateDocument<CalendarTemplate>(
          this.collectionName,
          existing.id,
          { isDefault: false, updatedAt: new Date() },
        );
      }
    }

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };
    return FirestoreService.updateDocument<CalendarTemplate>(
      this.collectionName,
      id,
      updatesWithTimestamp,
    );
  }

  static async deleteTemplate(id: string): Promise<void> {
    return FirestoreService.deleteDocument(this.collectionName, id);
  }
}

// Companionship Calendar operations
export class CompanionshipCalendarService {
  private static collectionName = "companionshipCalendars";

  static async getCalendarsByCompanionship(
    companionshipId: string,
  ): Promise<CompanionshipCalendar[]> {
    return FirestoreService.getDocuments<CompanionshipCalendar>(
      this.collectionName,
      [
        where("companionshipId", "==", companionshipId),
        where("isActive", "==", true),
        orderBy("startDate", "desc"),
      ],
    );
  }

  static async getActiveCalendarForCompanionship(
    companionshipId: string,
  ): Promise<CompanionshipCalendar | null> {
    const calendars = await this.getCalendarsByCompanionship(companionshipId);
    // Find the most recent active calendar
    const now = new Date();
    for (const calendar of calendars) {
      if (
        calendar.startDate <= now &&
        (!calendar.endDate || calendar.endDate >= now)
      ) {
        return calendar;
      }
    }
    return calendars.length > 0 ? calendars[0] : null;
  }

  static async getAllActiveCalendars(): Promise<CompanionshipCalendar[]> {
    return FirestoreService.getDocuments<CompanionshipCalendar>(
      this.collectionName,
      [where("isActive", "==", true), orderBy("startDate", "desc")],
    );
  }

  static async getCalendar(id: string): Promise<CompanionshipCalendar | null> {
    return FirestoreService.getDocument<CompanionshipCalendar>(
      this.collectionName,
      id,
    );
  }

  static async createCalendar(
    calendar: Omit<CompanionshipCalendar, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const calendarData = {
      ...calendar,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return FirestoreService.addDocument<CompanionshipCalendar>(
      this.collectionName,
      calendarData,
    );
  }

  static async updateCalendar(
    id: string,
    updates: Partial<
      Omit<CompanionshipCalendar, "id" | "createdAt" | "updatedAt">
    >,
  ): Promise<void> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };
    return FirestoreService.updateDocument<CompanionshipCalendar>(
      this.collectionName,
      id,
      updatesWithTimestamp,
    );
  }

  static async deleteCalendar(id: string): Promise<void> {
    return FirestoreService.deleteDocument(this.collectionName, id);
  }
}

export class SignupService {
  private static collectionName = "signups";

  static async getSignupsByUser(userId: string): Promise<Signup[]> {
    return FirestoreService.getDocuments<Signup>(this.collectionName, [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ]);
  }

  static async getSignupsBySlot(slotId: string): Promise<Signup[]> {
    return FirestoreService.getDocuments<Signup>(this.collectionName, [
      where("dinnerSlotId", "==", slotId),
      orderBy("createdAt"),
    ]);
  }

  static async getSignup(id: string): Promise<Signup | null> {
    return FirestoreService.getDocument<Signup>(this.collectionName, id);
  }

  static async createSignup(
    signup: Omit<Signup, "id" | "createdAt">,
  ): Promise<string> {
    const signupData = {
      ...signup,
      createdAt: new Date(),
    };
    return FirestoreService.addDocument<Signup>(
      this.collectionName,
      signupData,
    );
  }

  static async updateSignup(
    id: string,
    updates: Partial<Omit<Signup, "id" | "createdAt">>,
  ): Promise<void> {
    return FirestoreService.updateDocument<Signup>(
      this.collectionName,
      id,
      updates,
    );
  }

  static async deleteSignup(id: string): Promise<void> {
    return FirestoreService.deleteDocument(this.collectionName, id);
  }

  // Check if user already signed up for a slot
  static async hasUserSignedUp(
    userId: string,
    slotId: string,
  ): Promise<boolean> {
    const signups = await FirestoreService.getDocuments<Signup>(
      this.collectionName,
      [
        where("userId", "==", userId),
        where("dinnerSlotId", "==", slotId),
        limit(1),
      ],
    );
    return signups.length > 0;
  }
}
