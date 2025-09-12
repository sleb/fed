export interface CompanionshipMealStats {
  companionshipId: string;
  companionshipArea: string;
  mealsThisWeek: number;
  mealsLastWeek: number;
  mealsLast4Weeks: number;
  averageMealsPerWeek: number;
  lastMealDate?: Date;
}

export interface MemberParticipationStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalSignups: number;
  signupsLast30Days: number;
  signupsLast7Days: number;
  lastSignupDate?: Date;
  isActive: boolean; // signed up in last 30 days
}

export interface SignupTimingPattern {
  daysBeforeDinner: number;
  signupCount: number;
  percentage: number;
}

export interface WeeklySignupTrend {
  weekStartDate: string; // ISO date string
  signupCount: number;
  weekNumber: number;
}

export interface DayOfWeekPattern {
  dayName: string;
  dayNumber: number; // 0=Sunday, 1=Monday, etc.
  signupCount: number;
  percentage: number;
}

export interface AdminMetricsOverview {
  // Basic counts
  totalActiveUsers: number;
  totalActiveMissionaries: number;
  totalActiveCompanionships: number;

  // Recent activity
  signupsThisWeek: number;
  signupsLastWeek: number;
  signupsLast30Days: number;

  // Trends
  weekOverWeekChange: number; // percentage change
  monthOverMonthChange: number; // percentage change

  // Participation
  activeMembers: number; // members who signed up in last 30 days
  participationRate: number; // percentage of total members who are active

  // Fairness indicators
  companionshipsWithoutMeals: number; // companionships with 0 meals this week
  companionshipsOverServed: number; // companionships with >2 meals this week
}

export interface AdminMetrics {
  overview: AdminMetricsOverview;
  companionshipStats: CompanionshipMealStats[];
  memberParticipation: MemberParticipationStats[];
  signupTrends: WeeklySignupTrend[];
  timingPatterns: SignupTimingPattern[];
  dayOfWeekPatterns: DayOfWeekPattern[];
  lastUpdated: Date;
}

export interface MetricCard {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
    period: string;
  };
  status?: 'good' | 'warning' | 'error';
}
