"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/services/auth";
import {
  Bell,
  Users,
  BookOpen,
  Calendar,
  Award,
  ClipboardCheck,
} from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const { user } = useAuth();
  const router = useRouter();

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
        <main className="flex-1 p-6">
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
