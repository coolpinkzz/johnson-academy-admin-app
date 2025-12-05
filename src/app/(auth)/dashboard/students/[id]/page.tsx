"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import StudentDetailLoading from "@/components/StudentDetailLoading";
import { useAuth } from "@/services/auth";
import { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  Users,
  Award,
  UserCheck,
  UserX,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React from "react";
import { getStudentById } from "@/services/student";
import { StudentProgressModal, useModal } from "@/components/modal";

const StudentDetailPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const { openModal } = useModal();

  // Get student details
  const {
    data: student,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["student", studentId],
    queryFn: () => getStudentById(studentId),
    enabled: !!studentId,
  });

  console.log(student);

  function mergeClassesWithProgress(studentData: User) {
    if (!studentData) return [];

    const { classes, progress } = studentData;

    return classes.map((cls) => {
      // find progress entry for this class
      const classProgress = progress.find((p) => p.classId === cls.id);

      return {
        classId: cls.id,
        className: cls.name,
        progress: classProgress ? classProgress.progress : 0,
        totalModules: classProgress ? classProgress.totalModules : 0,
        completedModules: classProgress ? classProgress.completedModules : 0,
        inProgressModules: classProgress ? classProgress.inProgressModules : 0,
        upcomingModules: classProgress ? classProgress.upcomingModules : 0,
        syllabusProgress: classProgress ? classProgress.syllabusProgress : [],
      };
    });
  }

  const handleProgressCardClick = (classId: string, className: string) => {
    openModal({
      title: `Progress Details - ${className}`,
      content: (
        <StudentProgressModal
          studentId={studentId}
          classId={classId}
          className={className}
        />
      ),
      size: "half",
      closeOnOverlayClick: true,
      closeOnEscape: true,
      showCloseButton: true,
    });
  };

  if (isLoading) {
    return <StudentDetailLoading />;
  }

  if (error || !student) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-4 p-6 border-b">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Student Details
            </h1>
          </div>
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Student not found
                </h3>
                <p className="text-gray-500 mb-4">
                  The student you're looking for doesn't exist or has been
                  removed.
                </p>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center gap-4 p-6 border-b bg-white">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Student Details
            </h1>
            <p className="text-sm text-gray-600">
              Complete information about {student.name}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Student Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {student.profilePicture ? (
                      <img
                        src={student.profilePicture}
                        alt={student.name}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium">
                        {student.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {student.name}
                      </h2>
                      <div className="flex items-center gap-1">
                        {student.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <UserX className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                        {student.isEmailVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Mail className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{student.email}</p>
                    {student.rollNumber && (
                      <p className="text-sm text-gray-500">
                        Roll Number: {student.rollNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                  {student.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Phone
                        </p>
                        <p className="text-sm text-gray-600">
                          {student.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Academic Information
                </h3>
                {(() => {
                  const mergedData = mergeClassesWithProgress(student);
                  const totalCompletedModules = mergedData.reduce(
                    (sum, item) => sum + item.completedModules,
                    0
                  );
                  const totalInProgressModules = mergedData.reduce(
                    (sum, item) => sum + item.inProgressModules,
                    0
                  );
                  const totalUpcomingModules = mergedData.reduce(
                    (sum, item) => sum + item.upcomingModules,
                    0
                  );
                  const averageProgress =
                    mergedData.length > 0
                      ? Math.round(
                          mergedData.reduce(
                            (sum, item) => sum + item.progress,
                            0
                          ) / mergedData.length
                        )
                      : 0;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {student.classes.length}
                        </p>
                        <p className="text-sm text-gray-600">Classes</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                          <BookOpen className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {student.courses.length}
                        </p>
                        <p className="text-sm text-gray-600">Courses</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                          <Award className="h-6 w-6 text-emerald-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalCompletedModules}
                        </p>
                        <p className="text-sm text-gray-600">
                          Completed Modules
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                          <UserCheck className="h-6 w-6 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {averageProgress}%
                        </p>
                        <p className="text-sm text-gray-600">
                          Average Progress
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Detailed Progress by Class */}
                {(() => {
                  const mergedData = mergeClassesWithProgress(student);
                  if (mergedData.length === 0) return null;

                  return (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">
                        Progress by Class
                      </h4>
                      <div className="space-y-4">
                        {mergedData.map((classData) => (
                          <div
                            key={classData.classId}
                            className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() =>
                              handleProgressCardClick(
                                classData.classId,
                                classData.className
                              )
                            }
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-gray-900">
                                {classData.className}
                              </h5>
                              <span className="text-sm font-semibold text-blue-600">
                                {classData.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${classData.progress}%` }}
                              ></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-semibold text-emerald-600">
                                  {classData.completedModules}
                                </p>
                                <p className="text-gray-600">Completed</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-yellow-600">
                                  {classData.inProgressModules}
                                </p>
                                <p className="text-gray-600">In Progress</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-gray-600">
                                  {classData.upcomingModules}
                                </p>
                                <p className="text-gray-600">Upcoming</p>
                              </div>
                            </div>
                            <div className="mt-3 text-center">
                              <p className="text-xs text-blue-600 hover:text-blue-800">
                                Click to view detailed progress
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Subjects */}
            {student.subjects && student.subjects.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Subjects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {student.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Role
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {student.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Email Verification
                    </p>
                    <p className="text-sm text-gray-600">
                      {student.isEmailVerified ? "Verified" : "Not Verified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Account Status
                    </p>
                    <p className="text-sm text-gray-600">
                      {student.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Student ID
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      {student.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDetailPage;
