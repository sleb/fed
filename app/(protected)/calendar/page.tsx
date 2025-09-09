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
} from "lucide-react";
import Link from "next/link";

import { useCallback, useEffect, useState } from "react";

// Debug function to check database state
const debugDatabaseState = async () => {
  try {
    console.log("🔍 Debug: Checking database state...");

    // Check companionships
    const companionships = await CompanionshipService.getActiveCompanionships();
    console.log("🤝 Active companionships:", companionships.length);

    // Check missionaries
    const missionaries = await MissionaryService.getActiveMissionaries();
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

export default function CalendarPage() {
  const { user, userData } = useAuth();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
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

  // Form state
  const [signupForm, setSignupForm] = useState({
    userPhone: "",
    contactPreference: "email" as "email" | "phone" | "both",
    notes: "",
  });

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      console.log(`🔍 Loading calendar data for ${year}-${month + 1}`);

      const calendarData = await CalendarService.getCalendarDataForMonth(
        year,
        month,
      );

      console.log("📊 Calendar data received:", {
        slots: calendarData.slots.length,
        companionships: calendarData.companionships.size,
        missionaries: calendarData.missionaries.size,
      });

      setSlots(calendarData.slots);
      setCompanionships(calendarData.companionships);
      setMissionaries(calendarData.missionaries);

      // Run debug check if no slots found
      if (calendarData.slots.length === 0) {
        console.log(
          "⚠️ No virtual slots generated for current month, running debug check...",
        );
        await debugDatabaseState();
      }
    } catch (err) {
      console.error("Error loading calendar data:", err);
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  const generateCalendarGrid = useCallback(() => {
    console.log("🗓️ Generating calendar grid...");
    console.log("📅 Total virtual slots available:", slots.length);

    if (slots.length > 0) {
      console.log(
        "📅 Sample slot dates:",
        slots.slice(0, 3).map((slot) => ({
          companionshipId: slot.companionshipId,
          date: slot.date.toDateString(),
          status: slot.status,
          hasSignup: !!slot.signup,
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

      const daySlots = slots.filter((slot) => {
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
  }, [currentDate, slots]);

  // Load calendar data when month changes
  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user, loadCalendarData]);

  // Generate calendar grid
  useEffect(() => {
    generateCalendarGrid();
  }, [generateCalendarGrid]);

  const getCompanionshipName = (companionship: Companionship) => {
    const companionshipMissionaries = companionship.missionaryIds
      .map((id) => missionaries.get(id))
      .filter(Boolean)
      .filter((m) => m!.isActive);

    if (companionshipMissionaries.length === 0) {
      return "No Active Missionaries";
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
      .filter(Boolean)
      .filter((m) => m!.isActive);

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
      .filter(Boolean)
      .filter((m) => m!.isActive);

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
      .filter(Boolean)
      .filter((m) => m!.isActive);

    return companionshipMissionaries
      .map((missionary) => missionary?.notes)
      .filter(Boolean)
      .join("; ");
  };

  const isUserSignedUpForSlot = (slot: VirtualDinnerSlot) => {
    return slot.signup && slot.signup.userId === user?.uid;
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

      // Refresh calendar data
      await loadCalendarData();

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

      // Refresh calendar data
      await loadCalendarData();

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

      // Refresh calendar data
      await loadCalendarData();

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

  const getSlotStatusColor = (slot: VirtualDinnerSlot) => {
    if (isUserSignedUpForSlot(slot)) {
      return "bg-blue-100 border-blue-300 text-blue-800";
    }
    if (slot.status === "taken") {
      return "bg-gray-100 border-gray-300 text-gray-600";
    }
    return "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer";
  };

  const getSlotStatusText = (slot: VirtualDinnerSlot) => {
    if (isUserSignedUpForSlot(slot)) {
      return "Your Signup";
    }
    if (slot.status === "taken") {
      return "Taken";
    }
    return "Available";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
          <Button onClick={loadCalendarData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dinner Calendar
          </h1>
          <p className="text-lg text-gray-600">
            Sign up to provide dinner for our missionaries
          </p>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigateMonth("prev")}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <h2 className="text-2xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>

          <Button
            variant="outline"
            onClick={() => navigateMonth("next")}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
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

                    return (
                      <div
                        key={`${slot.companionshipId}-${slot.date.getTime()}`}
                        className={`text-xs p-2 rounded border ${getSlotStatusColor(
                          slot,
                        )}`}
                        onClick={() => handleSlotClick(slot)}
                      >
                        <div className="font-medium truncate">
                          {getCompanionshipName(companionship)}
                        </div>
                        <div className="opacity-75">
                          {getSlotStatusText(slot)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-600">Your Signup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">Taken</span>
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
