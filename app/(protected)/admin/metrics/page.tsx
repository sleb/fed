"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminMetrics } from "@/types/admin-metrics";
import { AlertTriangle, BarChart3, RefreshCw, TrendingUp, Users, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { CompanionshipMealsCard } from "./components/CompanionshipMealsCard";
import { MetricCard, MetricGrid } from "./components/MetricCard";
import { MetricsService } from "./lib/metricsService";

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await MetricsService.calculateMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleRefresh = () => {
    loadMetrics(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Overview Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>

          {/* Companionship Card Skeleton */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-6" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Metrics</h1>
            <p className="text-gray-600 mt-1">System analytics and insights</p>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Metrics</AlertTitle>
            <AlertDescription className="mt-2">
              {error}
              <Button
                onClick={() => loadMetrics()}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Metrics</h1>
            <p className="text-gray-600 mt-1">
              System analytics and insights • Last updated: {metrics.lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Overview Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Overview
          </h2>

          <MetricGrid columns={4}>
            {/* Basic Counts */}
            <MetricCard
              title="Active Members"
              value={metrics.overview.totalActiveUsers}
              icon={<Users className="h-4 w-4" />}
              subtitle="Total registered users"
              status="neutral"
            />

            <MetricCard
              title="Active Missionaries"
              value={metrics.overview.totalActiveMissionaries}
              icon={<Users className="h-4 w-4" />}
              subtitle="Currently serving"
              status="good"
            />

            <MetricCard
              title="Companionships"
              value={metrics.overview.totalActiveCompanionships}
              icon={<Users className="h-4 w-4" />}
              subtitle="Active areas"
              status="good"
            />

            <MetricCard
              title="Participation Rate"
              value={`${metrics.overview.participationRate}%`}
              subtitle="Members active in last 30 days"
              status={metrics.overview.participationRate > 50 ? 'good' : metrics.overview.participationRate > 25 ? 'warning' : 'error'}
            />

            {/* Signup Trends */}
            <MetricCard
              title="Signups This Week"
              value={metrics.overview.signupsThisWeek}
              icon={<Utensils className="h-4 w-4" />}
              trend={{
                direction: metrics.overview.weekOverWeekChange > 0 ? 'up' :
                          metrics.overview.weekOverWeekChange < 0 ? 'down' : 'flat',
                percentage: Math.abs(metrics.overview.weekOverWeekChange),
                period: 'vs last week'
              }}
              status={metrics.overview.signupsThisWeek > 0 ? 'good' : 'error'}
            />

            <MetricCard
              title="Signups Last 30 Days"
              value={metrics.overview.signupsLast30Days}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{
                direction: metrics.overview.monthOverMonthChange > 0 ? 'up' :
                          metrics.overview.monthOverMonthChange < 0 ? 'down' : 'flat',
                percentage: Math.abs(metrics.overview.monthOverMonthChange),
                period: 'vs previous 30 days'
              }}
              status="neutral"
            />

            {/* Fairness Indicators */}
            <MetricCard
              title="Companionships Without Meals"
              value={metrics.overview.companionshipsWithoutMeals}
              subtitle="This week"
              status={metrics.overview.companionshipsWithoutMeals === 0 ? 'good' :
                     metrics.overview.companionshipsWithoutMeals <= 2 ? 'warning' : 'error'}
              icon={<AlertTriangle className="h-4 w-4" />}
            />

            <MetricCard
              title="Over-served Companionships"
              value={metrics.overview.companionshipsOverServed}
              subtitle="More than 2 meals this week"
              status={metrics.overview.companionshipsOverServed === 0 ? 'good' : 'warning'}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </MetricGrid>
        </div>

        {/* Companionship Meal Distribution */}
        <div className="mb-8">
          <CompanionshipMealsCard companionshipStats={metrics.companionshipStats} />
        </div>

        {/* Member Participation */}
        {metrics.memberParticipation.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Contributors
            </h2>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Member Participation</h3>
                <p className="text-sm text-gray-600">Most active members by total signups</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Signups
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last 30 Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last 7 Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Signup
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.memberParticipation.slice(0, 10).map((member) => (
                      <tr key={member.userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.userEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.totalSignups}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.signupsLast30Days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.signupsLast7Days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.lastSignupDate ?
                            member.lastSignupDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            }) :
                            'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Signup Timing Patterns */}
        {metrics.timingPatterns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Signup Timing Patterns</h2>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">When do people sign up?</h3>
              <div className="space-y-3">
                {metrics.timingPatterns.map((pattern) => {
                  const getPatternLabel = (days: number) => {
                    switch (days) {
                      case -1: return 'Same day or late';
                      case 0: return 'Same day';
                      case 1: return '1 day before';
                      case 2: return '2-3 days before';
                      case 7: return '4-7 days before';
                      case 14: return '1-2 weeks before';
                      case 30: return '2+ weeks before';
                      default: return `${days} days before`;
                    }
                  };

                  return (
                    <div key={pattern.daysBeforeDinner} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {getPatternLabel(pattern.daysBeforeDinner)}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pattern.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {pattern.signupCount}
                        </span>
                        <span className="text-sm text-gray-500 w-12 text-right">
                          {pattern.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
