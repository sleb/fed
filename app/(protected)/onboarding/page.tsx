"use client";

import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile } from "@/lib/firebase/auth";
import { OnboardingFormData } from "@/types";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    // Redirect if onboarding is already completed
    if (!loading && userData?.onboardingCompleted) {
      router.push("/calendar");
      return;
    }
  }, [loading, user, userData, router]);

  const handleOnboardingComplete = async (formData: OnboardingFormData) => {
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      // Update user profile with onboarding data
      const updates: {
        onboardingCompleted: boolean;
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
        onboardingCompleted: true,
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

      // Redirect to calendar after successful onboarding
      router.push("/calendar");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setError("Failed to save your preferences. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => setError(null)} variant="outline">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingForm
      userName={user.displayName || user.email || "User"}
      userEmail={user.email || ""}
      onComplete={handleOnboardingComplete}
      loading={submitting}
    />
  );
}
