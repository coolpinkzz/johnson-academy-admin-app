"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal";
import {
  UpdateTeacherProfileData,
  updateTeacherProfile,
} from "@/services/teacher";
import { uploadProfilePicture } from "@/services/upload";
import { User } from "@/types/user";
import { Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

interface FormState {
  name: string;
  email: string;
  password: string;
  profilePicture: string;
  phoneNumber: string;
  employeeId: string;
}

function teacherEmployeeIdSeed(teacher: User) {
  return (
    (teacher.employeeId ?? "").trim() ||
    (teacher.rollNumber ?? "").trim() ||
    ""
  );
}

interface EditTeacherFormProps {
  teacher: User;
  submitLabel?: string;
}

const PHONE_PATTERN = /^\+?[\d\s-()]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

function teacherUserId(teacher: User) {
  return teacher.id || teacher._id;
}

export function EditTeacherForm({
  teacher,
  submitLabel = "Save changes",
}: EditTeacherFormProps) {
  const { closeModal } = useModal();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormState>({
    name: teacher.name || "",
    email: teacher.email || "",
    password: "",
    profilePicture: teacher.profilePicture || "",
    phoneNumber: teacher.phoneNumber || "",
    employeeId: teacherEmployeeIdSeed(teacher),
  });

  const [profilePreview, setProfilePreview] = useState<string>(
    teacher.profilePicture || "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  useEffect(() => {
    setProfilePreview(teacher.profilePicture || "");
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      password: "",
      profilePicture: teacher.profilePicture || "",
      phoneNumber: teacher.phoneNumber || "",
      employeeId: teacherEmployeeIdSeed(teacher),
    });
  }, [teacher]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

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

  const mutation = useMutation({
    mutationFn: async (payload: UpdateTeacherProfileData) => {
      const userId = teacherUserId(teacher);
      return updateTeacherProfile(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher updated successfully");
      closeModal();
    },
    onError: (error) => {
      const ax = error as AxiosError<{ message: string }>;
      toast.error(
        ax.response?.data?.message || "Failed to update teacher. Try again.",
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let profilePictureUrl = formData.profilePicture;

    if (fileInputRef.current?.files?.[0]) {
      const response = await uploadProfilePicture(
        fileInputRef.current.files[0],
        "teachers",
        "teacher,profile",
      );
      if (response.data?.url) {
        profilePictureUrl = response.data.url;
      }
    }

    const empIdAsRollNumber = formData.employeeId.trim();
    const payload: UpdateTeacherProfileData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      profilePicture:
        profilePictureUrl && profilePictureUrl.trim().length > 0
          ? profilePictureUrl
          : undefined,
      phoneNumber: formData.phoneNumber.trim() || undefined,
      ...(empIdAsRollNumber ? { rollNumber: empIdAsRollNumber } : {}),
    };

    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    mutation.mutate(payload);
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
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

  const isPending = mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <button
            type="button"
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
                <span className="text-xs">Upload Photo</span>
              </div>
            )}
          </button>
          {profilePreview ? (
            <button
              type="button"
              onClick={removeProfilePicture}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          ) : null}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={errors.name ? "border-red-500" : ""}
          placeholder="Full name"
        />
        {errors.name ? (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={errors.email ? "border-red-500" : ""}
          placeholder="Email"
        />
        {errors.email ? (
          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New password (leave blank to keep current)
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
            placeholder="Min 8 characters, letters and numbers"
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
        {errors.password ? (
          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone number
        </label>
        <Input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          className={errors.phoneNumber ? "border-red-500" : ""}
          placeholder="+1 ..."
        />
        {errors.phoneNumber ? (
          <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employee ID
        </label>
        <Input
          type="text"
          value={formData.employeeId}
          onChange={(e) => handleInputChange("employeeId", e.target.value)}
          className={errors.employeeId ? "border-red-500" : ""}
          placeholder="Employee ID"
        />
        {errors.employeeId ? (
          <p className="text-sm text-red-600 mt-1">{errors.employeeId}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => closeModal()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
