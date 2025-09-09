import { Companionship, Missionary, Signup, VirtualDinnerSlot } from "@/types";
import {
  CompanionshipService,
  MissionaryService,
  SignupService,
} from "./firestore";

// Helper function to convert Firestore Timestamp or Date to Date object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDate = (dateValue: any): Date => {
  if (!dateValue) {
    throw new Error("Date value is null or undefined");
  }

  if (dateValue instanceof Date) {
    return dateValue;
  }

  // Firestore Timestamp with toDate method
  if (dateValue && typeof dateValue.toDate === "function") {
    return dateValue.toDate();
  }

  // Firestore Timestamp object format
  if (dateValue && typeof dateValue.seconds === "number") {
    return new Date(dateValue.seconds * 1000);
  }

  // String, number, or other format
  const parsedDate = new Date(dateValue);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date value: ${JSON.stringify(dateValue)}`);
  }

  return parsedDate;
};

// Dynamic slot generation service - creates virtual slots from companionship schedules
export class CalendarService {
  // Generate virtual slots for a companionship based on their available days
  static generateVirtualSlotsForCompanionship(
    companionship: Companionship,
    startDate: Date,
    endDate: Date,
  ): VirtualDinnerSlot[] {
    const virtualSlots: VirtualDinnerSlot[] = [];
    const currentDate = new Date(startDate);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      // Check if this day is included in the companionship's schedule
      if (companionship.daysOfWeek.includes(dayOfWeek)) {
        virtualSlots.push({
          companionshipId: companionship.id,
          date: new Date(currentDate),
          dayOfWeek: dayNames[dayOfWeek],
          guestCount: companionship.missionaryIds.length || 2,
          status: "available", // Will be updated with actual signup data
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return virtualSlots;
  }

  // Generate virtual slots for all active companionships in a given month
  static async getVirtualSlotsForMonth(
    year: number,
    month: number,
  ): Promise<VirtualDinnerSlot[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get all active companionships
    const companionships = await CompanionshipService.getAllCompanionships();

    // Generate virtual slots for all companionships
    const allVirtualSlots: VirtualDinnerSlot[] = [];

    for (const companionship of companionships) {
      const companionshipSlots = this.generateVirtualSlotsForCompanionship(
        companionship,
        startDate,
        endDate,
      );
      allVirtualSlots.push(...companionshipSlots);
    }

    // Get actual signups for this month to mark taken slots
    const signups = await SignupService.getSignupsInDateRange(
      startDate,
      endDate,
    );

    // Map signups by companionship + date for efficient lookup
    const signupMap = new Map<string, Signup>();
    signups.forEach((signup) => {
      try {
        const signupDate = toDate(signup.dinnerDate);
        const key = `${signup.companionshipId}-${signupDate.toDateString()}`;
        signupMap.set(key, signup);
      } catch (error) {
        console.error("Error processing signup date:", {
          signupId: signup.id,
          dinnerDate: signup.dinnerDate,
          dateType: typeof signup.dinnerDate,
          error: error,
        });
        // Skip this signup to prevent calendar from breaking
      }
    });

    // Mark slots as taken where signups exist
    allVirtualSlots.forEach((slot) => {
      const key = `${slot.companionshipId}-${slot.date.toDateString()}`;
      const signup = signupMap.get(key);
      if (signup) {
        slot.status = "taken";
        slot.signup = signup;
      }
    });

    return allVirtualSlots;
  }

  // Generate virtual slots for a specific companionship in a given month
  static async getVirtualSlotsForCompanionshipMonth(
    companionshipId: string,
    year: number,
    month: number,
  ): Promise<VirtualDinnerSlot[]> {
    const companionship =
      await CompanionshipService.getCompanionship(companionshipId);
    if (!companionship) {
      return [];
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const virtualSlots = this.generateVirtualSlotsForCompanionship(
      companionship,
      startDate,
      endDate,
    );

    // Check for existing signups for this companionship
    const signups = await SignupService.getSignupsByCompanionshipInDateRange(
      companionshipId,
      startDate,
      endDate,
    );

    // Map existing signups by date
    const signupMap = new Map<string, Signup>();
    signups.forEach((signup) => {
      try {
        const signupDate = toDate(signup.dinnerDate);
        const key = signupDate.toDateString();
        signupMap.set(key, signup);
      } catch (error) {
        console.error("Error processing signup date:", {
          signupId: signup.id,
          dinnerDate: signup.dinnerDate,
          dateType: typeof signup.dinnerDate,
          error: error,
        });
        // Skip this signup to prevent calendar from breaking
      }
    });

    // Mark slots as taken where signups exist
    virtualSlots.forEach((slot) => {
      const signup = signupMap.get(slot.date.toDateString());
      if (signup) {
        slot.status = "taken";
        slot.signup = signup;
      }
    });

    return virtualSlots;
  }

  // Get complete calendar data: virtual slots + companionship/missionary details
  static async getCalendarDataForMonth(
    year: number,
    month: number,
  ): Promise<{
    slots: VirtualDinnerSlot[];
    companionships: Map<string, Companionship>;
    missionaries: Map<string, Missionary>;
  }> {
    const slots = await this.getVirtualSlotsForMonth(year, month);
    const companionships = new Map<string, Companionship>();
    const missionaries = new Map<string, Missionary>();

    // Load companionship details for all slots
    const companionshipIds = [
      ...new Set(slots.map((slot) => slot.companionshipId)),
    ];

    const companionshipData = await Promise.all(
      companionshipIds.map((id) => CompanionshipService.getCompanionship(id)),
    );

    // Get all missionaries
    const allMissionaries = await MissionaryService.getAllMissionaries();

    // Build maps for quick lookup
    companionshipData.forEach((companionship) => {
      if (companionship) {
        companionships.set(companionship.id, companionship);
      }
    });

    allMissionaries.forEach((missionary) => {
      missionaries.set(missionary.id, missionary);
    });

    return {
      slots,
      companionships,
      missionaries,
    };
  }

  // Check if a virtual slot is available (no existing signup)
  static async isSlotAvailable(
    companionshipId: string,
    date: Date,
  ): Promise<boolean> {
    // Look for existing signup on this date
    const existingSignup = await SignupService.getSignupByCompanionshipAndDate(
      companionshipId,
      date,
    );

    return !existingSignup;
  }

  // Check if companionship is available on a specific date
  static async getCompanionshipAvailabilityForDate(
    companionshipId: string,
    date: Date,
  ): Promise<boolean> {
    const companionship =
      await CompanionshipService.getCompanionship(companionshipId);
    if (!companionship) {
      return false;
    }

    const dayOfWeek = date.getDay();
    return companionship.daysOfWeek.includes(dayOfWeek);
  }
}
