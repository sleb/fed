"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  CompanionshipService,
  MissionaryService,
  SignupService,
} from "@/lib/firebase/firestore";
import { Companionship, Missionary, Signup } from "@/types";
import { Calendar, CheckCircle, Clock, Info, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AdminCalendarPage() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const [companionships, setCompanionships] = useState<Companionship[]>([]);
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [upcomingSignups, setUpcomingSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!user || (userData && userData.role !== "admin")) {
      router.push("/calendar");
    }
  }, [user, userData, router]);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [companionshipData, missionaryData] = await Promise.all([
        CompanionshipService.getActiveCompanionships(),
        MissionaryService.getActiveMissionaries(),
      ]);

      setCompanionships(companionshipData);
      setMissionaries(missionaryData);

      // Get upcoming signups for the next 30 days
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const signups = await SignupService.getSignupsInDateRange(
        now,
        thirtyDaysFromNow,
      );

      // Sort by date
      signups.sort(
        (a, b) =>
          new Date(a.dinnerDate).getTime() - new Date(b.dinnerDate).getTime(),
      );
      setUpcomingSignups(signups);
    } catch (err) {
      console.error("Error loading admin data:", err);
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && userData?.role === "admin") {
      loadAdminData();
    }
  }, [user, userData, loadAdminData]);

  const getCompanionshipName = (companionshipId: string) => {
    const companionship = companionships.find((c) => c.id === companionshipId);
    if (!companionship) return "Unknown Companionship";

    const companionshipMissionaries = companionship.missionaryIds
      .map((id) => missionaries.find((m) => m.id === id))
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

  const getDaysOfWeekText = (daysOfWeek: number[]) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return daysOfWeek.map((day) => dayNames[day]).join(", ");
  };

  const getSignupsForCompanionship = (companionshipId: string) => {
    return upcomingSignups.filter(
      (signup) => signup.companionshipId === companionshipId,
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">{error}</p>
          <Button onClick={loadAdminData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!user || userData?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Calendar Administration
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Monitor dinner signups and companionship schedules
          </p>
        </div>

        {/* Info Card about New System */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              Dynamic Slot System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">
              Dinner slots are now generated automatically based on
              companionship schedules. No need to manually create slots - they
              appear dynamically on the calendar when members view available
              dates.
            </p>
            <div className="mt-4 flex gap-4">
              <Button
                onClick={() => router.push("/admin/companionships")}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Manage Companionships
              </Button>
              <Button
                onClick={() => router.push("/calendar")}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                View Calendar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Companionship Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Companionships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companionships.length === 0 ? (
                  <p className="text-gray-500">
                    No active companionships found.
                  </p>
                ) : (
                  companionships.map((companionship) => {
                    const upcomingForThis = getSignupsForCompanionship(
                      companionship.id,
                    );
                    return (
                      <div
                        key={companionship.id}
                        className="p-4 border rounded-lg bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {getCompanionshipName(companionship.id)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {companionship.area} Area
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              Available:{" "}
                              {getDaysOfWeekText(companionship.daysOfWeek)}
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              {upcomingForThis.length} upcoming signups
                            </div>
                          </div>
                        </div>

                        {companionship.phone && (
                          <p className="text-sm text-gray-600">
                            📞 {companionship.phone}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Signups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Signups ({upcomingSignups.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingSignups.length === 0 ? (
                  <p className="text-gray-500">No upcoming signups.</p>
                ) : (
                  upcomingSignups.slice(0, 10).map((signup) => (
                    <div
                      key={signup.id}
                      className="p-3 border rounded-lg bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {signup.userName}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {getCompanionshipName(signup.companionshipId)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(signup.dinnerDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 capitalize">
                              {signup.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {signup.guestCount} missionaries
                          </p>
                        </div>
                      </div>

                      {signup.userPhone && (
                        <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                          📞 {signup.userPhone}
                        </div>
                      )}

                      {signup.notes && (
                        <div className="mt-1 text-sm text-gray-600">
                          💬 {signup.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {upcomingSignups.length > 10 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    ... and {upcomingSignups.length - 10} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Companionships</p>
                  <p className="text-2xl font-bold">{companionships.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Missionaries</p>
                  <p className="text-2xl font-bold">{missionaries.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming Signups</p>
                  <p className="text-2xl font-bold">{upcomingSignups.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">
                    {
                      upcomingSignups.filter((signup) => {
                        const signupDate = new Date(signup.dinnerDate);
                        const now = new Date();
                        const weekFromNow = new Date();
                        weekFromNow.setDate(now.getDate() + 7);
                        return signupDate >= now && signupDate <= weekFromNow;
                      }).length
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
