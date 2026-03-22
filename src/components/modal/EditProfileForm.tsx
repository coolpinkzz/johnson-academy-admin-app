"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/components/modal";
import { uploadProfilePicture } from "@/services/upload";
import { User } from "@/types/user";
import { UpdateProfileData } from "@/services/student";
import { Eye, EyeOff } from "lucide-react";

export interface EditProfileFormData {
  name: string;
  email: string;
  password: string;
  profilePicture: string;
  phoneNumber: string;
  rollNumber: string;
}

interface EditProfileFormProps {
  student: User;
  onSubmit: (data: UpdateProfileData) => Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
}

const PHONE_PATTERN = /^\+?[\d\s-()]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// min 8 chars, at least one number and one letter
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

export function EditProfileForm({
  student,
  onSubmit,
  submitLabel = "Update Profile",
  cancelLabel = "Cancel",
}: EditProfileFormProps) {
  const { closeModal } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EditProfileFormData>({
    name: student.name || "",
    email: student.email || "",
    password: "",
    profilePicture: student.profilePicture || "",
    phoneNumber: student.phoneNumber || "",
    rollNumber: student.rollNumber || "",
  });

  const [profilePreview, setProfilePreview] = useState<string>(
    student.profilePicture || ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EditProfileFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setProfilePreview(student.profilePicture || "");
  }, [student.profilePicture]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EditProfileFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_PATTERN.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!PASSWORD_PATTERN.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one letter and one number";
      }
    }

    if (formData.phoneNumber && !PHONE_PATTERN.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let profilePictureUrl = formData.profilePicture;

      if (fileInputRef.current?.files?.[0]) {
        const response = await uploadProfilePicture(
          fileInputRef.current.files[0],
          "students",
          "student,profile"
        );
        if (response.data?.url) {
          profilePictureUrl = response.data.url;
        }
      }

      const payload: UpdateProfileData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        profilePicture: profilePictureUrl || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        rollNumber: formData.rollNumber.trim() || undefined,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await onSubmit(payload);
      closeModal();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof EditProfileFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const removeProfilePicture = () => {
    setProfilePreview("");
    setFormData((prev) => ({ ...prev, profilePicture: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 cursor-pointer flex items-center justify-center overflow-hidden hover:border-blue-400"
          >
            {profilePreview ? (
              <img
                src={profilePreview}
                alt="Profile"
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
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
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
        <p className="text-sm text-gray-500">Click to upload (optional)</p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
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

      {/* Email */}
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

      {/* Password (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password (leave blank to keep current)
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
            placeholder="Min 8 chars, 1 letter + 1 number"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <Input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          className={errors.phoneNumber ? "border-red-500" : ""}
          placeholder="e.g. +1 234 567 8900"
        />
        {errors.phoneNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
        )}
      </div>

      {/* Roll Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Roll Number
        </label>
        <Input
          type="text"
          value={formData.rollNumber}
          onChange={(e) => handleInputChange("rollNumber", e.target.value)}
          className={errors.rollNumber ? "border-red-500" : ""}
          placeholder="e.g. JA/GTR/1234"
        />
        {errors.rollNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.rollNumber}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => closeModal()}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
