"use client";

import { AdminRoute } from "@/components/auth/ProtectedRoute";

export default function MetricsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      {children}
    </AdminRoute>
  );
}
