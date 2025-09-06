import {
  DinnerSlot,
  DinnerSlotFilters,
  DinnerSlotWithMissionary,
  FirestoreTimestamp,
  Missionary,
  Signup,
  SignupFilters,
  SignupFormData,
  SignupWithDetails,
} from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";

// Helper function to convert Firestore timestamp to Date
const timestampToDate = (timestamp: FirestoreTimestamp | Timestamp): Date => {
  if (
    timestamp &&
    "toDate" in timestamp &&
    typeof timestamp.toDate === "function"
  ) {
    return timestamp.toDate();
  }
  if (timestamp && "seconds" in timestamp && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date();
};

// Missionaries
export const getMissionaries = async (): Promise<Missionary[]> => {
  try {
    const missionariesQuery = query(
      collection(db, "missionaries"),
      where("isActive", "==", true),
      orderBy("name"),
    );
    const snapshot = await getDocs(missionariesQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as Missionary;
    });
  } catch (error) {
    console.error("Error fetching missionaries:", error);
    throw error;
  }
};

export const getMissionary = async (id: string): Promise<Missionary | null> => {
  try {
    const docRef = doc(db, "missionaries", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as Missionary;
  } catch (error) {
    console.error("Error fetching missionary:", error);
    throw error;
  }
};

// Dinner Slots
export const getAvailableDinnerSlots = async (
  filters: DinnerSlotFilters = {},
): Promise<DinnerSlotWithMissionary[]> => {
  try {
    const slotsQuery = collection(db, "dinnerSlots");
    const constraints: Parameters<typeof query>[1][] = [];

    // Filter by status (available only if specified)
    if (filters.availableOnly !== false) {
      constraints.push(where("status", "==", "available"));
    }

    // Filter by missionary
    if (filters.missionaryId) {
      constraints.push(where("missionaryId", "==", filters.missionaryId));
    }

    // Filter by date range
    if (filters.dateFrom) {
      constraints.push(
        where("date", ">=", Timestamp.fromDate(filters.dateFrom)),
      );
    }
    if (filters.dateTo) {
      constraints.push(where("date", "<=", Timestamp.fromDate(filters.dateTo)));
    }

    // Order by date
    constraints.push(orderBy("date", "asc"));

    const q = query(slotsQuery, ...constraints);
    const snapshot = await getDocs(q);

    const slots: DinnerSlot[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: timestampToDate(data.date),
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as DinnerSlot;
    });

    // Get missionaries for each slot
    const missionaryIds = [...new Set(slots.map((slot) => slot.missionaryId))];
    const missionaries = await Promise.all(
      missionaryIds.map((id) => getMissionary(id)),
    );
    const missionaryMap = new Map(
      missionaries.filter(Boolean).map((m) => [m!.id, m!]),
    );

    // Combine slots with missionary data
    const slotsWithMissionaries: DinnerSlotWithMissionary[] = slots
      .filter((slot) => missionaryMap.has(slot.missionaryId))
      .map((slot) => ({
        ...slot,
        missionary: missionaryMap.get(slot.missionaryId)!,
      }));

    // Apply additional filters that require missionary data
    const filteredSlots = slotsWithMissionaries;

    // TODO: Update these filters to work with companionship-based model
    // if (filters.area) {
    //   filteredSlots = filteredSlots.filter((slot) =>
    //     slot.missionary.area
    //       .toLowerCase()
    //       .includes(filters.area!.toLowerCase()),
    //   );
    // }

    // if (filters.zone) {
    //   filteredSlots = filteredSlots.filter((slot) =>
    //     slot.missionary.zone
    //       ?.toLowerCase()
    //       .includes(filters.zone!.toLowerCase()),
    //   );
    // }

    // if (filters.district) {
    //   filteredSlots = filteredSlots.filter((slot) =>
    //     slot.missionary.district
    //       ?.toLowerCase()
    //       .includes(filters.district!.toLowerCase()),
    //   );
    // }

    return filteredSlots;
  } catch (error) {
    console.error("Error fetching dinner slots:", error);
    throw error;
  }
};

