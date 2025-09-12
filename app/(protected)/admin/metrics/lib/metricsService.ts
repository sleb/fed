import { db } from "@/lib/firebase/config";
import type {
  AdminMetrics,
  AdminMetricsOverview,
  CompanionshipMealStats,
  DayOfWeekPattern,
  MemberParticipationStats,
  SignupTimingPattern,
  WeeklySignupTrend,
} from "@/types/admin-metrics";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

// Type definitions for Firestore documents
interface UserDoc {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: "member" | "admin";
  onboardingCompleted: boolean;
  preferences: {
    emailNotifications: boolean;
    signupReminders: boolean;
    appointmentReminders: boolean;
    changeNotifications: boolean;
    reminderDaysBefore: number;
  };
  stats: {
    totalSignups: number;
    completedDinners: number;
    lastDinnerDate?: Date;
  };
  createdAt: Date;
  lastLoginAt: Date;
}

interface MissionaryDoc {
  id: string;
  name: string;
  email?: string;
  dinnerPreferences?: string[];
  allergies?: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CompanionshipDoc {
  id: string;
  area: string;
  address: string;
  apartmentNumber?: string;
  phone: string;
  missionaryIds: string[];
  daysOfWeek: number[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SignupDoc {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  companionshipId: string;
  dinnerDate: Date;
  dayOfWeek: string;
  guestCount: number;
  status: "confirmed" | "pending" | "completed";
  contactPreference: "email";
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MetricsService {
  /**
   * Calculate all admin metrics
   */
  static async calculateMetrics(): Promise<AdminMetrics> {
    console.log("🔢 Calculating admin metrics...");

    const [users, missionaries, companionships, signups] = await Promise.all([
      this.getUsers(),
      this.getMissionaries(),
      this.getCompanionships(),
      this.getSignups(),
    ]);

    console.log(
      `📊 Data loaded: ${users.length} users, ${missionaries.length} missionaries, ${companionships.length} companionships, ${signups.length} signups`,
    );

    const now = new Date();

    // Calculate all metrics
    const overview = this.calculateOverview(
      users,
      missionaries,
      companionships,
      signups,
      now,
    );
    const companionshipStats = this.calculateCompanionshipStats(
      companionships,
      signups,
      now,
    );
    const memberParticipation = this.calculateMemberParticipation(
      users,
      signups,
      now,
    );
    const signupTrends = this.calculateSignupTrends(signups, now);
    const timingPatterns = this.calculateTimingPatterns(signups);
    const dayOfWeekPatterns = this.calculateDayOfWeekPatterns(signups);

    return {
      overview,
      companionshipStats,
      memberParticipation,
      signupTrends,
      timingPatterns,
      dayOfWeekPatterns,
      lastUpdated: now,
    };
  }

  /**
   * Get all users
   */
  private static async getUsers(): Promise<UserDoc[]> {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as UserDoc,
    );
  }

  /**
   * Get all active missionaries
   */
  private static async getMissionaries(): Promise<MissionaryDoc[]> {
    const missionariesRef = collection(db, "missionaries");
    const q = query(missionariesRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as MissionaryDoc,
    );
  }

  /**
   * Get all active companionships
   */
  private static async getCompanionships(): Promise<CompanionshipDoc[]> {
    const companionshipsRef = collection(db, "companionships");
    const q = query(companionshipsRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as CompanionshipDoc,
    );
  }

  /**
   * Get all signups
   */
  private static async getSignups(): Promise<SignupDoc[]> {
    const signupsRef = collection(db, "signups");
    const q = query(signupsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dinnerDate: data.dinnerDate?.toDate?.() || data.dinnerDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as SignupDoc;
    });
  }

  /**
   * Calculate overview metrics
   */
  private static calculateOverview(
    users: UserDoc[],
    missionaries: MissionaryDoc[],
    companionships: CompanionshipDoc[],
    signups: SignupDoc[],
    now: Date,
  ): AdminMetricsOverview {
    const startOfWeek = this.getStartOfWeek(now);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Filter signups by time periods
    const signupsThisWeek = signups.filter(
      (s) => s.dinnerDate >= startOfWeek && s.dinnerDate <= now,
    ).length;

    const signupsLastWeek = signups.filter(
      (s) => s.dinnerDate >= startOfLastWeek && s.dinnerDate < startOfWeek,
    ).length;

    const signupsLast30Days = signups.filter(
      (s) => s.dinnerDate >= thirtyDaysAgo && s.dinnerDate <= now,
    ).length;

    const signupsLast60Days = signups.filter(
      (s) => s.dinnerDate >= sixtyDaysAgo && s.dinnerDate <= now,
    ).length;

    // Calculate trends
    const weekOverWeekChange =
      signupsLastWeek === 0
        ? 0
        : ((signupsThisWeek - signupsLastWeek) / signupsLastWeek) * 100;

    const signupsFirst30Days = signupsLast60Days - signupsLast30Days;
    const monthOverMonthChange =
      signupsFirst30Days === 0
        ? 0
        : ((signupsLast30Days - signupsFirst30Days) / signupsFirst30Days) * 100;

    // Active members (signed up in last 30 days)
    const activeUserIds = new Set(
      signups.filter((s) => s.createdAt >= thirtyDaysAgo).map((s) => s.userId),
    );
    const activeMembers = activeUserIds.size;
    const participationRate =
      users.length === 0 ? 0 : (activeMembers / users.length) * 100;

    // Companionship meal distribution this week
    const companionshipMealsThisWeek = new Map<string, number>();
    signups
      .filter((s) => s.dinnerDate >= startOfWeek && s.dinnerDate <= now)
      .forEach((signup) => {
        const count =
          companionshipMealsThisWeek.get(signup.companionshipId) || 0;
        companionshipMealsThisWeek.set(signup.companionshipId, count + 1);
      });

    const companionshipsWithoutMeals =
      companionships.length - companionshipMealsThisWeek.size;
    const companionshipsOverServed = Array.from(
      companionshipMealsThisWeek.values(),
    ).filter((count) => count > 2).length;

    return {
      totalActiveUsers: users.length,
      totalActiveMissionaries: missionaries.length,
      totalActiveCompanionships: companionships.length,
      signupsThisWeek,
      signupsLastWeek,
      signupsLast30Days,
      weekOverWeekChange: Math.round(weekOverWeekChange * 100) / 100,
      monthOverMonthChange: Math.round(monthOverMonthChange * 100) / 100,
      activeMembers,
      participationRate: Math.round(participationRate * 100) / 100,
      companionshipsWithoutMeals,
      companionshipsOverServed,
    };
  }

  /**
   * Calculate companionship meal statistics
   */
  private static calculateCompanionshipStats(
    companionships: CompanionshipDoc[],
    signups: SignupDoc[],
    now: Date,
  ): CompanionshipMealStats[] {
    const startOfWeek = this.getStartOfWeek(now);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const fourWeeksAgo = new Date(startOfWeek);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    return companionships
      .map((companionship) => {
        const companionshipSignups = signups.filter(
          (s) => s.companionshipId === companionship.id,
        );

        const mealsThisWeek = companionshipSignups.filter(
          (s) => s.dinnerDate >= startOfWeek && s.dinnerDate <= now,
        ).length;

        const mealsLastWeek = companionshipSignups.filter(
          (s) => s.dinnerDate >= startOfLastWeek && s.dinnerDate < startOfWeek,
        ).length;

        const mealsLast4Weeks = companionshipSignups.filter(
          (s) => s.dinnerDate >= fourWeeksAgo && s.dinnerDate <= now,
        ).length;

        const averageMealsPerWeek = mealsLast4Weeks / 4;

        const lastMeal = companionshipSignups
          .filter((s) => s.dinnerDate <= now)
          .sort((a, b) => b.dinnerDate.getTime() - a.dinnerDate.getTime())[0];

        return {
          companionshipId: companionship.id,
          companionshipArea: companionship.area,
          mealsThisWeek,
          mealsLastWeek,
          mealsLast4Weeks,
          averageMealsPerWeek: Math.round(averageMealsPerWeek * 100) / 100,
          lastMealDate: lastMeal?.dinnerDate,
        };
      })
      .sort((a, b) => b.mealsThisWeek - a.mealsThisWeek); // Sort by most meals this week
  }

  /**
   * Calculate member participation statistics
   */
  private static calculateMemberParticipation(
    users: UserDoc[],
    signups: SignupDoc[],
    now: Date,
  ): MemberParticipationStats[] {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return users
      .map((user) => {
        const userSignups = signups.filter((s) => s.userId === user.id);
        const signupsLast30Days = userSignups.filter(
          (s) => s.createdAt >= thirtyDaysAgo,
        ).length;
        const signupsLast7Days = userSignups.filter(
          (s) => s.createdAt >= sevenDaysAgo,
        ).length;

        const lastSignup = userSignups.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0];

        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          totalSignups: userSignups.length,
          signupsLast30Days,
          signupsLast7Days,
          lastSignupDate: lastSignup?.createdAt,
          isActive: signupsLast30Days > 0,
        };
      })
      .sort((a, b) => b.totalSignups - a.totalSignups); // Sort by most active
  }

