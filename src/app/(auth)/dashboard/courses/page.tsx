"use client";

import { CourseForm, useModal } from "@/components/modal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/services/auth";
import { deleteCourse, getCourses } from "@/services/course";
import { CourseResponse } from "@/types/course";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  Music,
} from "lucide-react";
import React from "react";

const CoursesPage = () => {
  const { user } = useAuth();
  const { openModal, closeModal } = useModal();
  const queryClient = useQueryClient();
  // get all courses
  const {
    data: coursesData,
    isLoading,
    error,
  } = useQuery<CourseResponse>({
    queryKey: ["courses"],
    queryFn: () => getCourses(),
  });

  const handleCourseForm = () => {
    openModal({
      title: "Create Course",
      content: <CourseForm />,
    });
  };

  const handleDeleteCourse = (courseId: string) => {
    deleteCourse(courseId);
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-auto sm:h-16 px-4 sm:px-6 py-4 border-b bg-white">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Courses
            </h1>
            <p className="text-sm text-gray-600">
              Manage course offerings and curriculum
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
              onClick={handleCourseForm}
            >
              <Plus className="h-4 w-4" />
              <span>Create Course</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto sm:py-6 sm:px-6 px-0 py-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {coursesData?.results.map((course) => (
              <div
                key={course.id || course.name}
                className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col"
              >
                <div className="p-4 sm:p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    {/* add image */}
                    <img
                      src={course.image}
                      alt={course.name}
                      className="w-20 h-20 rounded-full object-contain object-center border border-gray-200 p-1"
                    />

                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {course.instrument}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {course.description}
                  </p>
                  {/* <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span>
                        Learning:{" "}
                        {course.syllabus && course.syllabus.length > 0
                          ? course.syllabus[0]?.learning?.length || 0
                          : 0}{" "}
                        modules
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4 text-green-500" />
                      <span>
                        Theory:{" "}
                        {course.syllabus && course.syllabus.length > 0
                          ? course.syllabus[0]?.theory?.length || 0
                          : 0}{" "}
                        modules
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Music className="h-4 w-4 text-purple-500" />
                      <span>
                        Technical:{" "}
                        {course.syllabus && course.syllabus.length > 0
                          ? course.syllabus[0]?.technical?.length || 0
                          : 0}{" "}
                        modules
                      </span>
                    </div>
                  </div> */}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {/* // course.syllabus can be =[] */}
                      {course.syllabus && course.syllabus.length > 0
                        ? (course.syllabus[0]?.learning?.length || 0) +
                          (course.syllabus[0]?.theory?.length || 0) +
                          (course.syllabus[0]?.technical?.length || 0) +
                          (course.syllabus[0]?.others?.length || 0)
                        : 0}{" "}
                      {course.syllabus && course.syllabus.length > 0
                        ? "lessons"
                        : "No lessons"}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.studentCount} students
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t flex flex-wrap gap-4">
                  {/* <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit
                  </button> */}
                  <button
                    onClick={() => handleDeleteCourse(course._id || "")}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CoursesPage;
