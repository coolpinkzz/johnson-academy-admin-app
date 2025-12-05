"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import {
  getSyllabus,
  createSyllabus,
  deleteSyllabus,
} from "@/services/syllabus";
import { CourseResponse, Syllabus } from "@/types/course";
import { SyllabusResponse } from "@/types/syllabus";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Plus,
  Search,
  Filter,
  BookOpen,
  Clock,
  Users,
  Music,
  GraduationCap,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { useModal, SyllabusForm, DeleteConfirmation } from "@/components/modal";

const SyllabusPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { openModal, closeModal } = useModal();
  const queryClient = useQueryClient();
  const handleSyllabusSubmit = async (data: any) => {
    try {
      await createSyllabus(data);
      closeModal("");
      queryClient.invalidateQueries({ queryKey: ["syllabus"] });
    } catch (error) {
      console.error("Error creating syllabus:", error);
    }
  };

  const handleDeleteSyllabus = (syllabusId: string, syllabusTitle: string) => {
    openModal({
      title: "Confirm Deletion",
      content: (
        <DeleteConfirmation
          itemName={syllabusTitle}
          onConfirm={async () => {
            try {
              await deleteSyllabus(syllabusId);
              closeModal("");
              queryClient.invalidateQueries({ queryKey: ["syllabus"] });
            } catch (error) {
              console.error("Error deleting syllabus:", error);
            }
          }}
          onCancel={() => closeModal("")}
        />
      ),
      size: "md",
      showCloseButton: false,
      closeOnOverlayClick: true,
      closeOnEscape: false,
    });
  };
  // get all syllabus
  const {
    data: syllabusData,
    isLoading,
    error,
  } = useQuery<SyllabusResponse[]>({
    queryKey: ["syllabus"],
    queryFn: () => getSyllabus(),
  });

  console.log(syllabusData);

  // Filter syllabus based on search term
  const filteredSyllabus = useMemo(() => {
    if (!searchTerm) return syllabusData;

    return syllabusData?.filter(
      (syllabus) =>
        syllabus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        syllabus.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        syllabus.courseId.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        syllabus.courseId.instrument
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [syllabusData, searchTerm]);

  // Calculate total lessons for a syllabus
  const getTotalLessons = (syllabus: SyllabusResponse) => {
    return (
      syllabus?.learning?.length +
      syllabus?.theory?.length +
      syllabus?.technical?.length +
      syllabus?.others?.length
    );
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading syllabus...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">Error loading syllabus data</div>
          </div>
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
              Syllabus
            </h1>
            <p className="text-sm text-gray-600">
              Manage course curriculum and learning modules
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
              onClick={() =>
                openModal({
                  title: "Create New Syllabus",
                  size: "xl",
                  content: (
                    <SyllabusForm
                      onSubmit={handleSyllabusSubmit}
                      onCancel={() => closeModal("")}
                    />
                  ),
                  showCloseButton: false,
                  closeOnOverlayClick: false,
                  closeOnEscape: false,
                })
              }
            >
              <Plus className="h-4 w-4" />
              <span>Create Syllabus</span>
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
                  placeholder="Search syllabus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Syllabus Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredSyllabus?.map((syllabus, index) => (
              <div
                key={`${syllabus.courseId}-${index}`}
                className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col"
              >
                <div className="p-4 sm:p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <img
                      src={syllabus?.courseId?.image}
                      alt={syllabus?.courseId?.name}
                      className="w-10 h-10 rounded-full object-contain object-center border border-gray-200 p-1"
                    />
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {syllabus?.courseId?.instrument}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    {syllabus?.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3">
                    {/* truncate description to 100 characters */}
                    {syllabus?.description?.length > 100
                      ? syllabus?.description?.slice(0, 100) + "..."
                      : syllabus?.description}
                  </p>

                  <p className="text-xs text-gray-500 mb-4">
                    Course: {syllabus?.courseId?.name}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span>
                        Learning: {syllabus?.learning?.length || 0} modules
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4 text-green-500" />
                      <span>
                        Theory: {syllabus?.theory?.length || 0} modules
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Music className="h-4 w-4 text-purple-500" />
                      <span>
                        Technical: {syllabus?.technical?.length || 0} modules
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4 text-green-500" />
                      <span>
                        Others: {syllabus?.others?.length || 0} modules
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getTotalLessons(syllabus) || 0} total lessons
                    </div>
                  </div>
                </div>

                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t flex flex-wrap gap-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit
                  </button>
                  <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                    View Details
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    onClick={() =>
                      handleDeleteSyllabus(
                        syllabus?._id || syllabus?.id,
                        syllabus?.title
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredSyllabus?.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No syllabus found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? `No syllabus matching "${searchTerm}"`
                  : "Get started by creating your first syllabus."}
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default SyllabusPage;
