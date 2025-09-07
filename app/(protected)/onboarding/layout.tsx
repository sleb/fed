"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    // Redirect to login if not authenticated
    if (!user) {
      router.replace("/login");
      return;
    }

    // Redirect to calendar if onboarding is already completed
    if (userData?.onboardingCompleted) {
      router.replace("/calendar");
      return;
    }
  }, [user, userData, loading, router]);

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

  // Render onboarding page directly (bypass normal protected route logic)
  return <>{children}</>;
}
