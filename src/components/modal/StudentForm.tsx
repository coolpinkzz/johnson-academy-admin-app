"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginResponse, useAuth } from "@/services/auth";
import { client } from "@/services/api-client";
import { uploadProfilePicture } from "@/services/upload";
import { useCreatePackage } from "@/services/studentFee";
import { PackageForm } from "@/components/fees/PackageForm";
import { canManageStudentFees } from "@/lib/rbac";
import { useModal } from "@/hooks/use-modal";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import {
  isValidRollNumber,
  ROLL_NUMBER_ERROR_MESSAGE,
  ROLL_NUMBER_PLACEHOLDER,
} from "@/lib/roll-number";
import {
  GENDERS,
  PHONE_PATTERN,
  REFERRAL_SOURCES,
  Gender,
  ReferralSource,
  todayDateInputValue,
} from "@/lib/admission";

interface StudentFormData {
  email: string;
  password: string;
  name: string;
  role: string;
  profilePicture: string | null | undefined;
  phoneNumber: string;
  rollNumber: string;
  dateOfBirth: string;
  occupation: string;
  whatsappNumber: string;
  gender: Gender | "";
  address: string;
  referralSource: ReferralSource | "";
  referralSourceOther: string;
  dateOfJoining: string;
}

interface RegisterStudentPayload {
  email: string;
  password: string;
  name: string;
  role: string;
  profilePicture: string;
  phoneNumber: string;
  rollNumber: string;
  dateOfBirth?: string;
  occupation?: string;
  whatsappNumber?: string;
  gender?: Gender;
  address?: string;
  referralSource?: ReferralSource;
  referralSourceOther?: string;
  dateOfJoining?: string;
}

const selectClass = (hasError: boolean) =>
  `border-input flex h-9 w-full rounded-md border bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ${
    hasError ? "border-red-500" : ""
  }`;

interface StudentFormProps {
  submitLabel?: string;
  cancelLabel?: string;
  type: "student" | "teacher";
  /** When set, the student stays in the current modal and the parent advances the stepper. */
  onStudentCreated?: (student: {
    id: string;
    name: string;
    dateOfJoining: string;
  }) => void;
}

