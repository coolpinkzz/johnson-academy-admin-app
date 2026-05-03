"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { DeleteConfirmation } from "@/components/modal/ConfirmationDialog";
import { EditTeacherForm } from "@/components/modal/EditTeacherForm";
import { StudentForm } from "@/components/modal/StudentForm";
import { useModal } from "@/hooks/use-modal";
import { deleteTeacher, getTeachers } from "@/services/teacher";
import { Bell, Plus, Search, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { User, UserResponse } from "@/types/user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const TeacherPage = () => {
  const { openModal, closeModal } = useModal();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const {
    data: teachers,
    isLoading,
    error,
  } = useQuery<UserResponse>({
    queryKey: ["teachers"],
    queryFn: () => getTeachers(),
  });

  const sortedTeachers = useMemo(() => {
    const list = teachers?.results ?? [];
    return [...list].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      }),
    );
  }, [teachers?.results]);

  const handleAddTeacher = () => {
    openModal({
      title: "Add Teacher",
      content: <StudentForm submitLabel="Add Teacher" type="teacher" />,
    });
  };

  const handleEditTeacher = (teacher: User) => {
    openModal({
      title: "Edit Teacher",
      content: (
        <EditTeacherForm teacher={teacher} submitLabel="Update Teacher" />
      ),
      size: "lg",
    });
  };

  const teacherHasClasses = (teacher: User) =>
    Array.isArray(teacher.classes) && teacher.classes.length > 0;

  const teacherUserId = (teacher: User) => teacher.id || teacher._id;

  const performDeleteTeacher = async (teacher: User) => {
    const userId = teacherUserId(teacher);
    try {
      setDeletingId(userId);
      await deleteTeacher(userId);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher deleted successfully");
    } catch {
      toast.error("Failed to delete teacher. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTeacher = (teacher: User) => {
    if (teacherHasClasses(teacher)) return;

    openModal({
      title: "Confirm Deletion",
      content: (
        <DeleteConfirmation
          title="Delete Teacher"
          message={`Are you sure you want to delete "${teacher.name}"? This action cannot be undone.`}
          itemName={teacher.name}
          onConfirm={() => performDeleteTeacher(teacher)}
          onCancel={() => closeModal()}
        />
      ),
      size: "sm",
      closeOnOverlayClick: false,
      closeOnEscape: false,
      showCloseButton: false,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-2 border-b px-4 bg-white">
          <div className="flex items-center justify-between flex-1 px-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Teachers</h1>
              <p className="text-sm text-gray-600">
                Manage teacher information and enrollment
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleAddTeacher}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Teacher
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
                  placeholder="Search teachers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTeachers.map((teacher) => (
                    <tr key={teacher?._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {teacher.profilePicture ? (
                            <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
                              <Image
                                src={teacher.profilePicture}
                                alt={teacher.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                              {teacher.name.charAt(0)}
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.classes.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            teacher.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {teacher.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.courses.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditTeacher(teacher)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(teacher)}
                            disabled={
                              teacherHasClasses(teacher) ||
                              deletingId === teacherUserId(teacher)
                            }
                            title={
                              teacherHasClasses(teacher)
                                ? "Assign this teacher to zero classes before they can be removed."
                                : undefined
                            }
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            {deletingId === teacherUserId(teacher) ? (
                              <>
                                <span className="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                Deleting…
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
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};
export default TeacherPage;
