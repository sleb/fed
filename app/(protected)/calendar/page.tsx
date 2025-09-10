"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { CalendarService } from "@/lib/firebase/calendar";
import {
  CompanionshipService,
  MissionaryService,
  SignupService,
} from "@/lib/firebase/firestore";
import { Companionship, Missionary, Signup, VirtualDinnerSlot } from "@/types";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { useCallback, useEffect, useState } from "react";

// Debug function to check database state
const debugDatabaseState = async () => {
  try {
    console.log("🔍 Debug: Checking database state...");

    // Check companionships
    const companionships = await CompanionshipService.getAllCompanionships();
    console.log("🤝 Active companionships:", companionships.length);

    // Check missionaries
    const missionaries = await MissionaryService.getAllMissionaries();
    console.log("👥 Active missionaries:", missionaries.length);

    // Check signups
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    const signups = await SignupService.getSignupsInDateRange(now, endDate);
    console.log("📝 Recent signups:", signups.length);

    return { companionships, missionaries, signups };
  } catch (error) {
    console.error("❌ Debug error:", error);
    return null;
  }
};

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  slots: VirtualDinnerSlot[];
}

interface MiniCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasAvailableSlots: boolean;
  hasUserSignup: boolean;
  hasTakenSlots: boolean;
  isSelected: boolean;
  isInSelectedWeek: boolean;
  isToday: boolean;
}

