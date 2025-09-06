import {
  CalendarTemplate,
  Companionship,
  CompanionshipCalendar,
  DinnerSlot,
  Missionary,
} from "@/types";
import {
  CalendarTemplateService,
  CompanionshipCalendarService,
  CompanionshipService,
  DinnerSlotService,
  MissionaryService,
} from "./firestore";

// Calendar utility functions
export class CalendarService {
  // Get the default template or create one if none exists
  static async ensureDefaultTemplate(): Promise<CalendarTemplate> {
    let defaultTemplate = await CalendarTemplateService.getDefaultTemplate();

    if (!defaultTemplate) {
      // Create a default template
      const templateId = await CalendarTemplateService.createTemplate({
        name: "Ward Default Schedule",
        description:
          "Default dinner schedule for all companionships - Monday through Saturday",
        daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday through Saturday
        isDefault: true,
        isActive: true,
        createdBy: "system",
      });

      defaultTemplate = await CalendarTemplateService.getTemplate(templateId);
      if (!defaultTemplate) {
        throw new Error("Failed to create default template");
      }
    }

    return defaultTemplate;
  }

  // Create calendar for a companionship using default template
  static async createCompanionshipCalendar(
    companionshipId: string,
    createdBy: string,
    startDate?: Date,
    templateId?: string,
  ): Promise<string> {
    const template = templateId
      ? await CalendarTemplateService.getTemplate(templateId)
      : await this.ensureDefaultTemplate();

    if (!template) {
      throw new Error("Calendar template not found");
    }

    const calendarData: Omit<
      CompanionshipCalendar,
      "id" | "createdAt" | "updatedAt"
    > = {
      companionshipId,
      name: `${template.name} (Copy)`,
      description: template.description,
      daysOfWeek: [...template.daysOfWeek], // Copy array
      startDate: startDate || new Date(),
      isActive: true,
      createdBy,
    };

    return await CompanionshipCalendarService.createCalendar(calendarData);
  }

  // Generate dinner slots for a companionship calendar
  static async generateSlotsForCalendar(
    calendar: CompanionshipCalendar,
    companionship: Companionship,
    startDate: Date,
    endDate: Date,
    createdBy: string,
  ): Promise<number> {
    // Use calendar's direct schedule settings
    const daysOfWeek = calendar.daysOfWeek;

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

      // Check if this day is included in the schedule
      if (daysOfWeek.includes(dayOfWeek)) {
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

  // Auto-generate slots for all active companionships that don't have calendars
  static async initializeCalendarsForAllCompanionships(
    createdBy: string,
  ): Promise<{
    calendarsCreated: number;
    slotsCreated: number;
  }> {
    const companionships = await CompanionshipService.getActiveCompanionships();
    let calendarsCreated = 0;
    let totalSlotsCreated = 0;

    // Generate slots for next 3 months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    for (const companionship of companionships) {
      // Check if companionship already has an active calendar
      const existingCalendar =
        await CompanionshipCalendarService.getActiveCalendarForCompanionship(
          companionship.id,
        );

      if (!existingCalendar) {
        // Create calendar for this companionship
        const calendarId = await this.createCompanionshipCalendar(
          companionship.id,
          createdBy,
          startDate,
        );
        calendarsCreated++;

        // Get the created calendar
        const newCalendar =
          await CompanionshipCalendarService.getCalendar(calendarId);
        if (newCalendar) {
          // Generate slots
          const slotsCreated = await this.generateSlotsForCalendar(
            newCalendar,
            companionship,
            startDate,
            endDate,
            createdBy,
          );
          totalSlotsCreated += slotsCreated;
        }
      }
    }

    return {
      calendarsCreated,
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

  // Extend calendar slots for a companionship
  static async extendCompanionshipCalendar(
    companionshipId: string,
    months: number,
    createdBy: string,
  ): Promise<number> {
    const calendar =
      await CompanionshipCalendarService.getActiveCalendarForCompanionship(
        companionshipId,
      );
    const companionship =
      await CompanionshipService.getCompanionship(companionshipId);

    if (!calendar || !companionship) {
      throw new Error("Companionship or calendar not found");
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

    return await this.generateSlotsForCalendar(
      calendar,
      companionship,
      startDate,
      endDate,
      createdBy,
    );
  }
}
