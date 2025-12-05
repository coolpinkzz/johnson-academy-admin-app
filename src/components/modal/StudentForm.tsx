"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AuthService, { LoginResponse } from "@/services/auth";
import { client } from "@/services/api-client";
import { uploadProfilePicture } from "@/services/upload";
import { useModal } from "@/hooks/use-modal";
import { Eye, EyeOff } from "lucide-react";

interface StudentFormData {
  email: string;
  password: string;
  name: string;
  role: string;
  profilePicture: string | null | undefined;
  phoneNumber: string;
  rollNumber: string;
}

interface StudentFormProps {
  submitLabel?: string;
  cancelLabel?: string;
  type: "student" | "teacher";
}

export function StudentForm({
  submitLabel = "Add Student",
  cancelLabel = "Cancel",
  type = "student",
}: StudentFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<StudentFormData>({
    email: "",
    password: "",
    name: "",
    role: type, // Hidden field, always set to student
    profilePicture: null,
    phoneNumber: "",
    rollNumber: "",
  });

  const { closeModal } = useModal();
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentFormData> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Phone number validation (required)
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    // Roll number validation (required)
    if (!formData.rollNumber.trim()) {
      newErrors.rollNumber = "Roll number is required";
    } else if (!/^JA\/GTR\/\d{4}$/.test(formData.rollNumber)) {
      newErrors.rollNumber = "Roll number must be in format JA/GTR/1234";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // register student
  const { isPending, error, data, mutateAsync } = useMutation({
    mutationFn: async (data: StudentFormData): Promise<any> => {
      const response = await client("/auth/register", {
        method: "POST",
        data: data,
      });
      return response as unknown as LoginResponse;
    },
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({
        queryKey: type === "student" ? ["students"] : ["teachers"],
      });
    },
    onError: (error) => {
      console.error("Error registering user:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      let profileUrl = "";
      // upload profile picture if user has selected a file
      if (fileInputRef.current?.files?.[0]) {
        const response = await uploadProfilePicture(
          fileInputRef.current?.files?.[0] as File,
          type === "student" ? "students" : "teachers",
          type === "student" ? "student,profile" : "teacher,profile"
        );
        if (response.data.url) {
          profileUrl = response.data.url;
          setFormData((prev) => ({
            ...prev,
            profilePicture: profileUrl,
          }));
        }
      }
      await mutateAsync({ ...formData, profilePicture: profileUrl });
    }
  };

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfilePreview(result);
        setFormData((prev) => ({ ...prev, profilePicture: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const removeProfilePicture = () => {
    setProfilePreview("");
    setFormData((prev) => ({ ...prev, profilePicture: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div
            onClick={handleProfilePictureClick}
            className={`w-24 h-24 rounded-full border-2 border-dashed border-gray-300 cursor-pointer flex items-center justify-center overflow-hidden ${
              profilePreview
                ? "border-solid border-blue-500"
                : "hover:border-blue-400"
            }`}
          >
            {profilePreview ? (
              <img
                src={profilePreview}
                alt="Profile preview"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <svg
                  className="w-8 h-8 mx-auto mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-xs">Upload Photo</span>
              </div>
            )}
          </div>

          {profilePreview && (
            <button
              type="button"
              onClick={removeProfilePicture}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleProfilePictureChange}
          className="hidden"
        />

        <p className="text-sm text-gray-500 text-center">
          Click to upload profile picture (optional)
        </p>
      </div>

      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={errors.name ? "border-red-500" : ""}
          placeholder="Enter full name"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={errors.email ? "border-red-500" : ""}
          placeholder="Enter email address"
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
        )}
      </div>

      {/* Phone Number Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <Input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          className={errors.phoneNumber ? "border-red-500" : ""}
          placeholder="Enter phone number"
        />
        {errors.phoneNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
        )}
      </div>

      {/* Roll Number Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Roll Number *
        </label>
        <Input
          type="text"
          value={formData.rollNumber}
          onChange={(e) => handleInputChange("rollNumber", e.target.value)}
          className={errors.rollNumber ? "border-red-500" : ""}
          placeholder="JA/GTR/1234"
        />
        {errors.rollNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.rollNumber}</p>
        )}
      </div>

      {/* Hidden Role Field */}
      <input type="hidden" value={formData.role} />

      <div className="flex justify-end space-x-2 pt-4">
        {/* <Button
          type="button"
          variant="outline"
          onClick={() => closeModal("")}
          className="px-4 py-2"
        >
          {cancelLabel}
        </Button> */}
        <Button type="submit" className="px-4 py-2">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
