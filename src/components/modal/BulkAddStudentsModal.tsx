"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { bulkAddStudents } from "@/services/class";
import { searchStudents } from "@/services/student";
import { useModal } from "../modal";
import { UserResponse } from "@/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface BulkAddStudentsModalProps {
  classId: string;
  className: string;
  existingStudentIds: string[];
  onSuccess?: () => void;
}

export function BulkAddStudentsModal({
  classId,
  className,
  existingStudentIds,
  onSuccess,
}: BulkAddStudentsModalProps) {
  const { closeModal } = useModal();
  const queryClient = useQueryClient();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use mutation for bulk adding students
  const bulkAddMutation = useMutation({
    mutationFn: (studentIds: string[]) => bulkAddStudents(classId, studentIds),
    onSuccess: () => {
      // Invalidate and refetch classes data
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      if (onSuccess) {
        onSuccess();
      }
      closeModal();
    },
    onError: (error) => {
      console.error("Error adding students to class:", error);
    },
  });

  // Fetch available students (excluding already enrolled ones)
  const { data: studentsData } = useQuery({
    queryKey: ["available-students", existingStudentIds],
    retry: false,
    queryFn: () => searchStudents(""),
    enabled: !!searchQuery,
    select: (data) => {
      const allStudents = data.results || [];
      // Filter out students already enrolled in this class
      return allStudents.filter(
        (student) => !existingStudentIds.includes(student._id)
      );
    },
  });

  // Update availableStudents state when query data changes
  useEffect(() => {
    if (studentsData) {
      setAvailableStudents(studentsData);
    }
  }, [studentsData]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is empty, show all available students
      const response = await searchStudents("");
      const allStudents = response.results || [];
      const available = allStudents.filter(
        (student) => !existingStudentIds.includes(student._id)
      );
      setAvailableStudents(available);
      return;
    }

    if (query.length < 2) return;

    setIsSearching(true);
    try {
      const response = await searchStudents(query);
      const searchResults = response.results || [];
      // Filter out students already enrolled in this class
      const available = searchResults.filter(
        (student) => !existingStudentIds.includes(student._id)
      );
      setAvailableStudents(available);
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleSearch(query);
        }, 300);
      };
    })(),
    [existingStudentIds]
  );

  const handleSubmit = () => {
    if (selectedStudentIds.length === 0) {
      return;
    }

    bulkAddMutation.mutate(selectedStudentIds);
  };

  const handleCancel = () => {
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Add Students to {className}
        </h3>
        <p className="text-sm text-gray-600">
          Select students to add to this class. Students already enrolled are
          not shown.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search students by name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-8"
        />
        {isSearching && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Students List */}
      <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
        {availableStudents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {searchQuery
              ? `No students found for "${searchQuery}"`
              : "No available students to add"}
          </p>
        ) : (
          <div className="space-y-2">
            {availableStudents.map((student) => (
              <label
                key={student.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={() => handleStudentToggle(student.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{student.name}</span>
                <span className="text-xs text-gray-500">({student.email})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            {selectedStudentIds.length} student(s) selected for addition
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={bulkAddMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={
            bulkAddMutation.isPending || selectedStudentIds.length === 0
          }
          className="bg-blue-600 hover:bg-blue-700"
        >
          {bulkAddMutation.isPending
            ? "Adding..."
            : `Add ${selectedStudentIds.length} Student(s)`}
        </Button>
      </div>
    </div>
  );
}
