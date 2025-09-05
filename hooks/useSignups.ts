'use client';

import { useAuth } from '@/lib/firebase/auth';
import {
    canUserSignUpForSlot,
    cancelSignup,
    createSignup,
    getAvailableDinnerSlots,
    getUserSignups
} from '@/lib/firebase/signups';
import {
    DinnerSlotFilters,
    DinnerSlotWithMissionary,
    SignupFilters,
    SignupFormData,
    SignupWithDetails
} from '@/types';
import { useCallback, useEffect, useState } from 'react';

export interface UseSignupsReturn {
  // Available dinner slots
  availableSlots: DinnerSlotWithMissionary[];
  slotsLoading: boolean;
  slotsError: string | null;

  // User signups
  userSignups: SignupWithDetails[];
  signupsLoading: boolean;
  signupsError: string | null;

  // Actions
  loadAvailableSlots: (filters?: DinnerSlotFilters) => Promise<void>;
  loadUserSignups: (filters?: SignupFilters) => Promise<void>;
  signUpForSlot: (formData: SignupFormData) => Promise<void>;
  cancelUserSignup: (signupId: string) => Promise<void>;
  checkCanSignUp: (dinnerSlotId: string) => Promise<boolean>;

  // Loading states for actions
  signingUp: boolean;
  cancelling: boolean;
  checkingAvailability: boolean;

  // Refresh functions
  refreshSlots: () => Promise<void>;
  refreshSignups: () => Promise<void>;
}

export const useSignups = (autoLoad = true): UseSignupsReturn => {
  const { user } = useAuth();

  // State for available slots
  const [availableSlots, setAvailableSlots] = useState<DinnerSlotWithMissionary[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // State for user signups
  const [userSignups, setUserSignups] = useState<SignupWithDetails[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(false);
  const [signupsError, setSignupsError] = useState<string | null>(null);

  // Action loading states
  const [signingUp, setSigningUp] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Load available dinner slots
  const loadAvailableSlots = useCallback(async (filters: DinnerSlotFilters = {}) => {
    if (!user) return;

    setSlotsLoading(true);
    setSlotsError(null);

    try {
      const slots = await getAvailableDinnerSlots(filters);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setSlotsError(error instanceof Error ? error.message : 'Failed to load available dinner slots');
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [user]);

  // Load user signups
  const loadUserSignups = useCallback(async (filters: SignupFilters = {}) => {
    if (!user) return;

    setSignupsLoading(true);
    setSignupsError(null);

    try {
      const signups = await getUserSignups(user.uid, filters);
      setUserSignups(signups);
    } catch (error) {
      console.error('Error loading user signups:', error);
      setSignupsError(error instanceof Error ? error.message : 'Failed to load your signups');
      setUserSignups([]);
    } finally {
      setSignupsLoading(false);
    }
  }, [user]);

  // Sign up for a dinner slot
  const signUpForSlot = useCallback(async (formData: SignupFormData) => {
    if (!user) {
      throw new Error('You must be logged in to sign up');
    }

    setSigningUp(true);

    try {
      await createSignup(user.uid, formData);

      // Refresh both available slots and user signups
      await Promise.all([
        loadAvailableSlots(),
        loadUserSignups()
      ]);
    } catch (error) {
      console.error('Error signing up for slot:', error);
      throw error; // Re-throw so calling component can handle
    } finally {
      setSigningUp(false);
    }
  }, [user, loadAvailableSlots, loadUserSignups]);

  // Cancel a signup
  const cancelUserSignup = useCallback(async (signupId: string) => {
    if (!user) {
      throw new Error('You must be logged in to cancel signups');
    }

    setCancelling(true);

    try {
      await cancelSignup(signupId);

      // Refresh both available slots and user signups
      await Promise.all([
        loadAvailableSlots(),
        loadUserSignups()
      ]);
    } catch (error) {
      console.error('Error cancelling signup:', error);
      throw error;
    } finally {
      setCancelling(false);
    }
  }, [user, loadAvailableSlots, loadUserSignups]);

  // Check if user can sign up for a specific slot
  const checkCanSignUp = useCallback(async (dinnerSlotId: string): Promise<boolean> => {
    if (!user) return false;

    setCheckingAvailability(true);

    try {
      return await canUserSignUpForSlot(user.uid, dinnerSlotId);
    } catch (error) {
      console.error('Error checking signup availability:', error);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  }, [user]);

  // Refresh functions
  const refreshSlots = useCallback(() => loadAvailableSlots(), [loadAvailableSlots]);
  const refreshSignups = useCallback(() => loadUserSignups(), [loadUserSignups]);

  // Auto-load data when user changes or component mounts
  useEffect(() => {
    if (autoLoad && user) {
      loadAvailableSlots();
      loadUserSignups();
    }
  }, [user, autoLoad, loadAvailableSlots, loadUserSignups]);

  return {
    // Available dinner slots
    availableSlots,
    slotsLoading,
    slotsError,

    // User signups
    userSignups,
    signupsLoading,
    signupsError,

    // Actions
    loadAvailableSlots,
    loadUserSignups,
    signUpForSlot,
    cancelUserSignup,
    checkCanSignUp,

    // Loading states for actions
    signingUp,
    cancelling,
    checkingAvailability,

    // Refresh functions
    refreshSlots,
    refreshSignups
  };
};

// Hook for managing signup filters
export interface UseSignupFiltersReturn {
  filters: DinnerSlotFilters;
  updateFilters: (updates: Partial<DinnerSlotFilters>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export const useSignupFilters = (initialFilters: DinnerSlotFilters = {}): UseSignupFiltersReturn => {
  const [filters, setFilters] = useState<DinnerSlotFilters>({
    availableOnly: true,
    ...initialFilters
  });

  const updateFilters = useCallback((updates: Partial<DinnerSlotFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ availableOnly: true });
  }, []);

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof DinnerSlotFilters];
    if (key === 'availableOnly') return false; // This is always on
    return value !== undefined && value !== '' && value !== null;
  });

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters
  };
};
