"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { updateUserProfile } from "@/lib/firebase/auth";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Save,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    contactMethod: "email" as "email" | "sms" | "both",
    signupReminders: true,
    appointmentReminders: true,
    changeNotifications: true,
    reminderDaysBefore: 1,
  });

  const [errors, setErrors] = useState<{
    phone?: string;
  }>({});

  // Load user data into form
  useEffect(() => {
    if (userData) {
      setFormData({
        phone: userData.phone || "",
        address: userData.address || "",
        contactMethod: userData.preferences?.contactMethod || "email",
        signupReminders: userData.preferences?.signupReminders ?? true,
        appointmentReminders:
          userData.preferences?.appointmentReminders ?? true,
        changeNotifications: userData.preferences?.changeNotifications ?? true,
        reminderDaysBefore: userData.preferences?.reminderDaysBefore ?? 1,
      });
    }
  }, [userData]);

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format as (555) 123-4567
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, phone: formatted });

    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors({ ...errors, phone: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate contact method requirements
    if (formData.contactMethod === "sms" || formData.contactMethod === "both") {
      if (!formData.phone?.trim()) {
        newErrors.phone = "Phone number is required for SMS notifications";
      } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number: (555) 123-4567";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updates: {
        preferences: {
          contactMethod: "email" | "sms" | "both";
          signupReminders: boolean;
          appointmentReminders: boolean;
          changeNotifications: boolean;
          reminderDaysBefore: number;
        };
        phone?: string;
        address?: string;
      } = {
        preferences: {
          contactMethod: formData.contactMethod,
          signupReminders: formData.signupReminders,
          appointmentReminders: formData.appointmentReminders,
          changeNotifications: formData.changeNotifications,
          reminderDaysBefore: formData.reminderDaysBefore,
        },
      };

      // Only include phone/address if they have values
      if (formData.phone?.trim()) {
        updates.phone = formData.phone.trim();
      }
      if (formData.address?.trim()) {
        updates.address = formData.address.trim();
      }

      await updateUserProfile(user.uid, updates);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isFormDisabled = saving;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-1">
                Manage your contact information and preferences
              </p>
            </div>
            <Button onClick={() => router.push("/calendar")} variant="outline">
              Back to Calendar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your account details from Google sign-in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Name
                  </Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.displayName || "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Role
                  </Label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">
                    {userData?.role || "Member"}
                  </p>
                </div>
                {userData?.stats && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Dinner Stats
                    </Label>
                    <div className="text-sm text-gray-900 mt-1 space-y-1">
                      <p>Total signups: {userData.stats.totalSignups}</p>
                      <p>Completed: {userData.stats.completedDinners}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information & Preferences</CardTitle>
                <CardDescription>
                  Update your contact details and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Success/Error Messages */}
                {success && (
                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Profile updated successfully!
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number{" "}
                        <span className="text-sm text-gray-500">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        disabled={isFormDisabled}
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">
                        Address{" "}
                        <span className="text-sm text-gray-500">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="address"
                        placeholder="123 Main St, City, State"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        disabled={isFormDisabled}
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notification Preferences
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactMethod">
                        Preferred Contact Method{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.contactMethod}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            contactMethod: value as "email" | "sms" | "both",
                          })
                        }
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Only
                            </div>
                          </SelectItem>
                          <SelectItem value="sms">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              SMS/Text Only
                            </div>
                          </SelectItem>
                          <SelectItem value="both">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <Phone className="h-4 w-4" />
                              Both Email & SMS
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notification Types */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        What would you like to be notified about?
                      </Label>

                      <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.signupReminders}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                signupReminders: e.target.checked,
                              })
                            }
                            disabled={isFormDisabled}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="font-medium">Signup Reminders</div>
                            <div className="text-sm text-gray-600">
                              Gentle reminders to sign up for dinner slots
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.appointmentReminders}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                appointmentReminders: e.target.checked,
                              })
                            }
                            disabled={isFormDisabled}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="font-medium">
                              Appointment Reminders
                            </div>
                            <div className="text-sm text-gray-600">
                              Reminders about your upcoming dinner appointments
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.changeNotifications}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                changeNotifications: e.target.checked,
                              })
                            }
                            disabled={isFormDisabled}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="font-medium">
                              Change Notifications
                            </div>
                            <div className="text-sm text-gray-600">
                              Updates about changes to your scheduled dinners
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Reminder Timing */}
                    <div className="space-y-2">
                      <Label htmlFor="reminderDays">
                        Send reminders how many days before?
                      </Label>
                      <Select
                        value={formData.reminderDaysBefore.toString()}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            reminderDaysBefore: parseInt(value),
                          })
                        }
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger className="w-full md:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Day of the dinner</SelectItem>
                          <SelectItem value="1">1 day before</SelectItem>
                          <SelectItem value="2">2 days before</SelectItem>
                          <SelectItem value="3">3 days before</SelectItem>
                          <SelectItem value="7">1 week before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contact Method Warning */}
                {(formData.contactMethod === "sms" ||
                  formData.contactMethod === "both") &&
                  !formData.phone && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You&apos;ve chosen to receive SMS notifications, but
                        haven&apos;t provided a phone number. Please add your
                        phone number above.
                      </AlertDescription>
                    </Alert>
                  )}

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={isFormDisabled}
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
