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
import { updateUserRole } from "@/lib/firebase/auth";
import { EmulatorUtils } from "@/lib/firebase/emulatorUtils";
import { seedDatabase } from "@/lib/firebase/seedData";
import {
  AlertTriangle,
  Bug,
  Database,
  Trash2,
  UserCog,
  Users,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [makingAdmin, setMakingAdmin] = useState(false);
  const [debugResult, setDebugResult] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
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

  const handleCheckDatabase = async () => {
    setError(null);
    setDebugResult(null);

    try {
      console.log("🔍 Starting database inspection...");
      await EmulatorUtils.inspectDatabase();
      await EmulatorUtils.checkSignupData();
      setDebugResult(
        "Database inspection complete. Check the console for detailed results.",
      );
    } catch (err) {
      console.error("Database check error:", err);
      setError(err instanceof Error ? err.message : "Failed to check database");
    }
  };

  const handleCleanupSignups = async () => {
    setError(null);
    setDebugResult(null);

    try {
      await EmulatorUtils.cleanupProblematicSignups();
      setDebugResult(
        "Cleanup complete. Problematic signups have been removed.",
      );
    } catch (err) {
      console.error("Cleanup error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to cleanup signups",
      );
    }
  };

  const handleClearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear ALL emulator data? This cannot be undone.",
      )
    ) {
      return;
    }

    setClearing(true);
    setError(null);
    setDebugResult(null);

    try {
      await EmulatorUtils.clearAllData();
      setDebugResult("All emulator data cleared successfully.");
    } catch (err) {
      console.error("Clear data error:", err);
      setError(err instanceof Error ? err.message : "Failed to clear data");
    } finally {
      setClearing(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!user) return;

    setMakingAdmin(true);
    setError(null);

    try {
      await updateUserRole(user.uid, "admin");
      setSeedResult(
        "You are now an admin! Please refresh the page to see updated permissions.",
      );
    } catch (err) {
      console.error("Error making user admin:", err);
      setError("Failed to update user role. Make sure you're authenticated.");
    } finally {
      setMakingAdmin(false);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>

        {/* User Setup Section */}
        {!isAdmin ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Setup Admin Access
              </CardTitle>
              <CardDescription>
                Grant yourself admin permissions to access seeding and
                management features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <UserCog className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800">
                      Development Setup Required
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      To test the admin features, you need admin permissions.
                      Click the button below to grant yourself admin access in
                      the development environment.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleMakeAdmin}
                disabled={makingAdmin}
                size="lg"
                className="w-full md:w-auto"
              >
                {makingAdmin ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting Up Admin Access...
                  </>
                ) : (
                  <>
                    <UserCog className="h-4 w-4 mr-2" />
                    Make Me Admin
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

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

        {/* Emulator Debug Tools */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Emulator Debug Tools
            </CardTitle>
            <CardDescription>
              Debug and troubleshoot emulator database issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Debug Results */}
            {debugResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bug className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800">Debug Results</h4>
                    <p className="text-sm text-blue-700 mt-1">{debugResult}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={handleCheckDatabase} variant="outline" size="sm">
                <Bug className="h-4 w-4 mr-2" />
                Inspect Database
              </Button>

              <Button
                onClick={handleCleanupSignups}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Signups
              </Button>

              <Button
                onClick={handleClearAllData}
                disabled={clearing}
                variant="destructive"
                size="sm"
              >
                {clearing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </>
                )}
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Debug Tools:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>
                  • <strong>Inspect Database:</strong> Check collection counts
                  and data integrity
                </li>
                <li>
                  • <strong>Clean Signups:</strong> Remove problematic signup
                  documents (missing userId, etc.)
                </li>
                <li>
                  • <strong>Clear All Data:</strong> Completely reset the
                  emulator database
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
