"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/services/auth";
import { getDashboardAggregates } from "@/services/dashboard";
import {
  Bell,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  School,
  Loader2,
  RefreshCw,
} from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

const DashboardPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const {
    data: aggregates,
    isLoading: aggregatesLoading,
    isError: aggregatesError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["dashboard", "aggregates"],
    queryFn: getDashboardAggregates,
  });

  const statCards = [
    {
      label: "Students",
      value: aggregates?.totalStudents,
      icon: GraduationCap,
      href: "/dashboard/students",
      iconBg: "bg-violet-200/70 text-violet-800",
      cardSurface:
        "bg-violet-50 border-violet-100 hover:border-violet-200 hover:bg-violet-100/80",
      skeleton: "bg-violet-200/50",
      linkAccent: "text-violet-700",
    },
    {
      label: "Teachers",
      value: aggregates?.totalTeachers,
      icon: Users,
      href: "/dashboard/teachers",
      iconBg: "bg-sky-200/70 text-sky-800",
      cardSurface:
        "bg-sky-50 border-sky-100 hover:border-sky-200 hover:bg-sky-100/80",
      skeleton: "bg-sky-200/50",
      linkAccent: "text-sky-700",
    },
    {
      label: "Classes",
      value: aggregates?.totalClasses,
      icon: School,
      href: "/dashboard/classes",
      iconBg: "bg-emerald-200/70 text-emerald-800",
      cardSurface:
        "bg-emerald-50 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-100/80",
      skeleton: "bg-emerald-200/50",
      linkAccent: "text-emerald-700",
    },
    {
      label: "Courses",
      value: aggregates?.totalCourses,
      icon: BookOpen,
      href: "/dashboard/courses",
      iconBg: "bg-amber-200/70 text-amber-900",
      cardSurface:
        "bg-amber-50 border-amber-100 hover:border-amber-200 hover:bg-amber-100/80",
      skeleton: "bg-amber-200/50",
      linkAccent: "text-amber-800",
    },
  ] as const;

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 h-16 bg-white border-b shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome back, {user?.name || "Admin"}! Here&apos;s what&apos;s
              happening today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || "A"}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Overview stats */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Overview
                </h2>
                <p className="text-sm text-gray-500">
                  Live counts from your academy directory
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </button>
            </div>

            {aggregatesError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Couldn&apos;t load overview stats. Check that the aggregates
                API is available and you&apos;re signed in.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map(
                  ({
                    label,
                    value,
                    icon: Icon,
                    href,
                    iconBg,
                    cardSurface,
                    skeleton,
                    linkAccent,
                  }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => router.push(href)}
                      className={`group rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${cardSurface}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            {label}
                          </p>
                          {aggregatesLoading ? (
                            <div
                              className={`mt-2 h-9 w-20 animate-pulse rounded-md ${skeleton}`}
                            />
                          ) : (
                            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
                              {(value ?? 0).toLocaleString()}
                            </p>
                          )}
                          <p
                            className={`mt-2 text-xs font-medium opacity-0 transition group-hover:opacity-100 ${linkAccent}`}
                          >
                            Open {label.toLowerCase()} →
                          </p>
                        </div>
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </div>
            )}
          </section>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                {[
                  {
                    icon: (
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    ),
                    text: "Add Student",
                    onClick: () => router.push("/dashboard/students"),
                  },
                  {
                    icon: (
                      <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    ),
                    text: "Create Course",
                    onClick: () => router.push("/dashboard/courses"),
                  },
                  {
                    icon: (
                      <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    ),
                    text: "View Classes",
                    onClick: () => router.push("/dashboard/classes"),
                  },
                  {
                    icon: (
                      <ClipboardCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    ),
                    text: "Attendance",
                    onClick: () => router.push("/dashboard/attendance"),
                  },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition text-center"
                  >
                    {action.icon}
                    <p className="text-sm font-medium text-gray-800">
                      {action.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
