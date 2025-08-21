"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { StudentForm } from "@/components/modal/StudentForm";
import { useModal } from "@/hooks/use-modal";
import { getTeachers } from "@/services/teacher";
import { Bell, Plus, Search, Filter, Menu, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { User, UserResponse } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { DeleteConfirmation } from "@/components/modal/ConfirmationDialog";

const TeacherPage = () => {
  const { openModal, closeModal } = useModal();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const {
    data: teachers,
    isLoading,
    error,
  } = useQuery<UserResponse>({
    queryKey: ["teachers"],
    queryFn: () => getTeachers(),
  });

  // delete teacher
  const deleteTeacher = async (userId: string) => {
    try {
      setIsDeleting(userId);

      await deleteTeacher(userId);
    } catch (error) {
      console.error("Error deleting teacher:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle delete button click
  const handleDeleteClick = (teacher: User) => {
    openModal({
      title: "Confirm Deletion",
      content: (
        <DeleteConfirmation
          title="Delete Teacher"
          message={`Are you sure you want to delete "${teacher.name}"? This action cannot be undone.`}
          itemName={teacher.name}
          onConfirm={() => deleteTeacher(teacher.id)}
          onCancel={() => closeModal()}
        />
      ),
    });
  };

  const handleAddTeacher = () => {
    console.log("Add Teacher");
    openModal({
      title: "Add Teacher",
      content: <StudentForm submitLabel="Add Teacher" type="teacher" />,
    });
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-2 border-b px-4 bg-white">
          {/* Sidebar toggle (replace SidebarTrigger) */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu className="h-5 w-5" />
          </button>

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
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4" />
                Filters
              </button>
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
                  {teachers?.results.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {teacher.name.charAt(0)}
                          </div>
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
                        {/* <button className="text-blue-600 hover:text-blue-800 mr-3">
                          Edit
                        </button> */}
                        <button
                          onClick={() => handleDeleteClick(teacher)}
                          className="text-red-600 hover:text-red-800"
                        >
                          {isDeleting === teacher.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              Deleting...
                            </>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </span>
                          )}
                        </button>
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
