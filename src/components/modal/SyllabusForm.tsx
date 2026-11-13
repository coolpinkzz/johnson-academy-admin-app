"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getCourses } from "@/services/course";
import { Course } from "@/types/course";

interface SyllabusFormData {
  courseId: string;
  title: string;
  description: string;
}

interface SyllabusFormProps {
  onSubmit: (data: SyllabusFormData) => void;
  onCancel: () => void;
  initialData?: Partial<SyllabusFormData>;
  submitLabel?: string;
  cancelLabel?: string;
}

export function SyllabusForm({
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel = "Create Syllabus",
  cancelLabel = "Cancel",
}: SyllabusFormProps) {
  const [formData, setFormData] = useState<SyllabusFormData>({
    courseId: initialData.courseId || "",
    title: initialData.title || "",
    description: initialData.description || "",
  });

  const [errors, setErrors] = useState<Partial<SyllabusFormData>>({});

  // Fetch courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses(),
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<SyllabusFormData> = {};

    if (!formData.courseId) {
      newErrors.courseId = "Course is required";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof SyllabusFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course *
        </label>
        <select
          value={formData.courseId}
          onChange={(e) => handleInputChange("courseId", e.target.value)}
          disabled={coursesLoading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.courseId ? "border-red-500" : "border-gray-300"
          } ${coursesLoading ? "bg-gray-100 cursor-not-allowed" : ""}`}
        >
          <option key="default" value="">
            {coursesLoading ? "Loading courses..." : "Select a course"}
          </option>
          {coursesData?.results?.map((course: Course) => (
            <option
              key={course.id || course.name}
              value={course._id || course.id}
            >
              {course.name} - {course.instrument}
            </option>
          ))}
        </select>
        {errors.courseId && (
          <p className="text-sm text-red-600 mt-1">{errors.courseId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter syllabus title"
        />
        {errors.title && (
          <p className="text-sm text-red-600 mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter syllabus description"
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-4 py-2"
        >
          {cancelLabel}
        </Button>
        <Button type="submit" className="px-4 py-2">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
