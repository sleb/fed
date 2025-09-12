"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanionshipMealStats } from "@/types/admin-metrics";
import { AlertTriangle, Calendar, CheckCircle, Users } from "lucide-react";

interface CompanionshipMealsCardProps {
  companionshipStats: CompanionshipMealStats[];
  className?: string;
}

export function CompanionshipMealsCard({ companionshipStats, className }: CompanionshipMealsCardProps) {
  const getMealStatus = (mealsThisWeek: number) => {
    if (mealsThisWeek === 0) {
      return { status: 'error', label: 'No meals', color: 'bg-red-100 text-red-800' };
    } else if (mealsThisWeek === 1) {
      return { status: 'good', label: '1 meal', color: 'bg-green-100 text-green-800' };
    } else if (mealsThisWeek === 2) {
      return { status: 'good', label: '2 meals', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'warning', label: `${mealsThisWeek} meals`, color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const getTrendIcon = (thisWeek: number, lastWeek: number) => {
    if (thisWeek > lastWeek) {
      return <span className="text-green-600 text-xs">↗</span>;
    } else if (thisWeek < lastWeek) {
      return <span className="text-red-600 text-xs">↘</span>;
    } else {
      return <span className="text-gray-600 text-xs">→</span>;
    }
  };

  const formatLastMealDate = (date?: Date) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate summary stats
  const totalCompanionships = companionshipStats.length;
  const companionshipsWithMeals = companionshipStats.filter(c => c.mealsThisWeek > 0).length;
  const companionshipsOverServed = companionshipStats.filter(c => c.mealsThisWeek > 2).length;
  const companionshipsUnderServed = companionshipStats.filter(c => c.mealsThisWeek === 0).length;
  const averageMealsPerCompanionship = totalCompanionships === 0 ? 0 :
    companionshipStats.reduce((sum, c) => sum + c.mealsThisWeek, 0) / totalCompanionships;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Companionship Meal Distribution
        </CardTitle>
        <CardDescription>
          Meals scheduled per companionship this week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{companionshipsWithMeals}</div>
            <div className="text-xs text-gray-600">Have meals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{companionshipsUnderServed}</div>
            <div className="text-xs text-gray-600">No meals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{companionshipsOverServed}</div>
            <div className="text-xs text-gray-600">Over-served</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{averageMealsPerCompanionship.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Avg per comp</div>
          </div>
        </div>

        {/* Companionship List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {companionshipStats.map((companionship) => {
            const mealStatus = getMealStatus(companionship.mealsThisWeek);

            return (
              <div
                key={companionship.companionshipId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {companionship.companionshipArea}
                    </h4>
                    <Badge className={mealStatus.color}>
                      {mealStatus.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last meal: {formatLastMealDate(companionship.lastMealDate)}
                    </span>
                    <span>
                      4-week avg: {companionship.averageMealsPerWeek.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900">
                        {companionship.mealsThisWeek}
                      </span>
                      {getTrendIcon(companionship.mealsThisWeek, companionship.mealsLastWeek)}
                    </div>
                    <div className="text-xs text-gray-500">
                      vs {companionship.mealsLastWeek} last week
                    </div>
                  </div>

                  {/* Status Icon */}
                  {companionship.mealsThisWeek === 0 ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : companionship.mealsThisWeek <= 2 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {companionshipStats.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No companionships found</p>
            <p className="text-xs">Add some companionships to see meal distribution</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
