"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadProfilePicture } from "@/services/upload";
import { createCourse } from "@/services/course";
import { useModal } from "@/components/modal";
import { CreateCoursePayload } from "@/types/course";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

interface CourseFormData {
  name: string;
  description: string;
  image: string;
  instrument: string;
  level: string;
  syllabus: string[];
}

type CourseFormErrors = Partial<Record<keyof CourseFormData, string>>;

interface CourseFormProps {
  onSubmit?: (data: CourseFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<CourseFormData>;
  submitLabel?: string;
  cancelLabel?: string;
}

export function CourseForm({
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel = "Create Course",
  cancelLabel = "Cancel",
}: CourseFormProps) {
  const { closeModal } = useModal();
  const [formData, setFormData] = useState<CourseFormData>({
    name: initialData.name || "",
    description: initialData.description || "",
    image: initialData.image || "",
    instrument: initialData.instrument || "",
    level: initialData.level || "",
    syllabus: initialData.syllabus || [],
  });

  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { mutate: createCourseMutation, isPending: isCreatingCourse } =
    useMutation({
      mutationFn: (data: CreateCoursePayload) => createCourse(data),
      onSuccess: () => {
        toast.success("Course created successfully");
        closeModal();
        queryClient.invalidateQueries({ queryKey: ["courses"] });
      },
      onError: (error) => {
        const ax = error as AxiosError<{ message?: string }>;
        toast.error(
          ax.response?.data?.message ||
            (error instanceof Error ? error.message : null) ||
            "Failed to create course. Try again.",
        );
      },
    });

  const instruments = [
    "Guitar",
    "Piano",
    "Western Dance",
    "Western Keyboard",
    "Classical Keyboard",
    "Violin",
    "Drums",
    "Voice",
    "Ukulele",
    "Other",
  ];

  const validateForm = (): boolean => {
    const newErrors: CourseFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Course name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Course description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.instrument) {
      newErrors.instrument = "Instrument is required";
    }

    const levelNum = Number(formData.level);
    if (formData.level === "" || Number.isNaN(levelNum)) {
      newErrors.level = "Level is required";
    } else if (!Number.isInteger(levelNum) || levelNum < 1) {
      newErrors.level = "Level must be a whole number of 1 or higher";
    }

    if (!formData.image) {
      newErrors.image = "Course image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await uploadProfilePicture(
        file,
        "courses",
        "course-image",
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      setFormData((prev) => ({ ...prev, image: response.data.url }));

      if (errors.image) {
        setErrors((prev) => ({ ...prev, image: undefined }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrors((prev) => ({ ...prev, image: "Failed to upload image" }));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Please select an image file",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "Image size must be less than 5MB",
        }));
        return;
      }

      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isUploading) {
      return;
    }

    const payload: CreateCoursePayload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      image: formData.image,
      instrument: formData.instrument,
      level: Number(formData.level),
      ...(formData.syllabus.length > 0 ? { syllabus: formData.syllabus } : {}),
    };

    onSubmit?.(formData);
    createCourseMutation(payload);
  };

  const handleInputChange = (field: keyof CourseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter course name"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instrument *
        </label>
        <select
          value={formData.instrument}
          onChange={(e) => handleInputChange("instrument", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.instrument ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select instrument</option>
          {instruments.map((instrument) => (
            <option key={instrument} value={instrument}>
              {instrument}
            </option>
          ))}
        </select>
        {errors.instrument && (
          <p className="text-sm text-red-600 mt-1">{errors.instrument}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Level *
        </label>
        <input
          type="number"
          min={1}
          step={1}
          value={formData.level}
          onChange={(e) => handleInputChange("level", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.level ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="e.g. 1"
        />
        {errors.level && (
          <p className="text-sm text-red-600 mt-1">{errors.level}</p>
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
          placeholder="Enter course description"
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course Image *
        </label>

        {formData.image ? (
          <div className="space-y-2">
            <img
              src={formData.image}
              alt="Course preview"
              className="w-32 h-32 object-cover rounded-lg border"
            />
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeImage}
                className="text-red-600 hover:text-red-800"
              >
                Remove Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {isUploading ? (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  PNG, JPG, GIF up to 5MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Image
                </Button>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {errors.image && (
          <p className="text-sm text-red-600 mt-1">{errors.image}</p>
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
        <Button
          type="submit"
          className="px-4 py-2"
          disabled={isUploading || isCreatingCourse}
        >
          {isUploading || isCreatingCourse ? "Uploading..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
