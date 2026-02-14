"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { DeleteConfirmation } from "@/components/modal/ConfirmationDialog";
import { useModalContext } from "@/contexts/ModalContext";
import { UserResponse } from "@/types/user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Search, Trash2, Eye } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import {
  deleteStudent,
  searchStudents,
  useStudentsInfiniteQuery,
} from "@/services/student";
import { StudentForm } from "@/components/modal";
import Image from "next/image";
import avatarImage from "@/assets/avatar.png";
import { PAGE_SIZE } from "@/constant";
import { toast } from "react-toastify";

const StudentsPage = () => {
  const { openModal, closeModal } = useModalContext();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Paginated list (when not searching)
  const {
    data: infiniteData,
    isLoading: isLoadingList,
    error: listError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudentsInfiniteQuery({
    enabled: !searchQuery.trim(),
    pageSize: PAGE_SIZE,
  });

  // Search (when search query is set)
  const {
    data: searchData,
    isLoading: isSearching,
    error: searchError,
  } = useQuery<UserResponse>({
    queryKey: ["students", "search", searchQuery],
    queryFn: () => searchStudents(searchQuery.trim()),
    enabled: searchQuery.trim().length > 0,
  });

  const isSearchMode = searchQuery.trim().length > 0;
  const students: UserResponse | undefined = isSearchMode
    ? searchData
    : infiniteData
      ? {
          results: infiniteData.pages.flatMap((p) => p.results),
          page: infiniteData.pages[infiniteData.pages.length - 1]?.page ?? 1,
          limit: PAGE_SIZE,
          totalPages: infiniteData.pages[0]?.totalPages ?? 0,
          totalResults: infiniteData.pages[0]?.totalResults ?? 0,
        }
      : undefined;
  const isLoading = isSearchMode ? isSearching : isLoadingList;
  const error = isSearchMode ? searchError : listError;

  // Infinite scroll: fetch next page when sentinel is in view
  useEffect(() => {
    if (isSearchMode || !hasNextPage || isFetchingNextPage) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "100px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isSearchMode, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Delete user function
  const deleteUser = async (userId: string) => {
    try {
      setIsDeleting(userId);
      await deleteStudent(userId);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete student. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle delete button click
  const handleDeleteClick = (student: User) => {
    console.log({ student });
    openModal({
      title: "Confirm Deletion",
      content: (
        <DeleteConfirmation
          title="Delete Student"
          message={`Are you sure you want to delete "${student.name}"? This action cannot be undone.`}
          itemName={student.name}
          onConfirm={() => deleteUser(student.id)}
          onCancel={() => closeModal()}
        />
      ),
      size: "sm",
      closeOnOverlayClick: false,
      closeOnEscape: false,
      showCloseButton: false,
    });
  };

  // Handle edit button click
  const handleEditClick = (student: User) => {
    // TODO: Implement edit functionality
    console.log("Edit student:", student);
  };

  // Handle view button click
  const handleViewClick = (student: User) => {
    router.push(`/dashboard/students/${student.id}`);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search clear
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-2 border-b px-4 bg-white">
          <div className="flex items-center justify-between flex-1 px-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Students</h1>
              <p className="text-sm text-gray-600">
                Manage student information and enrollment
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  openModal({
                    title: "Add Student",
                    content: <StudentForm type="student" />,
                  })
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {searchQuery && (
              <div className="mt-3 text-sm text-gray-600">
                Searching for roll number:{" "}
                <span className="font-semibold">{searchQuery}</span>
              </div>
            )}
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
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
                  <p className="text-gray-900 font-medium mb-2">
                    Failed to load students
                  </p>
                  <p className="text-gray-500 mb-4">
                    Please try refreshing the page
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              ) : !students?.results || students.results.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">
                    {searchQuery ? "No students found" : "No students found"}
                  </p>
                  <p className="text-gray-500 mb-3">
                    {searchQuery
                      ? `No student found with roll number "${searchQuery}"`
                      : "Get started by adding your first student"}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Classes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.results.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Image
                              src={student.profilePicture || avatarImage}
                              alt={student.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div className="ml-4"> {student.name} </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.rollNumber || "Not assigned"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Array.isArray(student.classes)
                            ? student.classes.length > 0
                              ? `${student.classes.length} class${
                                  student.classes.length !== 1 ? "es" : ""
                                }`
                              : "No classes"
                            : student.classes || "No classes"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewClick(student)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                            {/* <button
                              onClick={() => handleEditClick(student)}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isDeleting === student.id}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button> */}
                            <button
                              onClick={() => handleDeleteClick(student)}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isDeleting === student.id}
                            >
                              {isDeleting === student.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Sentinel for infinite scroll (only when not searching and there are results) */}
              {!isSearchMode &&
                students?.results &&
                students.results.length > 0 && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    {isFetchingNextPage && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-sm">
                          Loading more students...
                        </span>
                      </div>
                    )}
                    {!hasNextPage && students.results.length > 0 && (
                      <p className="text-sm text-gray-500">
                        All {students.totalResults} students loaded
                      </p>
                    )}
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StudentsPage;