export function StudentForm({
  submitLabel = "Add Student",
  type = "student",
  onStudentCreated,
}: StudentFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createPackage = useCreatePackage();
  const { closeModal, openModal } = useModal();
  const [formData, setFormData] = useState<StudentFormData>({
    email: "",
    password: "",
    name: "",
    role: type, // Hidden field, always set to student
    profilePicture: null,
    phoneNumber: "",
    rollNumber: "",
    dateOfBirth: "",
    occupation: "",
    whatsappNumber: "",
    gender: "",
    address: "",
    referralSource: "",
    referralSourceOther: "",
    dateOfJoining: type === "student" ? todayDateInputValue() : "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {};

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
    } else if (!PHONE_PATTERN.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    // Roll number validation (required for students)
    if (type === "student") {
      const trimmedRollNumber = formData.rollNumber.trim();
      if (!trimmedRollNumber) {
        newErrors.rollNumber = "Roll number is required";
      } else if (!isValidRollNumber(trimmedRollNumber)) {
        newErrors.rollNumber = ROLL_NUMBER_ERROR_MESSAGE;
      }

      const today = todayDateInputValue();
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      } else if (formData.dateOfBirth > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }

      if (!formData.occupation.trim()) {
        newErrors.occupation = "Occupation is required";
      }

      if (!formData.whatsappNumber.trim()) {
        newErrors.whatsappNumber = "WhatsApp number is required";
      } else if (!PHONE_PATTERN.test(formData.whatsappNumber)) {
        newErrors.whatsappNumber = "Please enter a valid WhatsApp number";
      }

      if (!formData.gender) {
        newErrors.gender = "Gender is required";
      }

      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      }

      if (!formData.referralSource) {
        newErrors.referralSource = "Please select how you heard about us";
      } else if (
        formData.referralSource === "other" &&
        !formData.referralSourceOther.trim()
      ) {
        newErrors.referralSourceOther = "Please tell us how you heard about us";
      }

      if (!formData.dateOfJoining) {
        newErrors.dateOfJoining = "Date of joining is required";
      } else if (
        formData.dateOfBirth &&
        formData.dateOfJoining < formData.dateOfBirth
      ) {
        newErrors.dateOfJoining =
          "Date of joining must be on or after date of birth";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // register student
  const { isPending, error, data, mutateAsync } = useMutation({
    mutationFn: async (data: RegisterStudentPayload): Promise<LoginResponse> => {
      const response = await client("/auth/register", {
        method: "POST",
        data: data,
      });
      return response as unknown as LoginResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: type === "student" ? ["students"] : ["teachers"],
      });
    },
    onError: (error) => {
      const errorResponse = error as AxiosError<{ message: string }>;
      toast.error(
        errorResponse.response?.data.message ||
          "Failed to add. Please try again.",
      );
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
          type === "student" ? "student,profile" : "teacher,profile",
        );
        if (response.data.url) {
          profileUrl = response.data.url;
          setFormData((prev) => ({
            ...prev,
            profilePicture: profileUrl,
          }));
        }
      }
      const payload: RegisterStudentPayload = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        role: formData.role,
        phoneNumber: formData.phoneNumber.trim(),
        rollNumber: formData.rollNumber.trim(),
        profilePicture: profileUrl || "",
      };

      if (
        type === "student" &&
        formData.gender &&
        formData.referralSource
      ) {
        payload.dateOfBirth = formData.dateOfBirth;
        payload.occupation = formData.occupation.trim();
        payload.whatsappNumber = formData.whatsappNumber.trim();
        payload.gender = formData.gender;
        payload.address = formData.address.trim();
        payload.referralSource = formData.referralSource;
        payload.dateOfJoining = formData.dateOfJoining;
        if (formData.referralSource === "other") {
          payload.referralSourceOther = formData.referralSourceOther.trim();
        }
      }

      let created: LoginResponse;
      try {
        created = await mutateAsync(payload);
      } catch {
        return;
      }

      const studentName = formData.name.trim();
      toast.success(
        type === "student"
          ? "Student added successfully"
          : "Teacher added successfully",
      );

      const studentId = created.user?.id;
      if (type === "student" && studentId && onStudentCreated) {
        onStudentCreated({
          id: studentId,
          name: studentName,
          dateOfJoining: formData.dateOfJoining,
        });
        return;
      }

      closeModal();
      if (type === "student" && studentId && canManageStudentFees(user?.role)) {
        const joiningDate = formData.dateOfJoining;
        window.setTimeout(() => {
          openModal({
            title: `Add package · ${studentName}`,
            size: "lg",
            content: (
              <PackageForm
                studentId={studentId}
                defaultStartDate={joiningDate}
                cancelLabel="Skip for now"
                description={`${studentName} was added. Add their fee package now, or skip and add it later from the student profile.`}
                onCreate={async (packagePayload) => {
                  await createPackage.mutateAsync(packagePayload);
                }}
              />
            ),
          });
        }, 0);
      }
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
        {errors.profilePicture && (
          <p className="text-sm text-red-600 mt-1">{errors.profilePicture}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleProfilePictureChange}
          className="hidden"
        />

        <p className="text-sm text-gray-500 text-center">
          Click to upload a profile picture (optional)
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
          {type === "student" ? "Student Roll Number *" : "Employee ID"}
        </label>
        <Input
          type="text"
          value={formData.rollNumber}
          onChange={(e) => handleInputChange("rollNumber", e.target.value)}
          className={errors.rollNumber ? "border-red-500" : ""}
          placeholder={
            type === "student" ? ROLL_NUMBER_PLACEHOLDER : "Enter employee ID"
          }
        />
        {type === "student" && !errors.rollNumber && (
          <p className="text-xs text-gray-500 mt-1">
            New students use JA/MMYY/NNNN (e.g. JA/0726/3072).
          </p>
        )}
        {errors.rollNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.rollNumber}</p>
        )}
      </div>

      {type === "student" && (
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900">
            Admission details
          </h3>

          <div>
            <label
              htmlFor="student-date-of-birth"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of birth *
            </label>
            <Input
              id="student-date-of-birth"
              type="date"
              max={todayDateInputValue()}
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              className={errors.dateOfBirth ? "border-red-500" : ""}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="student-gender"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gender *
            </label>
            <select
              id="student-gender"
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className={selectClass(Boolean(errors.gender))}
            >
              <option value="">Select gender</option>
              {GENDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.gender && (
              <p className="text-sm text-red-600 mt-1">{errors.gender}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="student-occupation"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Occupation *
            </label>
            <Input
              id="student-occupation"
              type="text"
              value={formData.occupation}
              onChange={(e) => handleInputChange("occupation", e.target.value)}
              className={errors.occupation ? "border-red-500" : ""}
              placeholder="e.g. Student, Engineer"
              autoComplete="organization-title"
            />
            {errors.occupation && (
              <p className="text-sm text-red-600 mt-1">{errors.occupation}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="student-whatsapp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              WhatsApp number *
            </label>
            <Input
              id="student-whatsapp"
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) =>
                handleInputChange("whatsappNumber", e.target.value)
              }
              className={errors.whatsappNumber ? "border-red-500" : ""}
              placeholder="Enter WhatsApp number"
              autoComplete="tel"
            />
            {errors.whatsappNumber && (
              <p className="text-sm text-red-600 mt-1">{errors.whatsappNumber}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="student-address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address *
            </label>
            <textarea
              id="student-address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={3}
              className={`border-input flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ${
                errors.address ? "border-red-500" : ""
              }`}
              placeholder="House, street, city"
              autoComplete="street-address"
            />
            {errors.address && (
              <p className="text-sm text-red-600 mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="student-referral"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              How did you hear about us *
            </label>
            <select
              id="student-referral"
              value={formData.referralSource}
              onChange={(e) =>
                handleInputChange("referralSource", e.target.value)
              }
              className={selectClass(Boolean(errors.referralSource))}
            >
              <option value="">Select an option</option>
              {REFERRAL_SOURCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.referralSource && (
              <p className="text-sm text-red-600 mt-1">{errors.referralSource}</p>
            )}
          </div>

          {formData.referralSource === "other" && (
            <div>
              <label
                htmlFor="student-referral-other"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Please specify *
              </label>
              <Input
                id="student-referral-other"
                type="text"
                value={formData.referralSourceOther}
                onChange={(e) =>
                  handleInputChange("referralSourceOther", e.target.value)
                }
                className={errors.referralSourceOther ? "border-red-500" : ""}
                placeholder="Tell us how you heard about us"
              />
              {errors.referralSourceOther && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.referralSourceOther}
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="student-date-of-joining"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of joining *
            </label>
            <Input
              id="student-date-of-joining"
              type="date"
              value={formData.dateOfJoining}
              onChange={(e) =>
                handleInputChange("dateOfJoining", e.target.value)
              }
              className={errors.dateOfJoining ? "border-red-500" : ""}
            />
            {errors.dateOfJoining && (
              <p className="text-sm text-red-600 mt-1">{errors.dateOfJoining}</p>
            )}
          </div>
        </div>
      )}

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
