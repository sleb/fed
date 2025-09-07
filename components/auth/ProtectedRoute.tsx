"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles,
  redirectTo,
  fallback = <ProtectedRouteFallback />,
}: ProtectedRouteProps) {
  const { user, userData, loading, needsOnboarding } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    // Handle authentication requirement
    if (requireAuth && !user) {
      router.replace("/login");
      return;
    }

    // Handle onboarding requirement (but not on the onboarding page itself)
    if (needsOnboarding && !window.location.pathname.includes("/onboarding")) {
      router.replace("/onboarding");
      return;
    }

    // Handle role-based access
    if (
      allowedRoles &&
      userData?.role &&
      !allowedRoles.includes(userData.role)
    ) {
      const defaultRedirect = getDefaultRedirectForRole(userData.role);
      router.replace(redirectTo || defaultRedirect);
      return;
    }
  }, [
    user,
    userData,
    loading,
    needsOnboarding,
    requireAuth,
    allowedRoles,
    redirectTo,
    router,
  ]);

  // Show fallback while loading or redirecting
  if (loading) {
    return <>{fallback}</>;
  }

  // Don't render if auth is required but user is not authenticated
  if (requireAuth && !user) {
    return <>{fallback}</>;
  }

  // Don't render if role is not allowed
  if (allowedRoles && userData?.role && !allowedRoles.includes(userData.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

function ProtectedRouteFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

function getDefaultRedirectForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "missionary":
    case "member":
    default:
      return "/calendar";
  }
}

// Convenience wrapper components
export function AdminRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "allowedRoles">) {
  return (
    <ProtectedRoute allowedRoles={["admin"]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({
  children,
  ...props
}: Omit<ProtectedRouteProps, "requireAuth">) {
  return (
    <ProtectedRoute requireAuth={true} {...props}>
      {children}
    </ProtectedRoute>
  );
}
