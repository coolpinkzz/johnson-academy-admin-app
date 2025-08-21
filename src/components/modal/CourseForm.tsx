"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSyllabus } from "@/services/syllabus";
import { SyllabusResponse } from "@/types/syllabus";
import { uploadProfilePicture } from "@/services/upload";
import { createCourse } from "@/services/course";
import { useModal } from "@/components/modal";

interface CourseFormData {
  name: string;
  description: string;
  image: string;
  instrument: string;
  syllabus: string[];
}

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
    syllabus: initialData.syllabus || [],
  });

  const [errors, setErrors] = useState<Partial<CourseFormData>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  // Fetch syllabi for selection
  const { data: syllabusData, isLoading: syllabusLoading } = useQuery({
    queryKey: ["syllabus"],
    queryFn: () => getSyllabus(),
    enabled: true,
  });

  // create course
  const { mutate: createCourseMutation, isPending: isCreatingCourse } =
    useMutation({
      mutationFn: (data: CourseFormData) => createCourse(data),
      onSuccess: (data) => {
        console.log("Course created successfully", data);
        closeModal();
        queryClient.invalidateQueries({ queryKey: ["courses"] });
      },
      onError: (error) => {
        console.error("Error creating course:", error);
      },
    });

  const instruments = [
    "Guitar",
    "Piano",
    "Violin",
    "Drums",
    "Voice",
    "Ukulele",
    "Other",
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<CourseFormData> = {};

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
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await uploadProfilePicture(
        file,
        "courses",
        "course-image"
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Set the image URL from the upload response
      setFormData((prev) => ({ ...prev, image: response.data.url }));

      // Clear any image-related errors
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
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Please select an image file",
        }));
        return;
      }

      // Validate file size (max 5MB)
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

    if (validateForm()) {
      // If image is still uploading, wait for it to complete
      if (isUploading) {
        return;
      }

      createCourseMutation(formData);
    }
  };

  const handleInputChange = (
    field: keyof CourseFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSyllabusSelection = (syllabusId: string) => {
    setFormData((prev) => {
      const currentSyllabi = prev.syllabus;
      const newSyllabi = currentSyllabi.includes(syllabusId)
        ? currentSyllabi.filter((id) => id !== syllabusId)
        : [...currentSyllabi, syllabusId];

      return { ...prev, syllabus: newSyllabi };
    });
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Name */}
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

      {/* Instrument */}
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

      {/* Description */}
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

      {/* Image Upload */}
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

      {/* Syllabus Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Syllabi
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
          {syllabusLoading ? (
            <p className="text-sm text-gray-500">Loading syllabi...</p>
          ) : syllabusData?.length > 0 ? (
            syllabusData.map((syllabus: SyllabusResponse) => (
              <label
                key={syllabus._id || syllabus.id}
                className="flex items-center space-x-2 py-1"
              >
                <input
                  type="checkbox"
                  checked={formData.syllabus.includes(
                    syllabus._id || syllabus.id
                  )}
                  onChange={() =>
                    handleSyllabusSelection(syllabus._id || syllabus.id)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{syllabus.title}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              {syllabusLoading ? "Loading syllabi..." : "No syllabi available"}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
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