  /**
   * Calculate weekly signup trends (last 8 weeks)
   */
  private static calculateSignupTrends(
    signups: SignupDoc[],
    now: Date,
  ): WeeklySignupTrend[] {
    const trends: WeeklySignupTrend[] = [];

    for (let i = 0; i < 8; i++) {
      const weekStart = this.getStartOfWeek(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const signupCount = signups.filter(
        (s) => s.dinnerDate >= weekStart && s.dinnerDate <= weekEnd,
      ).length;

      trends.unshift({
        weekStartDate: weekStart.toISOString().split("T")[0],
        signupCount,
        weekNumber: i + 1,
      });
    }

    return trends;
  }

  /**
   * Calculate signup timing patterns (how far in advance people sign up)
   */
  private static calculateTimingPatterns(
    signups: SignupDoc[],
  ): SignupTimingPattern[] {
    const patterns = new Map<number, number>();
    let total = 0;

    signups.forEach((signup) => {
      if (signup.dinnerDate && signup.createdAt) {
        const timeDiff =
          signup.dinnerDate.getTime() - signup.createdAt.getTime();
        const daysBeforeDinner = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        // Group into buckets
        let bucket: number;
        if (daysBeforeDinner < 0)
          bucket = -1; // Same day or after dinner date
        else if (daysBeforeDinner === 0)
          bucket = 0; // Same day
        else if (daysBeforeDinner === 1)
          bucket = 1; // 1 day before
        else if (daysBeforeDinner <= 3)
          bucket = 2; // 2-3 days before
        else if (daysBeforeDinner <= 7)
          bucket = 7; // 4-7 days before
        else if (daysBeforeDinner <= 14)
          bucket = 14; // 1-2 weeks before
        else bucket = 30; // More than 2 weeks before

        patterns.set(bucket, (patterns.get(bucket) || 0) + 1);
        total++;
      }
    });

    return Array.from(patterns.entries())
      .map(([bucket, count]) => ({
        daysBeforeDinner: bucket,
        signupCount: count,
        percentage: total === 0 ? 0 : Math.round((count / total) * 10000) / 100,
      }))
      .sort((a, b) => a.daysBeforeDinner - b.daysBeforeDinner);
  }

  /**
   * Calculate day of week signup patterns
   */
  private static calculateDayOfWeekPatterns(
    signups: SignupDoc[],
  ): DayOfWeekPattern[] {
    const patterns = new Map<number, number>();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    signups.forEach((signup) => {
      if (signup.dinnerDate) {
        const dayOfWeek = signup.dinnerDate.getDay();
        patterns.set(dayOfWeek, (patterns.get(dayOfWeek) || 0) + 1);
      }
    });

    const total = signups.filter((s) => s.dinnerDate).length;

    return Array.from({ length: 7 }, (_, i) => ({
      dayName: dayNames[i],
      dayNumber: i,
      signupCount: patterns.get(i) || 0,
      percentage:
        total === 0
          ? 0
          : Math.round(((patterns.get(i) || 0) / total) * 10000) / 100,
    }));
  }

  /**
   * Get start of week (Sunday) for a given date
   */
  private static getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Format a date range for display
   */
  static formatDateRange(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString("en-US", { ...options, year: "numeric" })} - ${end.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
    } else if (start.getMonth() !== end.getMonth()) {
      return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
    } else {
      return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()}-${end.getDate()}`;
    }
  }

  /**
   * Format a number with appropriate units
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  }

  /**
   * Get trend direction and color
   */
  static getTrendStatus(change: number): {
    direction: "up" | "down" | "flat";
    color: string;
    icon: string;
  } {
    if (Math.abs(change) < 0.1) {
      return { direction: "flat", color: "text-gray-600", icon: "→" };
    } else if (change > 0) {
      return { direction: "up", color: "text-green-600", icon: "↗" };
    } else {
      return { direction: "down", color: "text-red-600", icon: "↘" };
    }
  }
}
