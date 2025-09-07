import { Companionship, DinnerSlot, Missionary } from "@/types";
import {
  CompanionshipService,
  DinnerSlotService,
  MissionaryService,
} from "./firestore";

// Calendar utility functions
export class CalendarService {
  // Generate dinner slots for a companionship based on their schedule
  static async generateSlotsForCompanionship(
    companionship: Companionship,
    startDate: Date,
    endDate: Date,
    createdBy: string,
  ): Promise<number> {
    const slotsCreated: Omit<DinnerSlot, "id" | "createdAt" | "updatedAt">[] =
      [];
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
        // Create one slot per day
        slotsCreated.push({
          companionshipId: companionship.id,
          date: new Date(currentDate),
          dayOfWeek: dayNames[dayOfWeek],
          status: "available",
          guestCount: companionship.missionaryIds.length || 2, // Default to 2 if no missionaries assigned yet
          notes: "",
          createdBy,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create all slots in batches
    let createdCount = 0;
    for (const slotData of slotsCreated) {
      await DinnerSlotService.createDinnerSlot(slotData);
      createdCount++;
    }

    return createdCount;
  }

  // Auto-generate slots for all active companionships
  static async initializeSlotsForAllCompanionships(createdBy: string): Promise<{
    slotsCreated: number;
  }> {
    const companionships = await CompanionshipService.getActiveCompanionships();
    let totalSlotsCreated = 0;

    // Generate slots for next 3 months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    for (const companionship of companionships) {
      // Generate slots for this companionship
      const slotsCreated = await this.generateSlotsForCompanionship(
        companionship,
        startDate,
        endDate,
        createdBy,
      );
      totalSlotsCreated += slotsCreated;
    }

    return {
      slotsCreated: totalSlotsCreated,
    };
  }

  // Get all dinner slots for a specific month across all companionships
  static async getSlotsForMonth(
    year: number,
    month: number,
  ): Promise<DinnerSlot[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month

    return await DinnerSlotService.getSlotsByDateRange(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    );
  }

  // Get all dinner slots for a specific companionship for a month
  static async getSlotsForCompanionshipMonth(
    companionshipId: string,
    year: number,
    month: number,
  ): Promise<DinnerSlot[]> {
    const allSlots =
      await DinnerSlotService.getSlotsByCompanionship(companionshipId);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    return allSlots.filter((slot) => {
      const slotDate = new Date(slot.date);
      return slotDate >= startDate && slotDate <= endDate;
    });
  }

  // Get enriched calendar data with companionship and missionary info
  static async getCalendarDataForMonth(
    year: number,
    month: number,
  ): Promise<{
    slots: DinnerSlot[];
    companionships: Map<string, Companionship>;
    missionaries: Map<string, Missionary>;
  }> {
    const slots = await this.getSlotsForMonth(year, month);
    const companionships = new Map<string, Companionship>();
    const missionaries = new Map<string, Missionary>();

    // Get all companionships referenced in slots
    const companionshipIds = [
      ...new Set(slots.map((slot) => slot.companionshipId)),
    ];
    const companionshipData = await Promise.all(
      companionshipIds.map((id) => CompanionshipService.getCompanionship(id)),
    );

    // Get all missionaries
    const allMissionaries = await MissionaryService.getActiveMissionaries();

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

  // Extend slots for a companionship
  static async extendCompanionshipSlots(
    companionshipId: string,
    months: number,
    createdBy: string,
  ): Promise<number> {
    const companionship =
      await CompanionshipService.getCompanionship(companionshipId);

    if (!companionship) {
      throw new Error("Companionship not found");
    }

    // Find the last existing slot date
    const existingSlots =
      await DinnerSlotService.getSlotsByCompanionship(companionshipId);
    let startDate = new Date();

    if (existingSlots.length > 0) {
      const lastSlotDate = new Date(
        Math.max(...existingSlots.map((slot) => new Date(slot.date).getTime())),
      );
      startDate = new Date(lastSlotDate);
      startDate.setDate(startDate.getDate() + 1); // Start from next day
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    return await this.generateSlotsForCompanionship(
      companionship,
      startDate,
      endDate,
      createdBy,
    );
  }
}
