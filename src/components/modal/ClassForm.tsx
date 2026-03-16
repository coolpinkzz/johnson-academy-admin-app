"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ClassFormData, IClass } from "@/types/class";
import { getTeachers } from "@/services/teacher";
import { createClass, updateClass } from "@/services/class";
import { useModal } from "../modal";
import { useQueryClient } from "@tanstack/react-query";

interface ClassFormProps {
  onSubmit?: (data: Partial<IClass>) => void;
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
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ClassFormData>({
    name: initialData.name || "",
    teacherId: "", // check this later
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // Fetch teachers on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
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
    };

    fetchTeachers();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    }

    if (!formData.teacherId) {
      newErrors.teacherId = "Teacher is required";
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
      await createClass({
        name: formData.name,
        teacherId: formData.teacherId,
      });

      // Invalidate classes query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["classes"] });

      closeModal();
    } catch (error) {
      console.error("Error saving class:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ClassFormData, value: any) => {
    console.log(field, value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

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
            <option key={teacher?._id} value={teacher?._id}>
              {teacher?.name}
            </option>
          ))}
        </select>
        {errors.teacherId && (
          <p className="text-sm text-red-600 mt-1">{errors.teacherId}</p>
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