export default function CalendarPage() {
  const { user, userData } = useAuth();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedCompanionshipId, setSelectedCompanionshipId] =
    useState<string>("all");
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [miniCalendarDays, setMiniCalendarDays] = useState<MiniCalendarDay[]>(
    [],
  );
  const [slots, setSlots] = useState<VirtualDinnerSlot[]>([]);
  const [companionships, setCompanionships] = useState<
    Map<string, Companionship>
  >(new Map());
  const [missionaries, setMissionaries] = useState<Map<string, Missionary>>(
    new Map(),
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedSlot, setSelectedSlot] = useState<VirtualDinnerSlot | null>(
    null,
  );
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [selectedSignup, setSelectedSignup] = useState<Signup | null>(null);
  const [contactInfoOpen, setContactInfoOpen] = useState(false);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Display preferences
  const [displayMode, setDisplayMode] = useState<"area" | "name">("area");

  // Form state
  const [signupForm, setSignupForm] = useState({
    userPhone: "",
    contactPreference: "email" as "email" | "phone" | "both",
    notes: "",
  });

  // Subscribe to real-time calendar data updates
  useEffect(() => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    console.log(`🔍 Subscribing to calendar data for ${year}-${month + 1}`);

    const unsubscribe = CalendarService.subscribeToCalendarDataForMonth(
      year,
      month,
      (calendarData) => {
        console.log("📊 Real-time calendar data received:", {
          slots: calendarData.slots.length,
          companionships: calendarData.companionships.size,
          missionaries: calendarData.missionaries.size,
        });

        setSlots(calendarData.slots);
        setCompanionships(calendarData.companionships);
        setMissionaries(calendarData.missionaries);
        setLoading(false);

        // Run debug check if no slots found
        if (calendarData.slots.length === 0) {
          console.log(
            "⚠️ No virtual slots generated for current month, running debug check...",
          );
          debugDatabaseState();
        }
      },
      (error) => {
        console.error("Error in calendar data subscription:", error);
        setError("Failed to load calendar data");
        setLoading(false);
      },
    );

    return () => {
      console.log("🔌 Unsubscribing from calendar data");
      unsubscribe();
    };
  }, [user, currentDate]);

  const generateCalendarGrid = useCallback(() => {
    console.log("🗓️ Generating calendar grid...");

    // Filter slots by selected companionship
    const filteredSlots =
      selectedCompanionshipId === "all"
        ? slots
        : slots.filter(
            (slot) => slot.companionshipId === selectedCompanionshipId,
          );

    console.log("📅 Total virtual slots available:", slots.length);
    console.log("🔍 Filtered slots for companionship:", filteredSlots.length);

    if (filteredSlots.length > 0) {
      console.log(
        "📅 Sample slot dates:",
        filteredSlots.slice(0, 3).map((slot) => ({
          companionshipId: slot.companionshipId,
          date: slot.date.toDateString(),
          status: slot.status,
        })),
      );
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the first Sunday before or on the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // End on the last Saturday after or on the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days: CalendarDay[] = [];
    const currentDay = new Date(startDate);
    let totalSlotsFound = 0;

    while (currentDay <= endDate) {
      const dateStr = currentDay.toDateString();

      const daySlots = filteredSlots.filter((slot) => {
        const slotDateStr = slot.date.toDateString();
        const matches = slotDateStr === dateStr;

        if (matches) {
          totalSlotsFound++;
        }

        return matches;
      });

      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        slots: daySlots,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    console.log(
      `🗓️ Calendar grid generated: ${days.length} days, ${totalSlotsFound} slots matched`,
    );

    // Debug: Show days with slots
    const daysWithSlots = days.filter((day) => day.slots.length > 0);
    console.log(`📅 Days with slots: ${daysWithSlots.length}`);
    if (daysWithSlots.length > 0) {
      console.log(
        "📅 Sample days with slots:",
        daysWithSlots.slice(0, 3).map((day) => ({
          date: day.date.toDateString(),
          slotsCount: day.slots.length,
          slots: day.slots.map((slot) => ({
            companionshipId: slot.companionshipId,
            status: slot.status,
            hasSignup: !!slot.signup,
          })),
        })),
      );
    }

    setCalendarDays(days);
  }, [currentDate, slots, selectedCompanionshipId]);

  // Generate calendar grid
  useEffect(() => {
    generateCalendarGrid();
  }, [generateCalendarGrid]);

  // Check if user is signed up for a slot
  const isUserSignedUpForSlot = useCallback(
    (slot: VirtualDinnerSlot) => {
      return slot.signup && slot.signup.userId === user?.uid;
    },
    [user?.uid],
  );

  // Generate mini calendar for navigation widget
  const generateMiniCalendar = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Calculate week range for highlighting
    const selectedWeekStart = new Date(selectedDate);
    selectedWeekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
    const selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6);

    const miniDays = [];
    const current = new Date(startDate);

    // Filter slots for mini calendar
    const filteredSlots =
      selectedCompanionshipId === "all"
        ? slots
        : slots.filter(
            (slot) => slot.companionshipId === selectedCompanionshipId,
          );

    while (current <= lastDay || miniDays.length < 42) {
      const daySlots = filteredSlots.filter(
        (slot) => slot.date.toDateString() === current.toDateString(),
      );

      // Check slot status for this day
      const availableSlots = daySlots.filter(
        (slot) => slot.status === "available",
      );

      // Check if user has signed up for this day (any companionship)
      const userSignupSlots = slots.filter(
        (slot) =>
          slot.date.toDateString() === current.toDateString() &&
          isUserSignedUpForSlot(slot),
      );

      // Check if there are taken slots (someone else signed up)
      const takenSlots = daySlots.filter((slot) => slot.status === "taken");

      const isInSelectedWeek =
        viewMode === "week" &&
        current >= selectedWeekStart &&
        current <= selectedWeekEnd;

      miniDays.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        hasAvailableSlots: availableSlots.length > 0,
        hasUserSignup: userSignupSlots.length > 0,
        hasTakenSlots: takenSlots.length > 0,
        isSelected: current.toDateString() === selectedDate.toDateString(),
        isInSelectedWeek,
        isToday: current.toDateString() === new Date().toDateString(),
      });

      current.setDate(current.getDate() + 1);
      if (miniDays.length >= 42) break;
    }

    return miniDays;
  }, [
    currentDate,
    selectedDate,
    slots,
    viewMode,
    selectedCompanionshipId,
    isUserSignedUpForSlot,
  ]);

  // Update mini calendar when dependencies change
  useEffect(() => {
    setMiniCalendarDays(generateMiniCalendar());
  }, [generateMiniCalendar]);

  // Get filtered days based on view mode
  const getFilteredDays = useCallback(() => {
    switch (viewMode) {
      case "day":
        return calendarDays.filter(
          (day) => day.date.toDateString() === selectedDate.toDateString(),
        );
      case "week":
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return calendarDays.filter(
          (day) => day.date >= startOfWeek && day.date <= endOfWeek,
        );
      default:
        return calendarDays;
    }
  }, [calendarDays, selectedDate, viewMode]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewChange = (mode: "month" | "week" | "day") => {
    setViewMode(mode);
    // Remember user preference
    localStorage.setItem("calendar-view-mode", mode);
  };

  const handleCompanionshipFilterChange = (companionshipId: string) => {
    setSelectedCompanionshipId(companionshipId);
    // Remember user preference
    localStorage.setItem("calendar-companionship-filter", companionshipId);
  };

  // Load saved preferences
  useEffect(() => {
    const savedMode = localStorage.getItem("calendar-view-mode") as
      | "month"
      | "week"
      | "day";
    if (savedMode) {
      setViewMode(savedMode);
    }

    const savedFilter = localStorage.getItem("calendar-companionship-filter");
    if (savedFilter) {
      setSelectedCompanionshipId(savedFilter);
    }

    const savedDisplayMode = localStorage.getItem("calendar-display-mode") as
      | "area"
      | "name";
    if (savedDisplayMode) {
      setDisplayMode(savedDisplayMode);
    }
  }, []);

  const getCompanionshipDisplayName = (companionship: Companionship) => {
    if (displayMode === "area") {
      return companionship.area;
    }
    return getCompanionshipName(companionship);
  };

  const getCompanionshipName = (companionship: Companionship) => {
    const companionshipMissionaries = companionship.missionaryIds
      .map((id) => missionaries.get(id))
      .filter(Boolean);

    if (companionshipMissionaries.length === 0) {
      return "No Missionaries";
    }
    if (companionshipMissionaries.length === 1) {
      return companionshipMissionaries[0]!.name;
    }
    return companionshipMissionaries
      .map((m) => m!.name)
      .sort()
      .join(" & ");
  };

  const getAggregatedAllergies = (companionship: Companionship) => {
    const companionshipMissionaries = companionship.missionaryIds
      .map((id) => missionaries.get(id))
      .filter(Boolean);

    const allergiesSet = new Set<string>();
    companionshipMissionaries.forEach((missionary) => {
      if (missionary?.allergies) {
        missionary.allergies.forEach((allergy) => allergiesSet.add(allergy));
      }
    });

    return Array.from(allergiesSet);
  };

  const getAggregatedPreferences = (companionship: Companionship) => {
    const companionshipMissionaries = companionship.missionaryIds
      .map((id) => missionaries.get(id))
      .filter(Boolean);

    const preferencesSet = new Set<string>();
    companionshipMissionaries.forEach((missionary) => {
      if (missionary?.dinnerPreferences) {
        missionary.dinnerPreferences.forEach((pref) =>
          preferencesSet.add(pref),
        );
      }
    });

    return Array.from(preferencesSet);
  };

  const getAggregatedNotes = (companionship: Companionship) => {
    const companionshipMissionaries = companionship.missionaryIds
      .map((id) => missionaries.get(id))
      .filter(Boolean);

    return companionshipMissionaries
      .map((missionary) => missionary?.notes)
      .filter(Boolean)
      .join("; ");
  };

  const getUserSignupForSlot = (slot: VirtualDinnerSlot) => {
    return slot.signup && slot.signup.userId === user?.uid ? slot.signup : null;
  };

  const handleSlotClick = (slot: VirtualDinnerSlot) => {
    const companionship = companionships.get(slot.companionshipId);
    if (!companionship) return;

    setSelectedSlot(slot);

    if (isUserSignedUpForSlot(slot)) {
      // User has signed up for this slot - show modify modal
      const userSignup = getUserSignupForSlot(slot);
      setSelectedSignup(userSignup);
      setSignupForm({
        userPhone: userSignup?.userPhone || "",
        contactPreference: userSignup?.contactPreference || "email",
        notes: userSignup?.notes || "",
      });
      setShowModifyModal(true);
    } else if (slot.status === "available") {
      // Slot is available - show signup modal with user's saved preferences
      const contactMethod = userData?.preferences?.contactMethod || "email";
      const mappedContactPreference =
        contactMethod === "sms" ? "phone" : contactMethod;

      setSignupForm({
        userPhone: userData?.phone || "",
        contactPreference: mappedContactPreference,
        notes: "",
      });
      setContactInfoOpen(false);
      setAdditionalInfoOpen(false);
      setShowSignupModal(true);
    }
  };

  const handleSignup = async () => {
    if (!selectedSlot || !user) return;

    setSaving(true);
    try {
      const companionship = companionships.get(selectedSlot.companionshipId);
      if (!companionship) {
        throw new Error("Companionship not found");
      }

      // Create signup with embedded slot information
      await SignupService.createSignup({
        userId: user.uid,
        userName: user.displayName || user.email || "Unknown User",
        userEmail: user.email || "",
        userPhone: signupForm.userPhone,
        companionshipId: selectedSlot.companionshipId,
        dinnerDate: selectedSlot.date,
        dayOfWeek: selectedSlot.dayOfWeek,
        guestCount: selectedSlot.guestCount,
        status: "confirmed",
        contactPreference: signupForm.contactPreference,
        reminderSent: false,
        notes: signupForm.notes,
        updatedAt: new Date(),
      });

      setShowSignupModal(false);
      setSelectedSlot(null);
      setContactInfoOpen(false);
      setAdditionalInfoOpen(false);
    } catch (error) {
      console.error("Signup error:", error);
      alert("Failed to sign up. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleModifySignup = async () => {
    if (!selectedSignup) return;

    setSaving(true);
    try {
      await SignupService.updateSignup(selectedSignup.id, {
        userPhone: signupForm.userPhone,
        contactPreference: signupForm.contactPreference,
        notes: signupForm.notes,
        updatedAt: new Date(),
      });

      setShowModifyModal(false);
      setSelectedSlot(null);
      setSelectedSignup(null);
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update signup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSignup = async () => {
    if (!selectedSignup) return;

    setSaving(true);
    try {
      await SignupService.deleteSignup(selectedSignup.id);

      setShowModifyModal(false);
      setSelectedSlot(null);
      setSelectedSignup(null);
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel signup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
          <p className="mt-4 text-lg text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Mobile Header */}
        <div className="md:hidden mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dinner Calendar
          </h1>
          <p className="text-gray-600">
            Sign up to provide dinner for our missionaries
          </p>
        </div>

        {/* Mobile Navigation Widget */}
        <div className="md:hidden bg-white rounded-xl shadow-xl border p-6 mb-8">
          <div className="flex flex-col gap-6">
            {/* Mini Calendar - Mobile Only */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-bold text-gray-900">
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mini calendar grid */}
                <div className="grid grid-cols-7 gap-2 p-3 bg-gray-50 rounded-lg">
                  {[
                    { short: "S", key: "sun" },
                    { short: "M", key: "mon" },
                    { short: "T", key: "tue" },
                    { short: "W", key: "wed" },
                    { short: "T", key: "thu" },
                    { short: "F", key: "fri" },
                    { short: "S", key: "sat" },
                  ].map((day) => (
                    <div
                      key={day.key}
                      className="text-xs text-center text-gray-600 font-medium p-1"
                    >
                      {day.short}
                    </div>
                  ))}
                  {miniCalendarDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day.date)}
                      className={`
                        text-xs p-2 rounded transition-colors relative
                        ${
                          !day.isCurrentMonth
                            ? "text-gray-300"
                            : day.isSelected
                              ? "bg-purple-500 text-white"
                              : day.isInSelectedWeek
                                ? "bg-purple-200 text-purple-800 font-medium"
                                : day.hasUserSignup
                                  ? "bg-blue-100 text-blue-700 font-medium"
                                  : day.isToday
                                    ? "bg-gray-100 text-gray-700 font-medium"
                                    : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {day.date.getDate()}
                      {day.isCurrentMonth &&
                        (day.hasAvailableSlots ||
                          day.hasUserSignup ||
                          day.hasTakenSlots) && (
                          <div
                            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                              day.hasUserSignup
                                ? "bg-blue-400"
                                : day.hasAvailableSlots
                                  ? "bg-green-400"
                                  : "bg-gray-400"
                            }`}
                          ></div>
                        )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {viewMode === "day"
                    ? selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : viewMode === "week"
                      ? `Week of ${selectedDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`
                      : currentDate.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                {/* Companionship Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Filter by Companionship
                  </label>
                  <Select
                    value={selectedCompanionshipId}
                    onValueChange={handleCompanionshipFilterChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companionships</SelectItem>
                      {Array.from(companionships.entries()).map(
                        ([id, companionship]) => (
                          <SelectItem key={id} value={id}>
                            {getCompanionshipDisplayName(companionship)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* View mode buttons */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    View Mode
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleViewChange("month")}
                      className={`
                        flex-1 py-2 text-sm font-medium rounded-md transition-colors
                        ${
                          viewMode === "month"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }
                      `}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => handleViewChange("week")}
                      className={`
                        flex-1 py-2 text-sm font-medium rounded-md transition-colors
                        ${
                          viewMode === "week"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }
                      `}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => handleViewChange("day")}
                      className={`
                        flex-1 py-2 text-sm font-medium rounded-md transition-colors
                        ${
                          viewMode === "day"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }
                      `}
                    >
                      Day
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header & Controls */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h1>
              <p className="text-gray-600 mt-1">
                Sign up to provide dinner for our missionaries
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Companionship Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Filter by Companionship:
              </label>
              <Select
                value={selectedCompanionshipId}
                onValueChange={handleCompanionshipFilterChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companionships</SelectItem>
                  {Array.from(companionships.entries()).map(
                    ([id, companionship]) => (
                      <SelectItem key={id} value={id}>
                        {getCompanionshipDisplayName(companionship)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newMode = displayMode === "area" ? "name" : "area";
                setDisplayMode(newMode);
                localStorage.setItem("calendar-display-mode", newMode);
              }}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {displayMode === "area" ? "Show Names" : "Show Areas"}
            </Button>
          </div>
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <div
                key={day}
                className="p-3 text-center font-medium text-gray-700"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${
                  !day.isCurrentMonth ? "bg-gray-50" : ""
                }`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    !day.isCurrentMonth ? "text-gray-400" : "text-gray-900"
                  }`}
                >
                  {day.date.getDate()}
                </div>

                {/* Slots for this day */}
                <div className="space-y-1">
                  {day.slots.map((slot) => {
                    const companionship = companionships.get(
                      slot.companionshipId,
                    );
                    if (!companionship) return null;

                    const isUserSignup = isUserSignedUpForSlot(slot);
                    const statusColor = isUserSignup
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : slot.status === "taken"
                        ? "bg-gray-100 border-gray-300 text-gray-600"
                        : "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer";

                    return (
                      <div
                        key={`${slot.companionshipId}-${slot.date.getTime()}`}
                        className={`text-xs p-2 rounded border ${statusColor}`}
                        onClick={() => handleSlotClick(slot)}
                      >
                        <div className="font-medium truncate">
                          {getCompanionshipDisplayName(companionship)}
                        </div>
                        <div className="opacity-75">
                          {isUserSignup
                            ? "Your Signup"
                            : slot.status === "taken"
                              ? "Taken"
                              : "Available"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden space-y-4">
          {getFilteredDays()
            .filter((day) => day.slots.length > 0)
            .map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="bg-white rounded-lg shadow-lg border"
              >
                <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
                  <h3 className="text-xl font-bold text-gray-900">
                    {day.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {day.slots.map((slot) => {
                      const companionship = companionships.get(
                        slot.companionshipId,
                      );
                      if (!companionship) return null;

                      const isUserSignup = isUserSignedUpForSlot(slot);
                      const statusColor = isUserSignup
                        ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                        : slot.status === "taken"
                          ? "border-gray-200 bg-gray-50"
                          : "border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer";

                      return (
                        <div
                          key={`${slot.companionshipId}-${slot.date.getTime()}`}
                          className={`p-5 rounded-lg border-2 ${statusColor} transition-all duration-200 hover:shadow-md ${
                            slot.status === "available" || isUserSignup
                              ? "hover:scale-[1.02] active:scale-[0.98]"
                              : ""
                          }`}
                          onClick={() => handleSlotClick(slot)}
                        >
                          <div className="space-y-3">
                            <div>
                              <div className="font-bold text-lg text-gray-900 mb-1">
                                {getCompanionshipDisplayName(companionship)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {companionship.area}
                              </div>
                              <div className="text-sm text-gray-500">
                                {companionship.address}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="text-sm text-gray-600">
                                {slot.guestCount}{" "}
                                {slot.guestCount === 1 ? "guest" : "guests"}
                              </div>
                              <div className="flex items-center">
                                {isUserSignup ? (
                                  <div className="flex items-center gap-1 text-blue-600 font-semibold">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    Your Signup
                                  </div>
                                ) : slot.status === "available" ? (
                                  <div className="flex items-center gap-1 text-green-600 font-semibold">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    Available
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-gray-500 font-medium">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    Taken
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

          {getFilteredDays().filter((day) => day.slots.length > 0).length ===
            0 && (
            <div className="bg-white rounded-lg shadow-lg border p-12 text-center">
              <div className="mx-auto w-16 h-16 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No dinner slots available
              </h3>
              <div className="text-gray-500 mb-4">
                No dinner slots found for this month
                {selectedCompanionshipId !== "all" && (
                  <span> for the selected companionship</span>
                )}
              </div>
              <div className="text-sm text-gray-400 max-w-md mx-auto">
                {selectedCompanionshipId !== "all"
                  ? "Try selecting 'All Companionships' or choose a different month"
                  : "Check back later or contact your admin about setting up companionship schedules"}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Empty State */}
        <div className="hidden md:block">
          {calendarDays.every((day) => day.slots.length === 0) && (
            <div className="bg-white rounded-lg shadow-lg border p-12 text-center">
              <div className="mx-auto w-16 h-16 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No dinner slots available
              </h3>
              <div className="text-gray-500 mb-4">
                No dinner slots found for this month
                {selectedCompanionshipId !== "all" && (
                  <span> for the selected companionship</span>
                )}
              </div>
              <div className="text-sm text-gray-400 max-w-md mx-auto">
                {selectedCompanionshipId !== "all"
                  ? "Try selecting 'All Companionships' or choose a different month"
                  : "Check back later or contact your admin about setting up companionship schedules"}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border p-6">
          <h4 className="text-lg font-semibold text-gray-900 text-center mb-4">
            Legend
          </h4>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm font-medium text-gray-700">
                Available
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-sm font-medium text-gray-700">
                Your Signup
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Taken</span>
            </div>
          </div>
        </div>

        {/* Signup Modal */}
        <Dialog
          open={showSignupModal}
          onOpenChange={(open) => {
            setShowSignupModal(open);
            if (!open) {
              setContactInfoOpen(false);
              setAdditionalInfoOpen(false);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sign Up for Dinner</DialogTitle>
              <DialogDescription>
                Confirm your signup details below
              </DialogDescription>
            </DialogHeader>

            {selectedSlot &&
              companionships.get(selectedSlot.companionshipId) && (
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">
                      {getCompanionshipName(
                        companionships.get(selectedSlot.companionshipId)!,
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedSlot.date.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Number of missionaries: {selectedSlot.guestCount}
                    </p>
                  </div>

                  {/* Allergies Information */}
                  {(() => {
                    const companionship = companionships.get(
                      selectedSlot.companionshipId,
                    )!;
                    const allergies = getAggregatedAllergies(companionship);

                    return (
                      <div className="space-y-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Allergies
                        </h4>

                        {allergies.length > 0 ? (
                          <div>
                            <span className="font-medium text-red-700">
                              Allergies:{" "}
                            </span>
                            <span className="text-red-600">
                              {allergies.join(", ")}
                            </span>
                          </div>
                        ) : (
                          <p className="text-yellow-700">No known allergies</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Additional Info (Preferences & Notes) */}
                  {(() => {
                    const companionship = companionships.get(
                      selectedSlot.companionshipId,
                    )!;
                    const preferences = getAggregatedPreferences(companionship);
                    const notes = getAggregatedNotes(companionship);

                    // Only show if there are preferences or notes
                    if (preferences.length === 0 && !notes) return null;

                    return (
                      <Collapsible
                        open={additionalInfoOpen}
                        onOpenChange={setAdditionalInfoOpen}
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-lg">
                          <CollapsibleTrigger className="w-full p-3 flex items-center justify-between text-left hover:bg-blue-100 transition-colors rounded-t-lg [&[data-state=open]]:rounded-b-none">
                            <h4 className="font-medium text-blue-800">
                              Additional Info
                            </h4>
                            <ChevronDown
                              className={`h-4 w-4 text-blue-600 transition-transform duration-200 ${additionalInfoOpen ? "rotate-180" : ""}`}
                            />
                          </CollapsibleTrigger>

                          <CollapsibleContent className="overflow-hidden">
                            <div className="px-3 pb-3 space-y-2 text-sm border-t border-blue-200">
                              {preferences.length > 0 && (
                                <div>
                                  <span className="font-medium text-blue-700">
                                    Preferences:{" "}
                                  </span>
                                  <span className="text-blue-600">
                                    {preferences.join(", ")}
                                  </span>
                                </div>
                              )}

                              {notes && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Notes:{" "}
                                  </span>
                                  <span className="text-gray-600">{notes}</span>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })()}
                </div>
              )}

            {/* Your Contact Information */}
            <div className="space-y-4">
              <Collapsible
                open={contactInfoOpen}
                onOpenChange={setContactInfoOpen}
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors rounded-t-lg [&[data-state=open]]:rounded-b-none">
                    <h4 className="font-medium text-blue-800">
                      Your Contact Information
                    </h4>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/profile"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSignupModal(false);
                        }}
                      >
                        Edit Profile
                      </Link>
                      <ChevronDown
                        className={`h-4 w-4 text-blue-600 transition-transform duration-200 ${contactInfoOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2 text-sm border-t border-blue-200">
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {user?.email}
                      </div>
                      {userData?.phone && (
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {userData.phone}
                        </div>
                      )}
                      {userData?.address && (
                        <div>
                          <span className="font-medium">Address:</span>{" "}
                          {userData.address}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Preferred contact:</span>{" "}
                        {userData?.preferences?.contactMethod === "email" &&
                          "Email"}
                        {userData?.preferences?.contactMethod === "sms" &&
                          "SMS"}
                        {userData?.preferences?.contactMethod === "both" &&
                          "Email & SMS"}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              <div>
                <Label htmlFor="notes">Notes for Missionaries (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions, directions, or notes..."
                  value={signupForm.notes}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSignup}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Signing Up..." : "Sign Up"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSignupModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modify Signup Modal */}
        <Dialog open={showModifyModal} onOpenChange={setShowModifyModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modify Your Signup</DialogTitle>
              <DialogDescription>
                Update your dinner signup details
              </DialogDescription>
            </DialogHeader>

            {selectedSlot &&
              companionships.get(selectedSlot.companionshipId) && (
                <div className="mb-4">
                  <p className="font-medium">
                    {getCompanionshipName(
                      companionships.get(selectedSlot.companionshipId)!,
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedSlot.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="modifyPhone">Phone Number</Label>
                <Input
                  id="modifyPhone"
                  type="tel"
                  placeholder="Your phone number"
                  value={signupForm.userPhone}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, userPhone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="modifyContactPreference">
                  Contact Preference
                </Label>
                <select
                  id="modifyContactPreference"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  value={signupForm.contactPreference}
                  onChange={(e) =>
                    setSignupForm({
                      ...signupForm,
                      contactPreference: e.target.value as
                        | "email"
                        | "phone"
                        | "both",
                    })
                  }
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <Label htmlFor="modifyNotes">Notes</Label>
                <Textarea
                  id="modifyNotes"
                  placeholder="Any additional notes..."
                  value={signupForm.notes}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleModifySignup}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Updating..." : "Update"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelSignup}
                  disabled={saving}
                  className="text-red-600 hover:text-red-700"
                >
                  Cancel Signup
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
