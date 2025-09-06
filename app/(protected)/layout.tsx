"use client";

import { AuthenticatedRoute } from "@/components/auth/ProtectedRoute";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedRoute>
      {children}
    </AuthenticatedRoute>
  );
}
