"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/services/auth";
import {
  Bell,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Award,
} from "lucide-react";
import React from "react";
import { useModal } from "@/components/modal";
import { StudentForm } from "@/components/modal/StudentForm";

const DashboardPage = () => {
  const { user } = useAuth();
  const { openModal } = useModal();

  const stats = [
    {
      title: "Total Students",
      value: "1,234",
      change: "+12%",
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Courses",
      value: "24",
      change: "+3",
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Classes Today",
      value: "8",
      change: "2 remaining",
      icon: <Calendar className="h-5 w-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Average Grade",
      value: "87%",
      change: "+2.1%",
      icon: <Award className="h-5 w-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const recentActivities = [
    { id: 1, text: "New student registration: John Doe", time: "2 min ago" },
    {
      id: 2,
      text: "Assignment submitted: Math 101 - Chapter 3",
      time: "15 min ago",
    },
    {
      id: 3,
      text: "Grade updated: Science Class - Midterm",
      time: "1 hour ago",
    },
    { id: 4, text: "New course added: Advanced Physics", time: "2 hours ago" },
    {
      id: 5,
      text: "Attendance marked: English Literature",
      time: "3 hours ago",
    },
  ];

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
          {/* Stats */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white border rounded-lg shadow-sm p-6 flex justify-between items-center hover:shadow-md transition"
              >
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Recent Activities</h3>
              </div>
              <div className="p-4 space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-800">{activity.text}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
                    onClick: () =>
                      openModal({
                        title: "Add New Student",
                        size: "lg",
                        content: <StudentForm type="student" />,
                      }),
                  },
                  {
                    icon: (
                      <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    ),
                    text: "Create Course",
                    onClick: () =>
                      openModal({
                        title: "Create New Course",
                        size: "md",
                        content: (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course Name
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter course name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Enter course description"
                              ></textarea>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                Cancel
                              </button>
                              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                Create Course
                              </button>
                            </div>
                          </div>
                        ),
                      }),
                  },
                  {
                    icon: (
                      <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    ),
                    text: "Schedule Class",
                    onClick: () =>
                      openModal({
                        title: "Schedule New Class",
                        size: "lg",
                        content: (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes)
                              </label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="60"
                                min="15"
                                step="15"
                              />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                Cancel
                              </button>
                              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                Schedule Class
                              </button>
                            </div>
                          </div>
                        ),
                      }),
                  },
                  {
                    icon: (
                      <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    ),
                    text: "View Reports",
                    onClick: () =>
                      openModal({
                        title: "Generate Report",
                        size: "xl",
                        content: (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Report Type
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <option value="">Select report type</option>
                                  <option value="student-performance">
                                    Student Performance
                                  </option>
                                  <option value="attendance">
                                    Attendance Report
                                  </option>
                                  <option value="course-completion">
                                    Course Completion
                                  </option>
                                  <option value="financial">
                                    Financial Report
                                  </option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date Range
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <option value="last-week">Last Week</option>
                                  <option value="last-month">Last Month</option>
                                  <option value="last-quarter">
                                    Last Quarter
                                  </option>
                                  <option value="last-year">Last Year</option>
                                  <option value="custom">Custom Range</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Format
                              </label>
                              <div className="flex space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="format"
                                    value="pdf"
                                    className="mr-2"
                                    defaultChecked
                                  />
                                  <span className="text-sm">PDF</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="format"
                                    value="excel"
                                    className="mr-2"
                                  />
                                  <span className="text-sm">Excel</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="format"
                                    value="csv"
                                    className="mr-2"
                                  />
                                  <span className="text-sm">CSV</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                Cancel
                              </button>
                              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                Generate Report
                              </button>
                            </div>
                          </div>
                        ),
                      }),
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
