"use client";

import { ClassForm, BulkAddStudentsModal, useModal } from "@/components/modal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { deleteClass, getClasses } from "@/services/class";
import { getCourses } from "@/services/course";
import { getTeachers } from "@/services/teacher";
import { getStudents } from "@/services/student";
import { ClassResponse } from "@/types/class";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Users,
  BookOpen,
  User,
  Calendar,
} from "lucide-react";
import React from "react";

const ClassesPage = () => {
  const { openModal } = useModal();
  const queryClient = useQueryClient();

  // Get all classes
  const {
    data: classesData,
    isLoading,
    error,
  } = useQuery<ClassResponse>({
    queryKey: ["classes"],
    queryFn: () => getClasses(),
  });

  // Get additional data for display
  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses(),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => getTeachers(),
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  });

  const handleClassForm = () => {
    openModal({
      title: "Create Class",
      content: <ClassForm />,
    });
  };

  const handleBulkAddStudents = (classItem: any) => {
    console.log(classItem);
    openModal({
      title: "Add Students to Class",
      content: (
        <BulkAddStudentsModal
          classId={classItem.id || ""}
          className={classItem.name}
          existingStudentIds={classItem.students || []}
        />
      ),
    });
  };

  const handleDeleteClass = (classId: string) => {
    deleteClass(classId);
    queryClient.invalidateQueries({ queryKey: ["classes"] });
  };

  // Helper functions to get related data
  const getCourseName = (courseId: any) => {
    const course = coursesData?.results?.find((c) => c._id === courseId.id);
    return course?.name || "Unknown Course";
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachersData?.results?.find((t) => t.id === teacherId);
    return teacher?.name || "Unknown Teacher";
  };

  const getStudentCount = (studentIds: string[]) => {
    return studentIds.length;
  };

  const getStudentNames = (studentIds: string[]) => {
    const names = studentIds
      .map((id) => {
        const student = studentsData?.results?.find((s) => s.id === id);
        return student?.name;
      })
      .filter(Boolean);
    return names.slice(0, 3).join(", ") + (names.length > 3 ? "..." : "");
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">Loading classes...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-red-600">Error loading classes</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-auto sm:h-16 px-4 sm:px-6 py-4 border-b bg-white">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Classes
            </h1>
            <p className="text-sm text-gray-600">
              Manage class assignments and student enrollments
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
              onClick={handleClassForm}
            >
              <Plus className="h-4 w-4" />
              <span>Create Class</span>
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
                  placeholder="Search classes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {classesData?.results?.map((classItem) => (
              <div
                key={classItem.id || classItem.name}
                className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col"
              >
                <div className="p-4 sm:p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <img
                        src={
                          typeof classItem.courseId === "string"
                            ? ""
                            : classItem.courseId?.image
                        }
                        alt={
                          typeof classItem.courseId === "string"
                            ? ""
                            : classItem.courseId?.name || ""
                        }
                        className="h-10 w-10 text-blue-600 object-contain p-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {typeof classItem.courseId === "string"
                        ? ""
                        : classItem.courseId?.instrument || ""}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    {classItem?.name}
                  </h3>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4 text-blue-500" />
                      <span>
                        Teacher: {getTeacherName(classItem?.teacherId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 text-green-500" />
                      <span>
                        Course: {getCourseName(classItem?.courseId as string)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span>
                        Students: {getStudentCount(classItem?.students)}
                      </span>
                    </div>
                  </div>

                  {classItem.students.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Enrolled Students:
                      </p>
                      <p className="text-sm text-gray-700">
                        {getStudentNames(classItem.students)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getStudentCount(classItem.students)} enrolled
                    </div>
                  </div>
                </div>

                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t flex flex-wrap gap-4">
                  <button
                    onClick={() => handleBulkAddStudents(classItem)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Add Students
                  </button>
                  {/* <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                    Edit
                  </button> */}
                  <button
                    onClick={() => handleDeleteClass(classItem.id || "")}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(!classesData?.results || classesData.results.length === 0) && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No classes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first class.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleClassForm}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Create Class
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ClassesPage;
