"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { IClass } from "@/types/class";
import { getCourses } from "@/services/course";
import { getTeachers } from "@/services/teacher";
import { getStudents, searchStudents } from "@/services/student";
import { createClass, updateClass } from "@/services/class";
import { useModal } from "../modal";
import { CourseResponse } from "@/types/course";
import { UserResponse } from "@/types/user";

interface ClassFormProps {
  onSubmit?: (data: IClass) => void;
  onCancel?: () => void;
  initialData?: Partial<IClass>;
  submitLabel?: string;
  cancelLabel?: string;
}

export function ClassForm({
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel = "Create Class",
  cancelLabel = "Cancel",
}: ClassFormProps) {
  const { closeModal } = useModal();
  const [formData, setFormData] = useState<IClass>({
    name: initialData.name || "",
    teacherId: initialData.teacherId || "",
    courseId: initialData.courseId || "",
    students: initialData.students || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data states
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch courses
      setIsLoadingCourses(true);
      try {
        const coursesResponse = await getCourses();
        setCourses(coursesResponse.results || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }

      // Fetch teachers
      setIsLoadingTeachers(true);
      try {
        const teachersResponse = await getTeachers();
        setTeachers(teachersResponse.results || []);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setTeachers([]);
      } finally {
        setIsLoadingTeachers(false);
      }

      // Fetch students
      setIsLoadingStudents(true);
      try {
        const studentsResponse = await getStudents();
        const studentsData = studentsResponse.results || [];
        setStudents(studentsData);
        setFilteredStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    }

    if (!formData.teacherId) {
      newErrors.teacherId = "Teacher is required";
    }

    if (!formData.courseId) {
      newErrors.courseId = "Course is required";
    }

    if (formData.students.length === 0) {
      newErrors.students = "At least one student is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData.id) {
        // Update existing class
        await updateClass(initialData.id, formData);
      } else {
        // Create new class
        await createClass(formData);
      }

      if (onSubmit) {
        onSubmit(formData);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving class:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof IClass, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter((id) => id !== studentId)
        : [...prev.students, studentId],
    }));

    // Clear error when user selects students
    if (errors.students) {
      setErrors((prev) => ({
        ...prev,
        students: "",
      }));
    }
  };

  const handleStudentSearch = async (query: string) => {
    if (!query.trim()) {
      // If search is empty, show all students
      setFilteredStudents(students);
      return;
    }

    // Debounce search to avoid too many API calls
    if (query.length < 2) {
      return;
    }

    setIsSearchingStudents(true);
    try {
      const searchResponse = await searchStudents(query);
      const searchResults = searchResponse.results || [];
      setFilteredStudents(searchResults);
    } catch (error) {
      console.error("Error searching students:", error);
      // Fallback to client-side filtering if API fails
      const filtered = students.filter((student) =>
        student.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStudents(filtered);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  // Debounced search to avoid too many API calls
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleStudentSearch(query);
        }, 300); // 300ms delay
      };
    })(),
    []
  );

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    closeModal();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Class Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter class name"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Teacher Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teacher *
        </label>
        <select
          value={formData.teacherId}
          onChange={(e) => handleInputChange("teacherId", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.teacherId ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isLoadingTeachers}
        >
          <option value="">
            {isLoadingTeachers ? "Loading teachers..." : "Select a teacher"}
          </option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
        {errors.teacherId && (
          <p className="text-sm text-red-600 mt-1">{errors.teacherId}</p>
        )}
      </div>

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course *
        </label>
        <select
          value={formData.courseId as string}
          onChange={(e) => handleInputChange("courseId", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.courseId ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isLoadingCourses}
        >
          <option value="">
            {isLoadingCourses ? "Loading courses..." : "Select a course"}
          </option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.name}
            </option>
          ))}
        </select>
        {errors.courseId && (
          <p className="text-sm text-red-600 mt-1">{errors.courseId}</p>
        )}
      </div>

      {/* Students Multi-selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Students *
        </label>

        {/* Search Input */}
        <div className="mb-3 relative">
          <input
            type="text"
            placeholder="Search students by name..."
            value={studentSearchQuery}
            onChange={(e) => {
              setStudentSearchQuery(e.target.value);
              debouncedSearch(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-8"
          />
          {isSearchingStudents && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
          {isLoadingStudents ? (
            <p className="text-sm text-gray-500">Loading students...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-sm text-gray-500">
              {studentSearchQuery
                ? `No students found for "${studentSearchQuery}"`
                : "No students available"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={formData.students.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{student.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {errors.students && (
          <p className="text-sm text-red-600 mt-1">{errors.students}</p>
        )}
        {formData.students.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {formData.students.length} student(s) selected
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
