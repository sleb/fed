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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { CalendarService } from "@/lib/firebase/calendar";
import { CompanionshipService } from "@/lib/firebase/firestore";
import { Companionship } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminCalendarPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  // Data states
  const [companionships, setCompanionships] = useState<Companionship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [selectedCompanionshipId, setSelectedCompanionshipId] = useState("");
  const [generatingSlots, setGeneratingSlots] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [slotFormData, setSlotFormData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    months: 3,
  });

  useEffect(() => {
    if (user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [companionshipsData] = await Promise.all([
        CompanionshipService.getActiveCompanionships(),
      ]);

      setCompanionships(companionshipsData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load companionships");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async () => {
    if (!selectedCompanionshipId || !user) return;

    setGeneratingSlots(true);
    setError(null);
    setSuccess(null);

    try {
      const companionship = companionships.find(
        (c) => c.id === selectedCompanionshipId,
      );

      if (!companionship) {
        throw new Error("Companionship not found");
      }

      const startDate = new Date(slotFormData.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + slotFormData.months);

      const slotsCreated = await CalendarService.generateSlotsForCompanionship(
        companionship,
        startDate,
        endDate,
        user.uid,
      );

      setSuccess(
        `Generated ${slotsCreated} dinner slots for ${companionship.area} companionship`,
      );

      // Reset form
      setSelectedCompanionshipId("");
    } catch (err) {
      console.error("Error generating slots:", err);
      setError(err instanceof Error ? err.message : "Failed to generate slots");
    } finally {
      setGeneratingSlots(false);
    }
  };

  const handleGenerateAllSlots = async () => {
    if (!user) return;

    setGeneratingAll(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await CalendarService.initializeSlotsForAllCompanionships(
        user.uid,
      );

      setSuccess(
        `Auto-generated ${result.slotsCreated} dinner slots for all active companionships`,
      );
    } catch (err) {
      console.error("Error generating slots for all companionships:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate slots for all companionships",
      );
    } finally {
      setGeneratingAll(false);
    }
  };

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You need admin privileges to access this page.
          </p>
          <Button onClick={() => router.push("/calendar")}>
            Go to Calendar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Calendar Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Generate dinner slots for companionships
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Generate for Specific Companionship */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Generate Slots for Companionship
                </CardTitle>
                <CardDescription>
                  Create dinner slots for a specific companionship based on
                  their schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companionship">Select Companionship</Label>
                    <Select
                      value={selectedCompanionshipId}
                      onValueChange={setSelectedCompanionshipId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a companionship..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companionships.map((companionship) => {
                          const activeMissionaries =
                            companionship.missionaryIds.length;
                          const daysCount =
                            companionship.daysOfWeek?.length || 0;

                          return (
                            <SelectItem
                              key={companionship.id}
                              value={companionship.id}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{companionship.area} Area</span>
                                <div className="flex gap-2 ml-2">
                                  <Badge variant="outline" className="text-xs">
                                    {activeMissionaries} missionaries
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {daysCount} days/week
                                  </Badge>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={slotFormData.startDate}
                      onChange={(e) =>
                        setSlotFormData({
                          ...slotFormData,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="months">Number of Months</Label>
                  <Select
                    value={slotFormData.months.toString()}
                    onValueChange={(value) =>
                      setSlotFormData({
                        ...slotFormData,
                        months: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 month</SelectItem>
                      <SelectItem value="2">2 months</SelectItem>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompanionshipId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Companionship Schedule Preview
                    </h4>
                    {(() => {
                      const companionship = companionships.find(
                        (c) => c.id === selectedCompanionshipId,
                      );
                      if (!companionship) return null;

                      const daysOfWeek = [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ];
                      const scheduledDays =
                        companionship.daysOfWeek
                          ?.map((d) => daysOfWeek[d])
                          .join(", ") || "No days selected";

                      return (
                        <div className="text-sm text-blue-700">
                          <p>
                            <strong>Area:</strong> {companionship.area}
                          </p>
                          <p>
                            <strong>Missionaries:</strong>{" "}
                            {companionship.missionaryIds.length}
                          </p>
                          <p>
                            <strong>Available Days:</strong> {scheduledDays}
                          </p>
                          <p>
                            <strong>Slots to generate:</strong> Approximately{" "}
                            {Math.ceil((slotFormData.months * 30) / 7) *
                              (companionship.daysOfWeek?.length || 0)}{" "}
                            slots
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <Button
                  onClick={handleGenerateSlots}
                  disabled={!selectedCompanionshipId || generatingSlots}
                  className="w-full"
                >
                  {generatingSlots ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating Slots...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Dinner Slots
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generate for All Companionships */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Generate Slots for All Companionships
                </CardTitle>
                <CardDescription>
                  Automatically generate dinner slots for all active
                  companionships
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-800">
                        Bulk Generation
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This will create dinner slots for the next 3 months for
                        all active companionships based on their individual
                        schedules. Only new slots will be created (duplicates
                        avoided).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white border rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {companionships.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Companionships
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {companionships.reduce(
                        (sum, c) => sum + c.missionaryIds.length,
                        0,
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Missionaries
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(
                        companionships.reduce(
                          (sum, c) => sum + (c.daysOfWeek?.length || 0),
                          0,
                        ) / companionships.length || 0,
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg Days/Week
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">
                      ~
                      {companionships.reduce(
                        (sum, c) =>
                          sum + Math.ceil(90 / 7) * (c.daysOfWeek?.length || 0),
                        0,
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Est. Slots (3mo)
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateAllSlots}
                  disabled={generatingAll || companionships.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {generatingAll ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating Slots for All Companionships...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Slots for All Active Companionships
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Companionships Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Companionships
                </CardTitle>
                <CardDescription>
                  Overview of all active companionships and their schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companionships.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No active companionships found. Create companionships
                      first.
                    </p>
                  ) : (
                    companionships.map((companionship) => {
                      const daysOfWeek = [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ];
                      const scheduledDays =
                        companionship.daysOfWeek
                          ?.map((d) => daysOfWeek[d])
                          .join(", ") || "No schedule";

                      return (
                        <div
                          key={companionship.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <h4 className="font-medium">
                              {companionship.area} Area
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {companionship.missionaryIds.length} missionaries
                              • {scheduledDays}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                companionship.missionaryIds.length >= 2
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {companionship.missionaryIds.length} missionaries
                            </Badge>
                            <Badge
                              variant={
                                companionship.daysOfWeek?.length
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {companionship.daysOfWeek?.length || 0} days/week
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
