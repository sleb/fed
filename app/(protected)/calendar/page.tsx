"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  DinnerSlotService,
  MissionaryService,
  SignupService,
} from "@/lib/firebase/firestore";
import { Companionship, DinnerSlot, Missionary, Signup } from "@/types";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

// Debug function to check database state
const debugDatabaseState = async () => {
  try {
    console.log("🔍 Debug: Checking database state...");

    // Check slots directly
    const allSlots = await DinnerSlotService.getAllSlots();
    console.log("📅 All slots in database:", allSlots.length);
    console.log("📅 Sample slots:", allSlots.slice(0, 3));

    // Check companionships
    const companionships = await CompanionshipService.getActiveCompanionships();
    console.log("🤝 Active companionships:", companionships.length);

    // Check missionaries
    const missionaries = await MissionaryService.getActiveMissionaries();
    console.log("👥 Active missionaries:", missionaries.length);

    return { allSlots, companionships, missionaries };
  } catch (error) {
    console.error("❌ Debug error:", error);
    return null;
  }
};

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  slots: DinnerSlot[];
}

export default function CalendarPage() {
  const { user } = useAuth();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [slots, setSlots] = useState<DinnerSlot[]>([]);
  const [companionships, setCompanionships] = useState<
    Map<string, Companionship>
  >(new Map());
  const [missionaries, setMissionaries] = useState<Map<string, Missionary>>(
    new Map(),
  );
  const [userSignups, setUserSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedSlot, setSelectedSlot] = useState<DinnerSlot | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [selectedSignup, setSelectedSignup] = useState<Signup | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [signupForm, setSignupForm] = useState({
    specialRequests: "",
    userPhone: "",
    contactPreference: "email" as "email" | "phone" | "both",
    notes: "",
  });

  // Redirect non-authenticated users

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

      // Load user's signups
      if (user) {
        const signups = await SignupService.getSignupsByUser(user.uid);
        setUserSignups(signups);
        console.log("👤 User signups:", signups.length);
      }

      // Run debug check if no slots found
      if (calendarData.slots.length === 0) {
        console.log(
          "⚠️ No slots found for current month, running debug check...",
        );
        await debugDatabaseState();
      }
    } catch (err) {
      console.error("Error loading calendar data:", err);
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [currentDate, user]);

  const generateCalendarGrid = useCallback(() => {
    console.log("🗓️ Generating calendar grid...");
    console.log("📅 Total slots available:", slots.length);

    if (slots.length > 0) {
      console.log(
        "📅 Sample slot dates:",
        slots.slice(0, 3).map((slot) => {
          const date = slot.date;
          return {
            original: date,
            type: typeof date,
            isFirestoreTimestamp:
              date && typeof date === "object" && "seconds" in date,
            converted: new Date(
              date instanceof Date
                ? date
                : (date as { toDate: () => Date })?.toDate
                  ? (date as { toDate: () => Date }).toDate()
                  : date,
            ),
            dateString: new Date(
              date instanceof Date
                ? date
                : (date as { toDate: () => Date })?.toDate
                  ? (date as { toDate: () => Date }).toDate()
                  : date,
            ).toDateString(),
          };
        }),
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
        // Handle different date formats (Firestore Timestamp, Date object, string)
        let slotDate;
        if (
          slot.date &&
          typeof slot.date === "object" &&
          "toDate" in slot.date
        ) {
          // Firestore Timestamp
          slotDate = (slot.date as { toDate: () => Date }).toDate();
        } else if (slot.date instanceof Date) {
          // Already a Date object
          slotDate = slot.date;
        } else {
          // String or other format
          slotDate = new Date(slot.date);
        }

        const slotDateStr = slotDate.toDateString();
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
            id: slot.id,
            companionshipId: slot.companionshipId,
            status: slot.status,
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

    const allAllergies = companionshipMissionaries
      .flatMap((m) => m!.allergies || [])
      .filter(Boolean);

    return [...new Set(allAllergies)].sort();
  };

  const getUserSignupForSlot = (slot: DinnerSlot) => {
    return userSignups.find(
      (signup) =>
        signup.dinnerSlotId === slot.id && signup.status !== "cancelled",
    );
  };

  const handleSlotClick = (slot: DinnerSlot) => {
    const existingSignup = getUserSignupForSlot(slot);

    if (existingSignup) {
      // User has already signed up, allow modification
      setSelectedSignup(existingSignup);
      setSelectedSlot(slot);
      setSignupForm({
        specialRequests: existingSignup.specialRequests || "",
        userPhone: existingSignup.userPhone || "",
        contactPreference: existingSignup.contactPreference,
        notes: existingSignup.notes || "",
      });
      setShowModifyModal(true);
    } else if (slot.status === "available") {
      // Slot is available for signup
      setSelectedSlot(slot);
      setSignupForm({
        specialRequests: "",
        userPhone: user?.phoneNumber || "",
        contactPreference: "email",
        notes: "",
      });
      setShowSignupModal(true);
    }
  };

  const handleSignup = async () => {
    if (!selectedSlot || !user) return;

    setSaving(true);
    try {
      const companionship = companionships.get(selectedSlot.companionshipId);
      const companionshipName = companionship
        ? getCompanionshipName(companionship)
        : "Unknown";

      const signupData = {
        dinnerSlotId: selectedSlot.id,
        guestCount: selectedSlot.guestCount, // Use the slot's missionary count
        specialRequests: signupForm.specialRequests,
        userPhone: signupForm.userPhone,
        contactPreference: signupForm.contactPreference,
        notes: signupForm.notes,
      };

      await SignupService.createSignup({
        ...signupData,
        userId: user.uid,
        userName: user.displayName || user.email || "Unknown",
        userEmail: user.email || "",
        missionaryId: selectedSlot.companionshipId, // For compatibility
        missionaryName: companionshipName,
        dinnerDate: selectedSlot.date,
        status: "confirmed",
        reminderSent: false,
        updatedAt: new Date(),
      });

      // Update slot status
      await DinnerSlotService.updateDinnerSlot(selectedSlot.id, {
        status: "assigned",
        assignedUserId: user.uid,
        assignedUserName: user.displayName || user.email || "Unknown",
        assignedUserEmail: user.email || "",
        assignedUserPhone: signupForm.userPhone,
        specialRequests: signupForm.specialRequests,
      });

      setShowSignupModal(false);
      setSelectedSlot(null);
      await loadCalendarData();
    } catch (err) {
      console.error("Error creating signup:", err);
      setError("Failed to sign up for dinner slot");
    } finally {
      setSaving(false);
    }
  };

  const handleModifySignup = async () => {
    if (!selectedSignup || !selectedSlot || !user) return;

    setSaving(true);
    try {
      await SignupService.updateSignup(selectedSignup.id, {
        guestCount: selectedSlot.guestCount, // Use the slot's missionary count
        specialRequests: signupForm.specialRequests,
        userPhone: signupForm.userPhone,
        contactPreference: signupForm.contactPreference,
        notes: signupForm.notes,
        updatedAt: new Date(),
      });

      // Update slot with new details
      await DinnerSlotService.updateDinnerSlot(selectedSlot.id, {
        assignedUserPhone: signupForm.userPhone,
        specialRequests: signupForm.specialRequests,
      });

      setShowModifyModal(false);
      setSelectedSignup(null);
      setSelectedSlot(null);
      await loadCalendarData();
    } catch (err) {
      console.error("Error updating signup:", err);
      setError("Failed to update signup");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSignup = async () => {
    if (!selectedSignup || !selectedSlot) return;

    setSaving(true);
    try {
      await SignupService.updateSignup(selectedSignup.id, {
        status: "cancelled",
        updatedAt: new Date(),
      });

      // Mark slot as available again
      await DinnerSlotService.updateDinnerSlot(selectedSlot.id, {
        status: "available",
        assignedUserId: undefined,
        assignedUserName: undefined,
        assignedUserEmail: undefined,
        assignedUserPhone: undefined,
        specialRequests: undefined,
      });

      setShowModifyModal(false);
      setSelectedSignup(null);
      setSelectedSlot(null);
      await loadCalendarData();
    } catch (err) {
      console.error("Error cancelling signup:", err);
      setError("Failed to cancel signup");
    } finally {
      setSaving(false);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getSlotStatusColor = (slot: DinnerSlot) => {
    const userSignup = getUserSignupForSlot(slot);
    if (userSignup) return "bg-blue-100 border-blue-300 text-blue-800";
    if (slot.status === "assigned")
      return "bg-gray-100 border-gray-300 text-gray-600";
    if (slot.status === "available")
      return "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer";
    return "bg-gray-100 border-gray-300 text-gray-600";
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Dinner Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign up for dinner slots with missionary companionships
              </p>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-lg font-semibold min-w-48 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Debug Info */}
        {(slots.length === 0 ||
          (slots.length > 0 &&
            calendarDays.filter((day) => day.slots.length > 0).length === 0)) &&
          !loading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800">
                    {slots.length === 0
                      ? "No Dinner Slots Found"
                      : "Slots Not Displaying"}
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {slots.length === 0
                      ? "No dinner slots are available for this month."
                      : `Found ${slots.length} slots in database but none are showing in calendar.`}{" "}
                    This could mean:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                    {slots.length === 0 ? (
                      <>
                        <li>The database has not been seeded with test data</li>
                        <li>
                          No dinner slots have been created for this time period
                        </li>
                        <li>There may be a database connection issue</li>
                      </>
                    ) : (
                      <>
                        <li>
                          Date format mismatch between database and calendar
                        </li>
                        <li>
                          Slots are for a different month than currently
                          displayed
                        </li>
                        <li>
                          Issue with date comparison in calendar grid generation
                        </li>
                      </>
                    )}
                  </ul>
                  <p className="text-sm text-yellow-700 mt-2">
                    Check the browser console for debugging details.
                    {slots.length > 0 &&
                      ` Database contains ${slots.length} slots but calendar shows ${calendarDays.filter((day) => day.slots.length > 0).length} days with slots.`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => debugDatabaseState()}
                  >
                    Run Database Debug Check
                  </Button>
                </div>
              </div>
            </div>
          )}

        {/* Legend */}
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Your Signups</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Taken</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg border shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b last:border-r-0 ${
                  !day.isCurrentMonth ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    !day.isCurrentMonth ? "text-gray-400" : "text-gray-900"
                  }`}
                >
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {day.slots.map((slot) => {
                    const companionship = companionships.get(
                      slot.companionshipId,
                    );
                    const userSignup = getUserSignupForSlot(slot);

                    return (
                      <div
                        key={slot.id}
                        className={`text-xs p-2 rounded border ${getSlotStatusColor(slot)}`}
                        onClick={() => handleSlotClick(slot)}
                      >
                        <div className="font-medium">
                          {companionship
                            ? getCompanionshipName(companionship)
                            : "Unknown"}
                        </div>
                        {userSignup && (
                          <div className="text-xs text-blue-600 font-medium">
                            Your signup
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signup Modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Up for Dinner</DialogTitle>
            <DialogDescription>
              {selectedSlot &&
                companionships.get(selectedSlot.companionshipId) && (
                  <>
                    {new Date(selectedSlot.date).toLocaleDateString()}
                    <br />
                    with{" "}
                    {getCompanionshipName(
                      companionships.get(selectedSlot.companionshipId)!,
                    )}
                  </>
                )}
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && companionships.get(selectedSlot.companionshipId) && (
            <div className="space-y-4">
              {/* Companionship Info */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {companionships.get(selectedSlot.companionshipId)!.area}{" "}
                        Area
                      </span>
                    </div>

                    {companionships.get(selectedSlot.companionshipId)!
                      .phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {
                            companionships.get(selectedSlot.companionshipId)!
                              .phone
                          }
                        </span>
                      </div>
                    )}

                    {getAggregatedAllergies(
                      companionships.get(selectedSlot.companionshipId)!,
                    ).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">
                          Allergies:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {getAggregatedAllergies(
                            companionships.get(selectedSlot.companionshipId)!,
                          ).map((allergy, index) => (
                            <Badge
                              key={index}
                              variant="destructive"
                              className="text-xs"
                            >
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Signup Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guest-count">Number of Missionaries</Label>
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <span className="text-sm font-medium">
                      {selectedSlot?.guestCount} missionaries
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Your Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={signupForm.userPhone}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        userPhone: e.target.value,
                      })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="special-requests">
                    Special Requests or Dietary Notes
                  </Label>
                  <Textarea
                    id="special-requests"
                    value={signupForm.specialRequests}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        specialRequests: e.target.value,
                      })
                    }
                    placeholder="Any special dietary needs or requests..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="member-notes">
                    Notes for Missionaries/Coordinator
                  </Label>
                  <Textarea
                    id="member-notes"
                    value={signupForm.notes}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Any additional notes or information..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSignupModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSignup}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Signing up..." : "Sign Up"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modify Signup Modal */}
      <Dialog open={showModifyModal} onOpenChange={setShowModifyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modify Your Signup</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>{new Date(selectedSlot.date).toLocaleDateString()}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="modify-guest-count">Number of Missionaries</Label>
              <div className="p-3 bg-gray-50 border rounded-md">
                <span className="text-sm font-medium">
                  {selectedSlot?.guestCount} missionaries
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="modify-phone">Your Phone Number</Label>
              <Input
                id="modify-phone"
                type="tel"
                value={signupForm.userPhone}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, userPhone: e.target.value })
                }
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="modify-special-requests">
                Special Requests or Dietary Notes
              </Label>
              <Textarea
                id="modify-special-requests"
                value={signupForm.specialRequests}
                onChange={(e) =>
                  setSignupForm({
                    ...signupForm,
                    specialRequests: e.target.value,
                  })
                }
                placeholder="Any special dietary needs or requests..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="modify-member-notes">
                Notes for Missionaries/Coordinator
              </Label>
              <Textarea
                id="modify-member-notes"
                value={signupForm.notes}
                onChange={(e) =>
                  setSignupForm({
                    ...signupForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Any additional notes or information..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowModifyModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSignup}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Cancelling..." : "Cancel Signup"}
              </Button>
              <Button
                onClick={handleModifySignup}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
