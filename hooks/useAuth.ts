"use client";

import {
  getCurrentUserRole,
  getUserData,
  onAuthStateChange,
  UserData,
  UserRole,
} from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";

export interface UseAuthReturn {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isMissionary: boolean;
  isMember: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);

      if (user) {
        setRoleLoading(true);
        try {
          const [userRole, userDataResult] = await Promise.all([
            getCurrentUserRole(),
            getUserData(user.uid),
          ]);
          setRole(userRole || "member"); // Default to member if no role found
          setUserData(userDataResult);
        } catch (error) {
          console.error("Error getting user data:", error);
          setRole("member"); // Default to member on error
          setUserData(null);
        } finally {
          setRoleLoading(false);
        }
      } else {
        setRole(null);
        setUserData(null);
        setRoleLoading(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isLoadingComplete = !loading && !roleLoading;

  return {
    user,
    userData,
    loading: loading || roleLoading,
    role,
    isAdmin: isLoadingComplete && role === "admin",
    isMissionary: isLoadingComplete && role === "missionary",
    isMember: isLoadingComplete && (role === "member" || role === null),
  };
};
