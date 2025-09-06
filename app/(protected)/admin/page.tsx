"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { seedDatabase } from "@/lib/firebase/seedData";
import {
  AlertTriangle,
  Calendar,
  Database,
  Users,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setError(null);
    setSeedResult(null);

    try {
      await seedDatabase();
      setSeedResult(
        "Database seeded successfully! You can now test the signup functionality.",
      );
    } catch (err) {
      console.error("Seeding error:", err);
      setError(err instanceof Error ? err.message : "Failed to seed database");
    } finally {
      setSeeding(false);
    }
  };

  // Component is now protected by AdminRoute layout, no loading check needed

  // Component is now protected by AdminRoute layout
  if (!user) {
    return null; // Let the auth route handle this
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage missionary dinner coordination
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Welcome, {user.displayName}
              </p>
              <Badge variant="default">Admin</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/calendar")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Utensils className="h-5 w-5" />
                Dinner Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View calendar and manage dinner signups
              </p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/missionaries")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Missionaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage individual missionaries
              </p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/companionships")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Companionships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage companionships and assignments
              </p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/calendar")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Calendar Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create dinner calendars and schedules
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View signup analytics
              </p>
              <p className="text-xs text-gray-500 mt-1">(Coming soon)</p>
            </CardContent>
          </Card>
        </div>

        {/* Database Seeding Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Setup
            </CardTitle>
            <CardDescription>
              Initialize the database with sample missionaries and dinner slots
              for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800">
                    Development Setup
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will create sample missionaries and dinner slots in
                    your Firebase database. Only use this in development or
                    testing environments.
                  </p>
                </div>
              </div>
            </div>

            {/* Results */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800">Error</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {seedResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-800">Success</h4>
                    <p className="text-sm text-green-700 mt-1">{seedResult}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Seed Button */}
            <div className="pt-2">
              <Button
                onClick={handleSeedDatabase}
                disabled={seeding}
                size="lg"
                className="w-full md:w-auto"
              >
                {seeding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Seeding Database...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Seed Test Data
                  </>
                )}
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                What this does:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Creates 5 sample missionary companionships</li>
                <li>• Generates dinner slots for the next 4 weeks</li>
                <li>
                  • Sets up realistic preferences and dietary restrictions
                </li>
                <li>• Makes all slots available for signup testing</li>
              </ul>
            </div>

            {/* Next Steps */}
            {seedResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Next steps:</h4>
                <ol className="text-sm text-gray-700 space-y-1">
                  <li>
                    1. Go to the{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => router.push("/calendar")}
                    >
                      Calendar Page
                    </Button>
                  </li>
                  <li>2. Test signing up for dinner slots</li>
                  <li>3. Verify the signup and cancellation flows</li>
                  <li>4. Check that slots become unavailable when assigned</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
