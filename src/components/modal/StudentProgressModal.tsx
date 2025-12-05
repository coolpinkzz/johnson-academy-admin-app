"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudentProgress } from "@/services/student";
import { StudentProgressResponse } from "@/types/progress";
import {
  BookOpen,
  Clock,
  CheckCircle,
  Circle,
  PlayCircle,
  Calendar,
  Star,
  Download,
  X,
} from "lucide-react";

interface StudentProgressModalProps {
  studentId: string;
  classId: string;
  className: string;
}

const StudentProgressModal: React.FC<StudentProgressModalProps> = ({
  studentId,
  classId,
  className,
}) => {
  const {
    data: progressData,
    isLoading,
    error,
  } = useQuery<StudentProgressResponse>({
    queryKey: ["student-progress", studentId, classId],
    queryFn: () => getStudentProgress(studentId, classId),
    enabled: !!studentId && !!classId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "inprogress":
        return <PlayCircle className="h-4 w-4 text-yellow-600" />;
      case "upcoming":
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "inprogress":
        return "bg-yellow-100 text-yellow-800";
      case "upcoming":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getModuleTypeColor = (type: string) => {
    switch (type) {
      case "theory":
        return "bg-blue-100 text-blue-800";
      case "technical":
        return "bg-purple-100 text-purple-800";
      case "learning":
        return "bg-emerald-100 text-emerald-800";
      case "others":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load progress
          </h3>
          <p className="text-gray-500">
            There was an error loading the student's progress details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Student and Course Info */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          {progressData.studentId.name} • {progressData.courseId.name}
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {progressData.progress}%
            </div>
            <p className="text-sm text-gray-600">Overall Progress</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {progressData.completedModules}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {progressData.inProgressModules}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {progressData.upcomingModules}
            </div>
            <p className="text-sm text-gray-600">Upcoming</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressData.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Course Information */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Course Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Course Name</p>
            <p className="text-gray-600">{progressData.courseId.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Total Modules</p>
            <p className="text-gray-600">{progressData.totalModules}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900">Description</p>
          <p className="text-gray-600">{progressData.courseId.description}</p>
        </div>
      </div>

      {/* Syllabus Progress */}
      <div className="space-y-6">
        {progressData.syllabusProgress.map((syllabus, syllabusIndex) => (
          <div key={syllabusIndex} className="bg-white border rounded-lg">
            {/* Syllabus Header */}
            <div className="p-6 border-b">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {syllabus.syllabusId.title}
              </h4>
              <p className="text-gray-600 text-sm">
                {syllabus.syllabusId.description}
              </p>
            </div>

            {/* Modules */}
            <div className="p-6">
              <div className="space-y-3">
                {syllabus.modules.map((module, moduleIndex) => (
                  <div
                    key={moduleIndex}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    {module.moduleId ? (
                      <div>
                        {/* Module Header */}
                        <div className="flex items-start gap-3 mb-3">
                          {getStatusIcon(module.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-gray-900">
                                {module.moduleId.title}
                              </h5>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getModuleTypeColor(
                                  module.moduleId.type
                                )}`}
                              >
                                {module.moduleId.type}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  module.status
                                )}`}
                              >
                                {module.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {module.moduleId.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {module.moduleId.session} session
                                {module.moduleId.session > 1 ? "s" : ""}
                              </div>
                              {module.moduleId.resources.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {module.moduleId.resources.length} resource
                                  {module.moduleId.resources.length > 1
                                    ? "s"
                                    : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Module Progress Details */}
                        {module.status !== "upcoming" && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {module.startDate && (
                                <div>
                                  <p className="text-xs font-medium text-gray-900 mb-1">
                                    Start Date
                                  </p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(module.startDate)}
                                  </p>
                                </div>
                              )}
                              {module.endDate && (
                                <div>
                                  <p className="text-xs font-medium text-gray-900 mb-1">
                                    End Date
                                  </p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(module.endDate)}
                                  </p>
                                </div>
                              )}
                              {module.dateTakenToComplete && (
                                <div>
                                  <p className="text-xs font-medium text-gray-900 mb-1">
                                    Days to Complete
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {module.dateTakenToComplete} day
                                    {module.dateTakenToComplete > 1 ? "s" : ""}
                                  </p>
                                </div>
                              )}
                            </div>

                            {module.score && (
                              <div className="mt-3 flex items-center gap-2">
                                <p className="text-xs font-medium text-gray-900">
                                  Score:
                                </p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < module.score!
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                  <span className="text-sm text-gray-600 ml-1">
                                    {module.score}/5
                                  </span>
                                </div>
                              </div>
                            )}

                            {module.remark && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-900 mb-1">
                                  Remark
                                </p>
                                <p className="text-sm text-gray-600 italic">
                                  "{module.remark}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Resources */}
                        {module.moduleId.resources.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-medium text-gray-900 mb-2">
                              Resources
                            </p>
                            <div className="space-y-2">
                              {module.moduleId.resources.map(
                                (resource, resourceIndex) => (
                                  <a
                                    key={resourceIndex}
                                    href={resource.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <Download className="h-3 w-3" />
                                    {resource.key}
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Circle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Module not assigned</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentProgressModal;