export const getDinnerSlot = async (id: string): Promise<DinnerSlot | null> => {
  try {
    const docRef = doc(db, "dinnerSlots", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: timestampToDate(data.date),
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as DinnerSlot;
  } catch (error) {
    console.error("Error fetching dinner slot:", error);
    throw error;
  }
};

// Signups
export const createSignup = async (
  userId: string,
  formData: SignupFormData,
): Promise<Signup> => {
  try {
    // Get the dinner slot details
    const dinnerSlot = await getDinnerSlot(formData.dinnerSlotId);
    if (!dinnerSlot) {
      throw new Error("Dinner slot not found");
    }

    if (dinnerSlot.status !== "available") {
      throw new Error("Dinner slot is no longer available");
    }

    // Get missionary details
    const missionary = await getMissionary(dinnerSlot.missionaryId);
    if (!missionary) {
      throw new Error("Missionary not found");
    }

    // Get user details from auth (we'll need to pass this in)
    // For now, we'll get it from the current user document
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    const userData = userDoc.data();

    // Create signup document
    const signupData = {
      userId,
      userName: userData.name,
      userEmail: userData.email,
      userPhone: formData.userPhone || userData.phone || "",
      dinnerSlotId: formData.dinnerSlotId,
      missionaryId: dinnerSlot.missionaryId,
      missionaryName: missionary.name,
      dinnerDate: Timestamp.fromDate(dinnerSlot.date),
      dinnerTime: dinnerSlot.time,
      guestCount: formData.guestCount,
      status: "confirmed" as const,
      specialRequests: formData.specialRequests || "",
      contactPreference: formData.contactPreference,
      reminderSent: false,
      notes: formData.notes || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Create the signup
    const signupRef = await addDoc(collection(db, "signups"), signupData);

    // Update the dinner slot to mark it as assigned
    const slotUpdateData = {
      status: "assigned" as const,
      assignedUserId: userId,
      assignedUserName: userData.name,
      assignedUserEmail: userData.email,
      assignedUserPhone: formData.userPhone || userData.phone || "",
      specialRequests: formData.specialRequests || "",
      updatedAt: serverTimestamp(),
    };

    await updateDoc(
      doc(db, "dinnerSlots", formData.dinnerSlotId),
      slotUpdateData,
    );

    // Return the created signup
    const createdSignup = await getDoc(signupRef);
    const createdData = createdSignup.data()!;

    return {
      id: signupRef.id,
      ...createdData,
      dinnerDate: timestampToDate(createdData.dinnerDate),
      createdAt: timestampToDate(createdData.createdAt),
      updatedAt: timestampToDate(createdData.updatedAt),
    } as Signup;
  } catch (error) {
    console.error("Error creating signup:", error);
    throw error;
  }
};

export const getUserSignups = async (
  userId: string,
  filters: SignupFilters = {},
): Promise<SignupWithDetails[]> => {
  try {
    const constraints: Parameters<typeof query>[1][] = [
      where("userId", "==", userId),
      orderBy("dinnerDate", "desc"),
    ];

    if (filters.status) {
      constraints.push(where("status", "==", filters.status));
    }

    if (filters.dateFrom) {
      constraints.push(
        where("dinnerDate", ">=", Timestamp.fromDate(filters.dateFrom)),
      );
    }

    if (filters.dateTo) {
      constraints.push(
        where("dinnerDate", "<=", Timestamp.fromDate(filters.dateTo)),
      );
    }

    const q = query(collection(db, "signups"), ...constraints);
    const snapshot = await getDocs(q);

    const signups: Signup[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dinnerDate: timestampToDate(data.dinnerDate),
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as Signup;
    });

    // Get missionary and dinner slot details for each signup
    const signupsWithDetails = await Promise.all(
      signups.map(async (signup) => {
        const [missionary, dinnerSlot] = await Promise.all([
          getMissionary(signup.missionaryId),
          getDinnerSlot(signup.dinnerSlotId),
        ]);

        return {
          ...signup,
          missionary: missionary!,
          dinnerSlot: dinnerSlot!,
        };
      }),
    );

    return signupsWithDetails.filter(
      (signup) => signup.missionary && signup.dinnerSlot,
    );
  } catch (error) {
    console.error("Error fetching user signups:", error);
    throw error;
  }
};

export const updateSignup = async (
  signupId: string,
  updates: Partial<Signup>,
): Promise<void> => {
  try {
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Remove undefined values to avoid Firestore errors
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Convert dates to timestamps
    if (updates.dinnerDate) {
      updateData.dinnerDate = Timestamp.fromDate(updates.dinnerDate);
    }

    await updateDoc(doc(db, "signups", signupId), updateData);
  } catch (error) {
    console.error("Error updating signup:", error);
    throw error;
  }
};

export const cancelSignup = async (signupId: string): Promise<void> => {
  try {
    // Get the signup details
    const signupDoc = await getDoc(doc(db, "signups", signupId));
    if (!signupDoc.exists()) {
      throw new Error("Signup not found");
    }

    const signup = signupDoc.data() as Signup;

    // Update signup status to cancelled
    await updateDoc(doc(db, "signups", signupId), {
      status: "cancelled",
      updatedAt: serverTimestamp(),
    });

    // Update the dinner slot to make it available again
    await updateDoc(doc(db, "dinnerSlots", signup.dinnerSlotId), {
      status: "available",
      assignedUserId: null,
      assignedUserName: null,
      assignedUserEmail: null,
      assignedUserPhone: null,
      specialRequests: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error cancelling signup:", error);
    throw error;
  }
};

export const deleteSignup = async (signupId: string): Promise<void> => {
  try {
    await cancelSignup(signupId); // This will free up the dinner slot
    await deleteDoc(doc(db, "signups", signupId));
  } catch (error) {
    console.error("Error deleting signup:", error);
    throw error;
  }
};

// Helper function to check if a user can sign up for a slot
export const canUserSignUpForSlot = async (
  userId: string,
  dinnerSlotId: string,
): Promise<boolean> => {
  try {
    // Check if slot is still available
    const dinnerSlot = await getDinnerSlot(dinnerSlotId);
    if (!dinnerSlot || dinnerSlot.status !== "available") {
      return false;
    }

    // Check if user already has a signup for the same date
    const sameDaySignupsQuery = query(
      collection(db, "signups"),
      where("userId", "==", userId),
      where("dinnerDate", "==", Timestamp.fromDate(dinnerSlot.date)),
      where("status", "in", ["confirmed", "pending"]),
    );

    const sameDaySignups = await getDocs(sameDaySignupsQuery);
    return sameDaySignups.empty;
  } catch (error) {
    console.error("Error checking if user can sign up:", error);
    return false;
  }
};
