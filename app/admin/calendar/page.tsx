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
import { CalendarService } from "@/lib/firebase/calendar";
import {
  CalendarTemplateService,
  CompanionshipCalendarService,
  CompanionshipService,
} from "@/lib/firebase/firestore";
import {
  CalendarTemplate,
  Companionship,
  CompanionshipCalendar,
} from "@/types";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Edit,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function AdminCalendarPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<CalendarTemplate[]>([]);
  const [companionships, setCompanionships] = useState<Companionship[]>([]);
  const [companionshipCalendars, setCompanionshipCalendars] = useState<
    CompanionshipCalendar[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "companionships">(
    "templates",
  );

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<CalendarTemplate | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    description: "",
    daysOfWeek: [1, 2, 3, 4, 5, 6] as number[], // Default: Mon-Sat
    isDefault: false,
  });

  // Calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedCompanionshipId, setSelectedCompanionshipId] =
    useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [calendarFormData, setCalendarFormData] = useState({
    name: "",
    description: "",
    daysOfWeek: [1, 2, 3, 4, 5, 6] as number[],
    startDate: new Date().toISOString().split("T")[0],
    generateMonths: 3,
  });

  // Auto-generation state
  const [generating, setGenerating] = useState(false);

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [templateData, companionshipData, calendarData] = await Promise.all(
        [
          CalendarTemplateService.getAllTemplates(),
          CompanionshipService.getActiveCompanionships(),
          CompanionshipCalendarService.getAllActiveCalendars(),
        ],
      );
      setTemplates(templateData);
      setCompanionships(companionshipData);
      setCompanionshipCalendars(calendarData);
    } catch (err) {
      console.error("Error loading calendar data:", err);
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  // Template operations
  const resetTemplateForm = () => {
    setTemplateFormData({
      name: "",
      description: "",
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      isDefault: false,
    });
    setEditingTemplate(null);
    setError(null);
    setSuccess(null);
  };

  const openTemplateModal = (template?: CalendarTemplate) => {
    if (template) {
      setTemplateFormData({
        name: template.name,
        description: template.description || "",
        daysOfWeek: [...template.daysOfWeek],
        isDefault: template.isDefault,
      });
      setEditingTemplate(template);
    } else {
      resetTemplateForm();
    }
    setShowTemplateModal(true);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTemplate(true);
    setError(null);

    try {
      const templateData = {
        ...templateFormData,
        isActive: true,
        createdBy: user?.uid || "unknown",
      };

      if (editingTemplate) {
        await CalendarTemplateService.updateTemplate(
          editingTemplate.id,
          templateData,
        );
        setSuccess("Calendar template updated successfully");
      } else {
        await CalendarTemplateService.createTemplate(templateData);
        setSuccess("Calendar template created successfully");
      }

      setShowTemplateModal(false);
      resetTemplateForm();
      await loadData();
    } catch (err) {
      console.error("Error saving template:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save calendar template",
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  // Calendar operations
  const openCalendarModal = (companionshipId?: string) => {
    if (companionshipId) {
      setSelectedCompanionshipId(companionshipId);
    }

    // Load default template settings
    const defaultTemplate = templates.find((t) => t.isDefault && t.isActive);
    if (defaultTemplate) {
      setCalendarFormData({
        name: `${defaultTemplate.name} (Copy)`,
        description: defaultTemplate.description || "",
        daysOfWeek: [...defaultTemplate.daysOfWeek],
        startDate: new Date().toISOString().split("T")[0],
        generateMonths: 3,
      });
      setSelectedTemplateId(defaultTemplate.id);
    }

    setShowCalendarModal(true);
  };

  const applyTemplate = () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      setCalendarFormData((prev) => ({
        ...prev,
        name: `${template.name} (Copy)`,
        description: template.description || "",
        daysOfWeek: [...template.daysOfWeek],
      }));
    }
  };

  const handleCalendarCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCalendar(true);
    setError(null);

    try {
      if (!selectedCompanionshipId) {
        throw new Error("Please select a companionship");
      }

      // Create the calendar
      const calendarId = await CompanionshipCalendarService.createCalendar({
        companionshipId: selectedCompanionshipId,
        name: calendarFormData.name,
        description: calendarFormData.description,
        daysOfWeek: calendarFormData.daysOfWeek,
        startDate: new Date(calendarFormData.startDate),
        isActive: true,
        createdBy: user?.uid || "unknown",
      });

      // Generate dinner slots
      const calendar =
        await CompanionshipCalendarService.getCalendar(calendarId);
      const companionship = await CompanionshipService.getCompanionship(
        selectedCompanionshipId,
      );

      if (calendar && companionship) {
        const startDate = new Date(calendarFormData.startDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + calendarFormData.generateMonths);

        const slotsCreated = await CalendarService.generateSlotsForCalendar(
          calendar,
          companionship,
          startDate,
          endDate,
          user?.uid || "unknown",
        );

        setSuccess(
          `Calendar created with ${slotsCreated} dinner slots generated`,
        );
      } else {
        setSuccess("Calendar created successfully");
      }

      setShowCalendarModal(false);
      setSelectedCompanionshipId("");
      await loadData();
    } catch (err) {
      console.error("Error creating calendar:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create calendar",
      );
    } finally {
      setSavingCalendar(false);
    }
  };

  const handleAutoGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const result =
        await CalendarService.initializeCalendarsForAllCompanionships(
          user?.uid || "unknown",
        );

      setSuccess(
        `Auto-generated ${result.calendarsCreated} calendars with ${result.slotsCreated} dinner slots`,
      );

      await loadData();
    } catch (err) {
      console.error("Error auto-generating calendars:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to auto-generate calendars",
      );
    } finally {
      setGenerating(false);
    }
  };

  const getCompanionshipName = (companionship: Companionship) => {
    // This would ideally be enhanced with missionary names, but for now use area
    return `${companionship.area} Area`;
  };

  const getCompanionshipsWithoutCalendars = () => {
    const companionshipsWithCalendars = new Set(
      companionshipCalendars.map((c) => c.companionshipId),
    );
    return companionships.filter((c) => !companionshipsWithCalendars.has(c.id));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar data...</p>
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
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="h-6 w-6" />
                  Calendar Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage dinner calendars for companionships
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAutoGenerate}
                disabled={generating}
                variant="outline"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Auto-Generate All
                  </>
                )}
              </Button>
              <Button onClick={() => openTemplateModal()}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Messages */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "templates"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Calendar Templates
          </button>
          <button
            onClick={() => setActiveTab("companionships")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "companionships"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Companionship Calendars
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {template.name}
                          {template.isDefault && (
                            <Badge variant="default" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Days:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.daysOfWeek.map((day) => (
                          <Badge
                            key={day}
                            variant="outline"
                            className="text-xs"
                          >
                            {DAYS_OF_WEEK.find((d) => d.value === day)?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTemplateModal(template)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Companionships Tab */}
        {activeTab === "companionships" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Companionships
                  </CardTitle>
                  <div className="text-2xl font-bold">
                    {companionships.length}
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    With Calendars
                  </CardTitle>
                  <div className="text-2xl font-bold text-green-600">
                    {companionshipCalendars.length}
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Need Setup
                  </CardTitle>
                  <div className="text-2xl font-bold text-orange-600">
                    {getCompanionshipsWithoutCalendars().length}
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Companionships needing calendars */}
            {getCompanionshipsWithoutCalendars().length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Companionships Needing Calendars
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCompanionshipsWithoutCalendars().map((companionship) => (
                    <Card
                      key={companionship.id}
                      className="border-orange-200 bg-orange-50"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {getCompanionshipName(companionship)}
                        </CardTitle>
                        <CardDescription>
                          No dinner calendar configured
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => openCalendarModal(companionship.id)}
                          className="w-full"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Create Calendar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Existing calendars */}
            {companionshipCalendars.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Active Calendars
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companionshipCalendars.map((calendar) => {
                    const companionship = companionships.find(
                      (c) => c.id === calendar.companionshipId,
                    );
                    return (
                      <Card
                        key={calendar.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {companionship
                              ? getCompanionshipName(companionship)
                              : "Unknown"}
                          </CardTitle>
                          <CardDescription>{calendar.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Schedule:
                            </p>
                            <div className="text-sm">
                              {calendar.daysOfWeek
                                .map(
                                  (day) =>
                                    DAYS_OF_WEEK.find((d) => d.value === day)
                                      ?.label,
                                )
                                .join(", ")}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Active Since:
                            </p>
                            <div className="text-sm">
                              {new Date(
                                calendar.startDate,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Calendar Template"}
            </DialogTitle>
            <DialogDescription>
              Templates can be used as starting points for companionship
              calendars.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateFormData.name}
                onChange={(e) =>
                  setTemplateFormData({
                    ...templateFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Ward Default Schedule"
                required
              />
            </div>

            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateFormData.description}
                onChange={(e) =>
                  setTemplateFormData({
                    ...templateFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe when this template should be used..."
                rows={2}
              />
            </div>

            <div>
              <Label>Days of Week</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={templateFormData.daysOfWeek.includes(day.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTemplateFormData({
                            ...templateFormData,
                            daysOfWeek: [
                              ...templateFormData.daysOfWeek,
                              day.value,
                            ].sort(),
                          });
                        } else {
                          setTemplateFormData({
                            ...templateFormData,
                            daysOfWeek: templateFormData.daysOfWeek.filter(
                              (d) => d !== day.value,
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-default"
                checked={templateFormData.isDefault}
                onChange={(e) =>
                  setTemplateFormData({
                    ...templateFormData,
                    isDefault: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="is-default" className="cursor-pointer">
                Set as default template
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingTemplate}
                className="flex-1"
              >
                {savingTemplate ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : editingTemplate ? (
                  "Update Template"
                ) : (
                  "Create Template"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Calendar Creation Modal */}
      <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Companionship Calendar</DialogTitle>
            <DialogDescription>
              Set up a dinner schedule for this companionship. You can start
              with a template and customize as needed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCalendarCreate} className="space-y-4">
            <div>
              <Label htmlFor="companionship-select">Companionship *</Label>
              <Select
                value={selectedCompanionshipId}
                onValueChange={setSelectedCompanionshipId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select companionship..." />
                </SelectTrigger>
                <SelectContent>
                  {getCompanionshipsWithoutCalendars().map((companionship) => (
                    <SelectItem key={companionship.id} value={companionship.id}>
                      {getCompanionshipName(companionship)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-select">Start with Template</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates
                      .filter((t) => t.isActive)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyTemplate}
                  disabled={!selectedTemplateId}
                >
                  Apply
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="calendar-name">Calendar Name *</Label>
              <Input
                id="calendar-name"
                value={calendarFormData.name}
                onChange={(e) =>
                  setCalendarFormData({
                    ...calendarFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Ward Default Schedule (Copy)"
                required
              />
            </div>

            <div>
              <Label htmlFor="calendar-description">Description</Label>
              <Textarea
                id="calendar-description"
                value={calendarFormData.description}
                onChange={(e) =>
                  setCalendarFormData({
                    ...calendarFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this calendar schedule..."
                rows={2}
              />
            </div>

            <div>
              <Label>Days of Week</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={calendarFormData.daysOfWeek.includes(day.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCalendarFormData({
                            ...calendarFormData,
                            daysOfWeek: [
                              ...calendarFormData.daysOfWeek,
                              day.value,
                            ].sort(),
                          });
                        } else {
                          setCalendarFormData({
                            ...calendarFormData,
                            daysOfWeek: calendarFormData.daysOfWeek.filter(
                              (d) => d !== day.value,
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={calendarFormData.startDate}
                  onChange={(e) =>
                    setCalendarFormData({
                      ...calendarFormData,
                      startDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="generate-months">Generate Slots For</Label>
                <Select
                  value={calendarFormData.generateMonths.toString()}
                  onValueChange={(value) =>
                    setCalendarFormData({
                      ...calendarFormData,
                      generateMonths: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="2">2 Months</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCalendarModal(false);
                  setSelectedCompanionshipId("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingCalendar}
                className="flex-1"
              >
                {savingCalendar ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  "Create Calendar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
