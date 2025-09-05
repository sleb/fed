"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useAuth } from "@/lib/firebase/auth";
import { DinnerSlotWithMissionary, SignupFormData } from "@/types";
import { Calendar, Clock, MapPin, Users, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSignupFilters, useSignups } from "../../hooks/useSignups";

export default function SignupPage() {
  const { user, loading: authLoading, role } = useAuth();
  const router = useRouter();
  const { updateFilters, resetFilters, hasActiveFilters } = useSignupFilters();
  const {
    availableSlots,
    slotsLoading,
    slotsError,
    userSignups,
    signupsLoading,
    signUpForSlot,
    cancelUserSignup,
    signingUp,
    cancelling,
  } = useSignups();

  // Form state for signup dialog
  const [selectedSlot, setSelectedSlot] =
    useState<DinnerSlotWithMissionary | null>(null);
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);
  const [signupForm, setSignupForm] = useState<SignupFormData>({
    dinnerSlotId: "",
    guestCount: 2,
    specialRequests: "",
    userPhone: "",
    contactPreference: "email",
    notes: "",
  });
  const [signupError, setSignupError] = useState<string | null>(null);

  // Date filter states
  const [dateFilterFrom, setDateFilterFrom] = useState("");
  const [dateFilterTo, setDateFilterTo] = useState("");

  // Redirect non-authenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Update filters when date inputs change
  useEffect(() => {
    const updates: Record<string, Date | undefined> = {};
    if (dateFilterFrom) updates.dateFrom = new Date(dateFilterFrom);
    if (dateFilterTo) updates.dateTo = new Date(dateFilterTo);
    updateFilters(updates);
  }, [dateFilterFrom, dateFilterTo, updateFilters]);

  const handleSignupClick = (slot: DinnerSlotWithMissionary) => {
    setSelectedSlot(slot);
    setSignupForm({
      dinnerSlotId: slot.id,
      guestCount: slot.guestCount,
      specialRequests: "",
      userPhone: "",
      contactPreference: "email",
      notes: "",
    });
    setSignupError(null);
    setSignupDialogOpen(true);
  };

  const handleSignupSubmit = async () => {
    if (!selectedSlot) return;

    try {
      setSignupError(null);
      await signUpForSlot(signupForm);
      setSignupDialogOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Signup error:", error);
      setSignupError(
        error instanceof Error ? error.message : "Failed to sign up",
      );
    }
  };

  const handleCancelSignup = async (signupId: string) => {
    try {
      await cancelUserSignup(signupId);
    } catch (error) {
      console.error("Cancel error:", error);
      // Could add toast notification here
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view dinner signups.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Missionary Dinners
              </h1>
              <p className="text-gray-600 mt-1">
                Sign up to provide meals for our missionaries
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Welcome, {user.displayName}
              </p>
              <Badge variant={role === "admin" ? "default" : "secondary"}>
                {role || "member"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Filter Available Dinners</CardTitle>
            <CardDescription>
              Find dinner opportunities that work for your schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFilterFrom}
                  onChange={(e) => setDateFilterFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateFilterTo}
                  onChange={(e) => setDateFilterTo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="area-filter">Area</Label>
                <Select
                  onValueChange={(value) =>
                    updateFilters({ area: value === "any" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any area</SelectItem>
                    <SelectItem value="Downtown">Downtown</SelectItem>
                    <SelectItem value="Northside">Northside</SelectItem>
                    <SelectItem value="Eastside">Eastside</SelectItem>
                    <SelectItem value="Westside">Westside</SelectItem>
                    <SelectItem value="Southside">Southside</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Dinner Slots */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Available Dinner Opportunities
                </CardTitle>
                <CardDescription>
                  {availableSlots.length} dinner slots available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slotsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : slotsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{slotsError}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No dinner slots available matching your filters.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        onClick={resetFilters}
                        variant="outline"
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <Card
                        key={slot.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {slot.missionary.name}
                                </h3>
                                <Badge variant="outline">
                                  {slot.missionary.area}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(slot.date)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {slot.time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {slot.missionary.address}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {slot.guestCount} guests
                                </div>
                              </div>

                              {slot.missionary.dinnerPreferences &&
                                slot.missionary.dinnerPreferences.length >
                                  0 && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Preferences:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {slot.missionary.dinnerPreferences.map(
                                        (pref, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {pref}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                              {slot.missionary.allergies &&
                                slot.missionary.allergies.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs text-red-600 mb-1">
                                      Allergies:
                                    </p>
                                    <p className="text-xs text-red-700">
                                      {slot.missionary.allergies.join(", ")}
                                    </p>
                                  </div>
                                )}

                              {slot.missionary.notes && (
                                <p className="text-xs text-gray-600 italic">
                                  {slot.missionary.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant="outline"
                                className="text-green-700 border-green-200"
                              >
                                Available
                              </Badge>
                              <Button
                                onClick={() => handleSignupClick(slot)}
                                disabled={signingUp}
                                size="sm"
                              >
                                Sign Up
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Your Signups */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Upcoming Dinners
                </CardTitle>
                <CardDescription>
                  {
                    userSignups.filter(
                      (s) =>
                        s.status === "confirmed" && s.dinnerDate >= new Date(),
                    ).length
                  }{" "}
                  upcoming
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signupsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : userSignups.filter((s) => s.status === "confirmed")
                    .length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No dinner commitments yet.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sign up for available slots!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {userSignups
                      .filter((signup) => signup.status === "confirmed")
                      .slice(0, 5)
                      .map((signup) => (
                        <Card
                          key={signup.id}
                          className="bg-blue-50 border-blue-200"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-sm">
                                  {signup.missionaryName}
                                </h4>
                                <p className="text-xs text-gray-600 mb-1">
                                  {formatShortDate(signup.dinnerDate)} at{" "}
                                  {signup.dinnerTime}
                                </p>
                                {signup.specialRequests && (
                                  <p className="text-xs text-gray-500 italic">
                                    {signup.specialRequests}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelSignup(signup.id)}
                                disabled={cancelling}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Signup Dialog */}
      <Dialog open={signupDialogOpen} onOpenChange={setSignupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Up for Dinner</DialogTitle>
            <DialogDescription>
              {selectedSlot &&
                `${selectedSlot.missionary.name} on ${formatDate(selectedSlot.date)} at ${selectedSlot.time}`}
            </DialogDescription>
          </DialogHeader>

          {signupError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{signupError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="guest-count">Number of Guests</Label>
              <Select
                value={signupForm.guestCount.toString()}
                onValueChange={(value) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    guestCount: parseInt(value, 10),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 guest</SelectItem>
                  <SelectItem value="2">2 guests</SelectItem>
                  <SelectItem value="3">3 guests</SelectItem>
                  <SelectItem value="4">4 guests</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">Your Phone Number (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={signupForm.userPhone}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    userPhone: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="contact-preference">
                Preferred Contact Method
              </Label>
              <Select
                value={signupForm.contactPreference}
                onValueChange={(value: "email" | "phone" | "both") =>
                  setSignupForm((prev) => ({
                    ...prev,
                    contactPreference: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email only</SelectItem>
                  <SelectItem value="phone">Phone only</SelectItem>
                  <SelectItem value="both">Both email and phone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="special-requests">
                Special Requests or Questions
              </Label>
              <Textarea
                id="special-requests"
                placeholder="Any dietary restrictions, timing constraints, or questions..."
                value={signupForm.specialRequests}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    specialRequests: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Anything else you'd like to share..."
                value={signupForm.notes}
                onChange={(e) =>
                  setSignupForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSignupSubmit} disabled={signingUp}>
              {signingUp ? "Signing Up..." : "Sign Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
