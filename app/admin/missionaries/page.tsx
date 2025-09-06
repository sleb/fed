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
import {
  CompanionshipService,
  MissionaryService,
} from "@/lib/firebase/firestore";
import { Companionship, Missionary } from "@/types";
import {
  ArrowLeft,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Helper function to generate companionship display name from missionaries
const generateCompanionshipName = (
  missionaries: Missionary[],
  companionship: Companionship,
): string => {
  const companionshipMissionaries = missionaries.filter(
    (m) => companionship.missionaryIds.includes(m.id) && m.isActive,
  );

  if (companionshipMissionaries.length === 0) {
    return `${companionship.area} Area - No Active Missionaries`;
  }

  if (companionshipMissionaries.length === 1) {
    return `${companionshipMissionaries[0].name} - ${companionship.area}`;
  }

  // For 2+ missionaries, join names with &
  const names = companionshipMissionaries.map((m) => m.name).sort();
  return `${names.join(" & ")} - ${companionship.area}`;
};

export default function CompanionshipsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [companionships, setCompanionships] = useState<Companionship[]>([]);
  const [filteredCompanionships, setFilteredCompanionships] = useState<
    Companionship[]
  >([]);
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "incomplete"
  >("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompanionship, setEditingCompanionship] =
    useState<Companionship | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for companionship
  const [formData, setFormData] = useState({
    area: "",
    address: "",
    apartmentNumber: "",
    phone: "",
    notes: "",
    missionaryIds: [] as string[],
  });

  // Redirect non-authenticated users
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (!isAdmin) {
        router.replace("/signup");
      }
    }
  }, [user, authLoading, isAdmin, router]);

  // Load data
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Filter companionships
  useEffect(() => {
    let filtered = companionships;

    // Filter by status
    if (filterStatus === "active") {
      filtered = filtered.filter((c) => c.isActive);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((c) => !c.isActive);
    } else if (filterStatus === "incomplete") {
      filtered = filtered.filter((c) => {
        const activeMissionaries = c.missionaryIds.filter((id) =>
          missionaries.find((m) => m.id === id && m.isActive),
        );
        return activeMissionaries.length < 2;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => {
        const displayName = generateCompanionshipName(
          missionaries,
          c,
        ).toLowerCase();
        return (
          displayName.includes(term) || c.area.toLowerCase().includes(term)
        );
      });
    }

    setFilteredCompanionships(filtered);
  }, [companionships, missionaries, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companionshipData, missionaryData] = await Promise.all([
        CompanionshipService.getAllCompanionships(),
        MissionaryService.getAllMissionaries(),
      ]);
      setCompanionships(companionshipData);
      setMissionaries(missionaryData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load companionships and missionaries");
    } finally {
      setLoading(false);
    }
  };

  const getCompanionshipMissionaries = (companionship: Companionship) => {
    return missionaries.filter(
      (m) => companionship.missionaryIds.includes(m.id) && m.isActive,
    );
  };

  const getCompanionshipStatus = (companionship: Companionship) => {
    const activeMissionaries = getCompanionshipMissionaries(companionship);
    const count = activeMissionaries.length;

    if (!companionship.isActive)
      return { status: "inactive", count, color: "secondary" };
    if (count === 0) return { status: "empty", count, color: "outline" };
    if (count === 1)
      return { status: "incomplete", count, color: "destructive" };
    if (count >= 2 && count <= 3)
      return { status: "complete", count, color: "default" };
    return { status: "overstaffed", count, color: "secondary" };
  };

  const getAggregatedAllergies = (companionship: Companionship) => {
    const companionshipMissionaries =
      getCompanionshipMissionaries(companionship);
    const allAllergies = companionshipMissionaries
      .flatMap((m) => m.allergies || [])
      .filter(Boolean);
    return [...new Set(allAllergies)].sort();
  };

  const resetForm = () => {
    setFormData({
      area: "",
      address: "",
      apartmentNumber: "",
      phone: "",
      notes: "",
      missionaryIds: [],
    });
    setEditingCompanionship(null);
    setError(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (companionship: Companionship) => {
    setFormData({
      area: companionship.area,
      address: companionship.address,
      apartmentNumber: companionship.apartmentNumber || "",
      phone: companionship.phone || "",
      notes: companionship.notes || "",
      missionaryIds: companionship.missionaryIds,
    });
    setEditingCompanionship(companionship);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const companionshipData = {
        ...formData,
        isActive: true,
      };

      if (editingCompanionship) {
        await CompanionshipService.updateCompanionship(
          editingCompanionship.id,
          companionshipData,
        );
      } else {
        await CompanionshipService.createCompanionship(companionshipData);
      }

      setShowAddModal(false);
      resetForm();
      await loadData();
    } catch (err) {
      console.error("Error saving companionship:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save companionship",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleCompanionshipStatus = async (companionship: Companionship) => {
    try {
      await CompanionshipService.updateCompanionship(companionship.id, {
        isActive: !companionship.isActive,
      });
      await loadData();
    } catch (err) {
      console.error("Error updating companionship status:", err);
      setError("Failed to update companionship status");
    }
  };

  // Get unique areas for autocomplete
  const existingAreas = [...new Set(companionships.map((c) => c.area))].sort();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading companionships...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
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
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-8 w-8" />
                  Companionship Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage missionary companionships organized by service area
                </p>
              </div>
            </div>
            <Button onClick={openAddModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Companionship
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by missionary names or area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={filterStatus}
                onValueChange={(
                  value: "all" | "active" | "inactive" | "incomplete",
                ) => setFilterStatus(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Companionships Grid */}
        {filteredCompanionships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "No companionships found"
                  : "No companionships yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first companionship"}
              </p>
              {!searchTerm && filterStatus === "active" && (
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Companionship
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanionships.map((companionship) => {
              const status = getCompanionshipStatus(companionship);
              const companionshipMissionaries =
                getCompanionshipMissionaries(companionship);
              const allergies = getAggregatedAllergies(companionship);

              return (
                <Card
                  key={companionship.id}
                  className={`hover:shadow-md transition-shadow ${
                    status.status === "incomplete"
                      ? "border-red-200 bg-red-50"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {generateCompanionshipName(
                            missionaries,
                            companionship,
                          )}
                        </CardTitle>
                        <CardDescription className="font-medium flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {companionship.area} Area
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          status.color as
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline"
                        }
                      >
                        {status.count} Member{status.count !== 1 ? "s" : ""}
                        {status.status === "incomplete" && " - Need More"}
                        {status.status === "overstaffed" && " - Too Many"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Missionaries List */}
                    {companionshipMissionaries.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Missionaries:
                        </p>
                        <div className="space-y-1">
                          {companionshipMissionaries.map((missionary) => (
                            <p
                              key={missionary.id}
                              className="text-sm font-medium"
                            >
                              {missionary.name}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        Contact Info:
                      </p>

                      {/* Shared Phone */}
                      {companionship.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">
                            {companionship.phone}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                            Shared
                          </span>
                        </div>
                      )}

                      {/* Individual Emails */}
                      {companionshipMissionaries.length > 0 && (
                        <div className="space-y-1">
                          {companionshipMissionaries.map(
                            (missionary) =>
                              missionary.email && (
                                <div
                                  key={missionary.id}
                                  className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                  <Mail className="h-3 w-3" />
                                  <span className="text-xs">
                                    {missionary.name}:
                                  </span>
                                  <span className="truncate text-xs">
                                    {missionary.email}
                                  </span>
                                </div>
                              ),
                          )}
                        </div>
                      )}
                    </div>

                    {/* Allergies */}
                    {allergies.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Companionship Allergies:
                        </p>
                        <p className="text-sm font-medium text-red-600">
                          {allergies.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(companionship)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant={companionship.isActive ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleCompanionshipStatus(companionship)}
                        className="flex-1"
                      >
                        {companionship.isActive ? (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Restore
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompanionship
                ? "Edit Companionship"
                : "Add New Companionship"}
            </DialogTitle>
            <DialogDescription>
              {editingCompanionship
                ? "Update companionship area and contact information"
                : "Create a new companionship for a service area"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Companionship name will be auto-generated from assigned
                missionaries
              </p>

              <div>
                <Label htmlFor="area">Area *</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                  placeholder="Downtown"
                  list="areas"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Service area that defines the companionship
                </p>
                <datalist id="areas">
                  {existingAreas.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Address</h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="apartmentNumber">Apt #</Label>
                  <Input
                    id="apartmentNumber"
                    value={formData.apartmentNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apartmentNumber: e.target.value,
                      })
                    }
                    placeholder="4B"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Contact Information</h3>
              <p className="text-sm text-muted-foreground">
                Companionship has one shared phone. Individual missionaries have
                their own emails.
              </p>

              <div>
                <Label htmlFor="phone">Companionship Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Shared phone number for the entire companionship
                </p>
              </div>
            </div>

            {/* Missionaries Assignment */}
            <div className="space-y-4">
              <h3 className="font-medium">Missionary Assignment</h3>
              <p className="text-sm text-muted-foreground">
                Add individual missionaries to this companionship (2-3
                recommended). Each missionary can have their own email address.
              </p>

              {/* TODO: Add missionary selection interface */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  📝 <strong>Coming Soon:</strong> Missionary selection
                  interface
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  For now, missionaries will need to be assigned separately.
                  Individual missionary emails will be displayed in the
                  companionship contact info.
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional information about this companionship..."
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : editingCompanionship ? (
                  "Update Companionship"
                ) : (
                  "Create Companionship"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
