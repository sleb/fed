"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { OnboardingFormData } from "@/types";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";

interface OnboardingFormProps {
  userEmail: string;
  userName: string;
  onComplete: (data: OnboardingFormData) => Promise<void>;
  loading?: boolean;
}

export default function OnboardingForm({
  userEmail,
  userName,
  onComplete,
  loading = false,
}: OnboardingFormProps) {
  const [formData, setFormData] = useState<OnboardingFormData>({
    phone: "",
    address: "",
    contactMethod: "email",
    signupReminders: true,
    appointmentReminders: true,
    changeNotifications: true,
    reminderDaysBefore: 1,
  });

  const [errors, setErrors] = useState<{
    phone?: string;
    contactMethod?: string;
  }>({});

  const [submitting, setSubmitting] = useState(false);

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

    // Validate that at least one notification type is enabled
    if (
      !formData.signupReminders &&
      !formData.appointmentReminders &&
      !formData.changeNotifications
    ) {
      newErrors.contactMethod = "Please enable at least one notification type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await onComplete(formData);
    } catch (error) {
      console.error("Onboarding error:", error);
      // Handle error (you might want to show a toast notification)
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactMethodChange = (value: "email" | "sms" | "both") => {
    setFormData({ ...formData, contactMethod: value });

    // Clear contact method error
    if (errors.contactMethod) {
      setErrors({ ...errors, contactMethod: undefined });
    }
  };

  const isFormDisabled = loading || submitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to Dinner Coordinator!
          </CardTitle>
          <CardDescription className="text-lg">
            Let&apos;s set up your profile to help coordinate missionary dinners
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info Summary */}
            <Alert variant="info">
              <User className="h-4 w-4" />
              <AlertTitle>Your Information</AlertTitle>
              <AlertDescription>
                <div className="space-y-1">
                  <p>
                    <strong>Name:</strong> {userName}
                  </p>
                  <p>
                    <strong>Email:</strong> {userEmail}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Contact Information
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    disabled={true}
                    className="bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500">
                    Your email address from Google sign-in (cannot be changed)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number{" "}
                      <span className="text-sm text-gray-500">(optional)</span>
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
                      <span className="text-sm text-gray-500">(optional)</span>
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
                    onValueChange={handleContactMethodChange}
                    disabled={isFormDisabled}
                  >
                    <SelectTrigger
                      className={errors.contactMethod ? "border-red-500" : ""}
                    >
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
                  {errors.contactMethod && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {errors.contactMethod}
                    </p>
                  )}
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
                        <div className="font-medium">Appointment Reminders</div>
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
                        <div className="font-medium">Change Notifications</div>
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
                    <SelectTrigger>
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
                  <AlertTitle>Phone Number Required</AlertTitle>
                  <AlertDescription>
                    You&apos;ve chosen to receive SMS notifications, but
                    haven&apos;t provided a phone number. Please add your phone
                    number above or change your contact preference to
                    &quot;Email Only&quot;.
                  </AlertDescription>
                </Alert>
              )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={isFormDisabled}
                size="lg"
                className="min-w-32"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
