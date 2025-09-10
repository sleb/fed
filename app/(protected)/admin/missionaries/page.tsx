"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  CompanionshipService,
  MissionaryService,
} from "@/lib/firebase/firestore";
import { Companionship, Missionary } from "@/types";
import {
  AlertTriangle,
  Loader2,
  Mail,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { useEffect, useState } from "react";

export default function MissionariesPage() {
  const { user } = useAuth();
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [filteredMissionaries, setFilteredMissionaries] = useState<
    Missionary[]
  >([]);
  const [companionships, setCompanionships] = useState<Companionship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "assigned" | "unassigned"
  >("all");
  const [showMissionaryModal, setShowMissionaryModal] = useState(false);
  const [editingMissionary, setEditingMissionary] = useState<Missionary | null>(
    null,
  );
  const [savingMissionary, setSavingMissionary] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for missionary
  const [missionaryFormData, setMissionaryFormData] = useState({
    name: "",
    email: "",
    dinnerPreferences: [""],
    allergies: [""],
    notes: "",
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Filter missionaries
  useEffect(() => {
    let filtered = missionaries;

    // Filter by status
    if (filterStatus === "assigned") {
      const assignedIds = new Set(
        companionships.flatMap((c) => c.missionaryIds),
      );
      filtered = filtered.filter((m) => assignedIds.has(m.id));
    } else if (filterStatus === "unassigned") {
      const assignedIds = new Set(
        companionships.flatMap((c) => c.missionaryIds),
      );
      filtered = filtered.filter((m) => !assignedIds.has(m.id));
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          (m.email && m.email.toLowerCase().includes(term)) ||
          (m.allergies &&
            m.allergies.some((a) => a.toLowerCase().includes(term))) ||
          (m.dinnerPreferences &&
            m.dinnerPreferences.some((p) => p.toLowerCase().includes(term))),
      );
    }

    setFilteredMissionaries(filtered);
  }, [missionaries, companionships, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [missionaryData, companionshipData] = await Promise.all([
        MissionaryService.getAllMissionaries(),
        CompanionshipService.getAllCompanionships(),
      ]);
      setMissionaries(missionaryData);
      setCompanionships(companionshipData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load missionaries and companionships");
    } finally {
      setLoading(false);
    }
  };

  const getMissionaryCompanionship = (missionary: Missionary) => {
    return companionships.find((c) => c.missionaryIds.includes(missionary.id));
  };

  const resetMissionaryForm = () => {
    setMissionaryFormData({
      name: "",
      email: "",
      dinnerPreferences: [""],
      allergies: [""],
      notes: "",
    });
    setEditingMissionary(null);
    setError(null);
  };

  const openAddModal = () => {
    resetMissionaryForm();
    setShowMissionaryModal(true);
  };

  const openEditModal = (missionary: Missionary) => {
    setMissionaryFormData({
      name: missionary.name,
      email: missionary.email || "",
      dinnerPreferences:
        missionary.dinnerPreferences && missionary.dinnerPreferences.length > 0
          ? missionary.dinnerPreferences
          : [""],
      allergies:
        missionary.allergies && missionary.allergies.length > 0
          ? missionary.allergies
          : [""],
      notes: missionary.notes || "",
    });
    setEditingMissionary(missionary);
    setShowMissionaryModal(true);
  };

  const handleMissionarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMissionary(true);
    setError(null);

    try {
      const missionaryData = {
        ...missionaryFormData,
        // Filter out empty strings from arrays
        dinnerPreferences: missionaryFormData.dinnerPreferences.filter((p) =>
          p.trim(),
        ),
        allergies: missionaryFormData.allergies.filter((a) => a.trim()),
      };

      if (editingMissionary) {
        await MissionaryService.updateMissionary(
          editingMissionary.id,
          missionaryData,
        );
      } else {
        await MissionaryService.createMissionary(missionaryData);
      }

      setShowMissionaryModal(false);
      resetMissionaryForm();
      await loadData();
    } catch (err) {
      console.error("Error saving missionary:", err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${editingMissionary ? "update" : "create"} missionary`,
      );
    } finally {
      setSavingMissionary(false);
    }
  };

  const deleteMissionary = async (missionaryId: string) => {
    try {
      await MissionaryService.deleteMissionary(missionaryId);
      await loadData();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting missionary:", err);
      setError("Failed to delete missionary");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Compact Header with Search and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Missionary Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage individual missionary records
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search missionaries by name, email, allergies, or preferences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filterStatus}
              onValueChange={(value: "all" | "assigned" | "unassigned") =>
                setFilterStatus(value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Missionaries</SelectItem>
                <SelectItem value="assigned">
                  Assigned to Companionships
                </SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Missionary Button */}
            <Button
              onClick={openAddModal}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <UserPlus className="h-4 w-4" />
              Add Missionary
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Missionaries Grid */}
        {filteredMissionaries.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No missionaries found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters."
                : "Get started by creating your first missionary."}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Missionary
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMissionaries.map((missionary) => {
              const companionship = getMissionaryCompanionship(missionary);
              return (
                <Card
                  key={missionary.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {missionary.name}
                        </CardTitle>
                        {missionary.email && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {missionary.email}
                          </CardDescription>
                        )}
                        {companionship && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {companionship.area} Area
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {!companionship && (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 h-full">
                    {/* Allergies */}
                    {missionary.allergies &&
                      missionary.allergies.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Allergies:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {missionary.allergies.map((allergy, index) => (
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

                    {/* Dinner Preferences */}
                    {missionary.dinnerPreferences &&
                      missionary.dinnerPreferences.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Preferences:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {missionary.dinnerPreferences.map((pref, index) => (
                              <Badge
                                key={index}
                                variant="default"
                                className="text-xs"
                              >
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Notes */}
                    {missionary.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Notes:
                        </p>
                        <p className="text-sm text-gray-700">
                          {missionary.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {/* Actions */}
                    <div className="flex gap-2 pt-3 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(missionary)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirmId(missionary.id)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Missionary Creation/Edit Modal */}
      <Dialog open={showMissionaryModal} onOpenChange={setShowMissionaryModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMissionary ? "Edit Missionary" : "Create New Missionary"}
            </DialogTitle>
            <DialogDescription>
              {editingMissionary
                ? "Update missionary information and preferences."
                : "Add a new missionary to the system. They can then be assigned to a companionship."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleMissionarySubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="missionary-name">Full Name *</Label>
                <Input
                  id="missionary-name"
                  value={missionaryFormData.name}
                  onChange={(e) =>
                    setMissionaryFormData({
                      ...missionaryFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Elder John Smith"
                  required
                />
              </div>

              <div>
                <Label htmlFor="missionary-email">Email Address</Label>
                <Input
                  id="missionary-email"
                  type="email"
                  value={missionaryFormData.email}
                  onChange={(e) =>
                    setMissionaryFormData({
                      ...missionaryFormData,
                      email: e.target.value,
                    })
                  }
                  placeholder="elder.smith@missionary.org"
                />
              </div>
            </div>

            {/* Dinner Preferences & Allergies */}
            <div className="space-y-4">
              <div>
                <Label>Food Allergies</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add each allergy separately. Leave blank if no allergies.
                </p>
                <div className="space-y-2">
                  {missionaryFormData.allergies.map((allergy, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={allergy}
                        onChange={(e) => {
                          const newAllergies = [
                            ...missionaryFormData.allergies,
                          ];
                          newAllergies[index] = e.target.value;
                          setMissionaryFormData({
                            ...missionaryFormData,
                            allergies: newAllergies,
                          });
                        }}
                        placeholder="e.g., Nuts, Dairy, Gluten"
                      />
                      {missionaryFormData.allergies.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newAllergies =
                              missionaryFormData.allergies.filter(
                                (_, i) => i !== index,
                              );
                            setMissionaryFormData({
                              ...missionaryFormData,
                              allergies: newAllergies,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMissionaryFormData({
                        ...missionaryFormData,
                        allergies: [...missionaryFormData.allergies, ""],
                      })
                    }
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Allergy
                  </Button>
                </div>
              </div>

              <div>
                <Label>Dinner Preferences</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add dietary preferences or restrictions. Leave blank if none.
                </p>
                <div className="space-y-2">
                  {missionaryFormData.dinnerPreferences.map(
                    (preference, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={preference}
                          onChange={(e) => {
                            const newPreferences = [
                              ...missionaryFormData.dinnerPreferences,
                            ];
                            newPreferences[index] = e.target.value;
                            setMissionaryFormData({
                              ...missionaryFormData,
                              dinnerPreferences: newPreferences,
                            });
                          }}
                          placeholder="e.g., Vegetarian, No spicy food"
                        />
                        {missionaryFormData.dinnerPreferences.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newPreferences =
                                missionaryFormData.dinnerPreferences.filter(
                                  (_, i) => i !== index,
                                );
                              setMissionaryFormData({
                                ...missionaryFormData,
                                dinnerPreferences: newPreferences,
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ),
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMissionaryFormData({
                        ...missionaryFormData,
                        dinnerPreferences: [
                          ...missionaryFormData.dinnerPreferences,
                          "",
                        ],
                      })
                    }
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Preference
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="missionary-notes">Additional Notes</Label>
              <Textarea
                id="missionary-notes"
                value={missionaryFormData.notes}
                onChange={(e) =>
                  setMissionaryFormData({
                    ...missionaryFormData,
                    notes: e.target.value,
                  })
                }
                placeholder="Any additional information about this missionary..."
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMissionaryModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingMissionary}
                className="flex-1"
              >
                {savingMissionary ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : editingMissionary ? (
                  "Update Missionary"
                ) : (
                  "Create Missionary"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mobile Floating Action Button */}
      <Button
        onClick={openAddModal}
        className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        size="icon"
      >
        <UserPlus className="h-6 w-6" />
        <span className="sr-only">Add Missionary</span>
      </Button>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Missionary</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this missionary? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmId && deleteMissionary(deleteConfirmId)
              }
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Floating Action Button */}
      <Button
        onClick={openAddModal}
        size="lg"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
