"use client";

import {
  getCurrentUserRole,
  onAuthStateChange,
  UserRole,
} from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isMissionary: boolean;
  isMember: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);

      if (user) {
        setRoleLoading(true);
        try {
          const userRole = await getCurrentUserRole();
          setRole(userRole || "member"); // Default to member if no role found
        } catch (error) {
          console.error("Error getting user role:", error);
          setRole("member"); // Default to member on error
        } finally {
          setRoleLoading(false);
        }
      } else {
        setRole(null);
        setRoleLoading(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isLoadingComplete = !loading && !roleLoading;

  return {
    user,
    loading: loading || roleLoading,
    role,
    isAdmin: isLoadingComplete && role === "admin",
    isMissionary: isLoadingComplete && role === "missionary",
    isMember: isLoadingComplete && (role === "member" || role === null),
  };
};
