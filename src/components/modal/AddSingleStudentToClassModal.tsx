"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useModal } from "../modal";
import { getCourses } from "@/services/course";
import { searchStudents } from "@/services/student";
import { useAddSingleStudentToClass } from "@/services/class";
import { User } from "@/types/user";

type Props = {
  classId: string;
  className: string;
  existingStudentIds?: string[];
  defaultCourseId?: string;
  onSuccess?: () => void;
};

export function AddSingleStudentToClassModal({
  classId,
  className,
  existingStudentIds = [],
  defaultCourseId,
  onSuccess,
}: Props) {
  const { closeModal } = useModal();
  const addSingleStudentMutation = useAddSingleStudentToClass();

  const [courseId, setCourseId] = useState<string>(defaultCourseId || "");
  const [studentId, setStudentId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses(),
  });

  const courses = useMemo(() => coursesData?.results ?? [], [coursesData]);

  const doSearch = useCallback(
    async (query: string) => {
      setIsSearching(true);
      try {
        const response = await searchStudents(query);
        const raw = response.results ?? [];
        const filtered = raw.filter((s) => !existingStudentIds.includes(s._id));
        setAvailableStudents(filtered);
      } finally {
        setIsSearching(false);
      }
    },
    [existingStudentIds],
  );

  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        void doSearch(query.trim());
      }, 300);
    },
    [doSearch],
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setAvailableStudents([]);
      setStudentId("");
      setIsSearching(false);
      return;
    }
    if (searchQuery.trim().length < 2) return;
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (!classId || !studentId || !courseId) return;
    addSingleStudentMutation.mutate(
      { classId, studentId, courseId },
      {
        onSuccess: () => {
          onSuccess?.();
          closeModal();
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Add a Student to {className}
        </h3>
        <p className="text-sm text-gray-600">
          Select a student and choose a course for enrollment.
        </p>
      </div>

      {/* Course Select */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Add a course
        </label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={isCoursesLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Select a course...</option>
          {courses.map((c: any) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Student Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Add a single student
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-8"
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        <div className="max-h-56 overflow-y-auto border border-gray-300 rounded-md p-2">
          {!searchQuery.trim() ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Type at least 2 characters to search.
            </p>
          ) : availableStudents.length === 0 && !isSearching ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No students found for "{searchQuery}"
            </p>
          ) : (
            <div className="space-y-1">
              {availableStudents.map((student) => (
                <label
                  key={student._id || student.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="radio"
                    name="selectedStudent"
                    checked={studentId === (student._id || student.id)}
                    onChange={() => setStudentId((student._id || student.id) as string)}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{student.name}</span>
                  {"email" in student && student.email ? (
                    <span className="text-xs text-gray-500">
                      ({String((student as any).email)})
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => closeModal()}
          disabled={addSingleStudentMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            addSingleStudentMutation.isPending || !studentId || !courseId
          }
          className="bg-blue-600 hover:bg-blue-700"
        >
          {addSingleStudentMutation.isPending ? "Adding..." : "Add Student"}
        </Button>
      </div>
    </div>
  );
}

