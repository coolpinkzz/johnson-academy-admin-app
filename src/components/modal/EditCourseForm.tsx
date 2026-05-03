"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { updateCourse } from "@/services/course";
import { uploadProfilePicture } from "@/services/upload";
import { Course } from "@/types/course";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

function courseId(course: Course) {
  return course._id || course.id || "";
}

const instruments = [
  "Guitar",
  "Piano",
  "Western Keyboard",
  "Classical Keyboard",
  "Violin",
  "Drums",
  "Voice",
  "Ukulele",
  "Other",
];

interface FormErrors {
  name?: string;
  description?: string;
  instrument?: string;
  image?: string;
}

interface EditCourseFormProps {
  course: Course;
  submitLabel?: string;
}

export function EditCourseForm({
  course,
  submitLabel = "Save changes",
}: EditCourseFormProps) {
  const { closeModal } = useModal();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(course.name || "");
  const [description, setDescription] = useState(course.description || "");
  const [instrument, setInstrument] = useState(course.instrument || "");
  const [image, setImage] = useState(course.image || "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setName(course.name || "");
    setDescription(course.description || "");
    setInstrument(course.instrument || "");
    setImage(course.image || "");
  }, [course]);

  const validateForm = (): boolean => {
    const next: FormErrors = {};

    if (!name.trim()) {
      next.name = "Course name is required";
    }

    if (!description.trim()) {
      next.description = "Course description is required";
    } else if (description.trim().length < 10) {
      next.description = "Description must be at least 10 characters";
    }

    if (!instrument) {
      next.instrument = "Instrument is required";
    }

    if (!image) {
      next.image = "Course image is required";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
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

      setImage(response.data.url);
      if (errors.image) {
        setErrors((prev) => ({ ...prev, image: undefined }));
      }
    } catch {
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

  const removeImage = () => {
    setImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const id = courseId(course);
      if (!id) {
        throw new Error("Missing course id");
      }
      return updateCourse(id, {
        name: name.trim(),
        description: description.trim(),
        instrument,
        image,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course updated successfully");
      closeModal();
    },
    onError: (error) => {
      const ax = error as AxiosError<{ message?: string }>;
      toast.error(
        ax.response?.data?.message ||
          (error instanceof Error ? error.message : null) ||
          "Failed to update course. Try again.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    if (!validateForm()) return;
    mutation.mutate();
  };

  const isPending = mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course image *
        </label>

        {image ? (
          <div className="space-y-2">
            <img
              src={image}
              alt="Course preview"
              className="w-32 h-32 object-cover rounded-lg border"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeImage}
                className="text-red-600 hover:text-red-800"
              >
                Remove image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change image
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
                  />
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
                  Choose image
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Course name"
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
          value={instrument}
          onChange={(e) => {
            setInstrument(e.target.value);
            if (errors.instrument)
              setErrors((prev) => ({ ...prev, instrument: undefined }));
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.instrument ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select instrument</option>
          {instruments.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errors.instrument && (
          <p className="text-sm text-red-600 mt-1">{errors.instrument}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description)
              setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Course description"
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => closeModal()}
          disabled={isPending || isUploading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || isUploading}>
          {isUploading || isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
