"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, ChefHat, Clock, Heart, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground">
              <ChefHat className="h-8 w-8" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            Missionary Dinner
            <span className="block text-primary">Coordinator</span>
          </h1>

          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Supporting our missionaries with organized meal coordination.
            Connect hearts through shared meals and strengthen our community
            bonds.
          </p>

          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push("/calendar")}>
                <Calendar className="mr-2 h-5 w-5" />
                View Calendar
              </Button>
              {userData?.role === "admin" && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/admin")}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Admin Panel
                </Button>
              )}
            </div>
          ) : (
            <Button size="lg" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              Simple, organized meal coordination for missionary support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle>View Available Slots</CardTitle>
                <CardDescription>
                  Browse dinner opportunities organized by companionship and
                  date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  See when missionaries need meals and choose dates that work
                  for your schedule.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600">
                    <Heart className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle>Sign Up to Serve</CardTitle>
                <CardDescription>
                  Commit to providing meals with just a few clicks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Simple signup process that tracks your commitments and sends
                  helpful reminders.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle>Stay Organized</CardTitle>
                <CardDescription>
                  Track your commitments and get timely reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Never miss a meal commitment with our organized tracking
                  system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {user && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Making a Difference
              </h2>
              <p className="text-lg text-slate-600">
                Together, we&apos;re supporting our missionaries with love and
                meals
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">❤️</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  Community
                </div>
                <div className="text-slate-600">Driven by service</div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">🍽️</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  Meals
                </div>
                <div className="text-slate-600">Shared with love</div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">🤝</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  Support
                </div>
                <div className="text-slate-600">For our missionaries</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join our community of service and help support missionaries
              through shared meals.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login">Sign In to Get Started</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
