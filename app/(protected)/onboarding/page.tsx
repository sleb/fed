"use client";

import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile } from "@/lib/firebase/auth";
import { OnboardingFormData } from "@/types";
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
      const updates: any = {
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
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
