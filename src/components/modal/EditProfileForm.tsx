"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/components/modal";
import { uploadProfilePicture } from "@/services/upload";
import { User } from "@/types/user";
import { UpdateProfileData } from "@/services/student";
import { Eye, EyeOff } from "lucide-react";
import {
  isValidRollNumber,
  ROLL_NUMBER_ERROR_MESSAGE,
  ROLL_NUMBER_PLACEHOLDER,
} from "@/lib/roll-number";
import {
  GENDERS,
  Gender,
  PHONE_PATTERN,
  REFERRAL_SOURCES,
  ReferralSource,
  todayDateInputValue,
  toDateInputValue,
  ageFromDateOfBirth,
  requiresParentDetails,
} from "@/lib/admission";

export interface EditProfileFormData {
  name: string;
  email: string;
  password: string;
  profilePicture: string;
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
  motherName: string;
  fatherName: string;
  guardians: { name: string; relation: string }[];
}

const selectClass = (hasError: boolean) =>
  `border-input flex h-9 w-full rounded-md border bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ${
    hasError ? "border-red-500" : ""
  }`;

interface EditProfileFormProps {
  student: User;
  onSubmit: (data: UpdateProfileData) => Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
}

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
    dateOfBirth: toDateInputValue(student.dateOfBirth),
    occupation: student.occupation || "",
    whatsappNumber: student.whatsappNumber || "",
    gender: (student.gender as Gender | undefined) || "",
    address: student.address || "",
    referralSource: (student.referralSource as ReferralSource | undefined) || "",
    referralSourceOther: student.referralSourceOther || "",
    dateOfJoining: toDateInputValue(student.dateOfJoining),
    motherName: student.motherName || "",
    fatherName: student.fatherName || "",
    guardians: (student.guardians ?? []).slice(0, 3).map((guardian) => ({
      name: guardian.name || "",
      relation: guardian.relation || "",
    })),
  });

  const [profilePreview, setProfilePreview] = useState<string>(
    student.profilePicture || ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EditProfileFormData, string>>>({});
  const [guardianError, setGuardianError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialRollNumber = (student.rollNumber || "").trim();

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

    const today = todayDateInputValue();
    if (formData.dateOfBirth && formData.dateOfBirth > today) {
      newErrors.dateOfBirth = "Date of birth cannot be in the future";
    }
    if (
      formData.whatsappNumber &&
      !PHONE_PATTERN.test(formData.whatsappNumber)
    ) {
      newErrors.whatsappNumber = "Please enter a valid WhatsApp number";
    }
    if (
      formData.referralSource === "other" &&
      !formData.referralSourceOther.trim()
    ) {
      newErrors.referralSourceOther = "Please tell us how you heard about us";
    }
    if (
      formData.dateOfBirth &&
      formData.dateOfJoining &&
      formData.dateOfJoining < formData.dateOfBirth
    ) {
      newErrors.dateOfJoining =
        "Date of joining must be on or after date of birth";
    }

    const trimmedRollNumber = formData.rollNumber.trim();
    const rollNumberChanged = trimmedRollNumber !== initialRollNumber;
    if (trimmedRollNumber && rollNumberChanged && !isValidRollNumber(trimmedRollNumber)) {
      newErrors.rollNumber = ROLL_NUMBER_ERROR_MESSAGE;
    }

    let guardiansInvalid = false;
    if (requiresParentDetails(formData.dateOfBirth)) {
      if (!formData.motherName.trim()) {
        newErrors.motherName = "Mother's name is required";
      }
      if (!formData.fatherName.trim()) {
        newErrors.fatherName = "Father's name is required";
      }
      guardiansInvalid = formData.guardians.some((guardian) => {
        const name = guardian.name.trim();
        const relation = guardian.relation.trim();
        return (name && !relation) || (!name && relation);
      });
      setGuardianError(
        guardiansInvalid ? "Guardian name and relation are required" : "",
      );
    } else {
      setGuardianError("");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !guardiansInvalid;
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
        dateOfBirth: formData.dateOfBirth || undefined,
        occupation: formData.occupation.trim() || undefined,
        whatsappNumber: formData.whatsappNumber.trim() || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
        referralSource: formData.referralSource || undefined,
        referralSourceOther:
          formData.referralSource === "other"
            ? formData.referralSourceOther.trim()
            : "",
        dateOfJoining: formData.dateOfJoining || undefined,
      };

      if (requiresParentDetails(formData.dateOfBirth)) {
        payload.motherName = formData.motherName.trim();
        payload.fatherName = formData.fatherName.trim();
        payload.guardians = formData.guardians
          .map((guardian) => ({
            name: guardian.name.trim(),
            relation: guardian.relation.trim(),
          }))
          .filter((guardian) => guardian.name && guardian.relation);
      }

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
    field: Exclude<keyof EditProfileFormData, "guardians">,
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
          placeholder={ROLL_NUMBER_PLACEHOLDER}
        />
        {errors.rollNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.rollNumber}</p>
        )}
      </div>

      <div className="space-y-6 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">
          Admission details
        </h3>

        <div>
          <label
            htmlFor="edit-date-of-birth"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date of birth
          </label>
          <Input
            id="edit-date-of-birth"
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
            htmlFor="edit-gender"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Gender
          </label>
          <select
            id="edit-gender"
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
        </div>

        <div>
          <label
            htmlFor="edit-occupation"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Occupation
          </label>
          <Input
            id="edit-occupation"
            type="text"
            value={formData.occupation}
            onChange={(e) => handleInputChange("occupation", e.target.value)}
            placeholder="e.g. Student, Engineer"
          />
        </div>

        <div>
          <label
            htmlFor="edit-whatsapp"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            WhatsApp number
          </label>
          <Input
            id="edit-whatsapp"
            type="tel"
            value={formData.whatsappNumber}
            onChange={(e) =>
              handleInputChange("whatsappNumber", e.target.value)
            }
            className={errors.whatsappNumber ? "border-red-500" : ""}
            placeholder="Enter WhatsApp number"
          />
          {errors.whatsappNumber && (
            <p className="text-sm text-red-600 mt-1">{errors.whatsappNumber}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="edit-address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <textarea
            id="edit-address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            rows={3}
            className="border-input flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            placeholder="House, street, city"
          />
        </div>

        <div>
          <label
            htmlFor="edit-referral"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            How did you hear about us
          </label>
          <select
            id="edit-referral"
            value={formData.referralSource}
            onChange={(e) =>
              handleInputChange("referralSource", e.target.value)
            }
            className={selectClass(false)}
          >
            <option value="">Select an option</option>
            {REFERRAL_SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {formData.referralSource === "other" && (
          <div>
            <label
              htmlFor="edit-referral-other"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Please specify *
            </label>
            <Input
              id="edit-referral-other"
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
            htmlFor="edit-date-of-joining"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date of joining
          </label>
          <Input
            id="edit-date-of-joining"
            type="date"
            value={formData.dateOfJoining}
            onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
            className={errors.dateOfJoining ? "border-red-500" : ""}
          />
          {errors.dateOfJoining && (
            <p className="text-sm text-red-600 mt-1">{errors.dateOfJoining}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-200 pt-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Profile card</h3>
          <p className="mt-1 text-sm text-gray-500">
            {requiresParentDetails(formData.dateOfBirth)
              ? "Mother's name and father's name are required because this student is 15 or under. Guardians are optional."
              : ageFromDateOfBirth(formData.dateOfBirth) == null
                ? "Add a date of birth to determine whether parent details are required."
                : "Parent and guardian details are not required for students over 15."}
          </p>
        </div>
        {requiresParentDetails(formData.dateOfBirth) ? (
          <>
            <div>
              <label htmlFor="edit-mother-name" className="mb-1 block text-sm font-medium text-gray-700">
                Mother&apos;s name *
              </label>
              <Input
                id="edit-mother-name"
                type="text"
                value={formData.motherName}
                onChange={(e) => handleInputChange("motherName", e.target.value)}
                className={errors.motherName ? "border-red-500" : ""}
                placeholder="Enter mother's name"
              />
              {errors.motherName ? (
                <p className="mt-1 text-sm text-red-600">{errors.motherName}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="edit-father-name" className="mb-1 block text-sm font-medium text-gray-700">
                Father&apos;s name *
              </label>
              <Input
                id="edit-father-name"
                type="text"
                value={formData.fatherName}
                onChange={(e) => handleInputChange("fatherName", e.target.value)}
                className={errors.fatherName ? "border-red-500" : ""}
                placeholder="Enter father's name"
              />
              {errors.fatherName ? (
                <p className="mt-1 text-sm text-red-600">{errors.fatherName}</p>
              ) : null}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-700">Guardians</p>
                {formData.guardians.length < 3 ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        guardians: [...prev.guardians, { name: "", relation: "" }],
                      }))
                    }
                  >
                    Add guardian
                  </button>
                ) : null}
              </div>
              {formData.guardians.length === 0 ? (
                <p className="text-sm text-gray-500">No guardians added. Up to 3 are allowed.</p>
              ) : null}
              {formData.guardians.map((guardian, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Guardian {index + 1}</p>
                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:text-gray-800"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          guardians: prev.guardians.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={guardian.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        guardians: prev.guardians.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="Guardian name"
                    aria-label={`Guardian ${index + 1} name`}
                  />
                  <Input
                    type="text"
                    value={guardian.relation}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        guardians: prev.guardians.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, relation: e.target.value } : item,
                        ),
                      }))
                    }
                    placeholder="Relation, e.g. Uncle"
                    aria-label={`Guardian ${index + 1} relation`}
                  />
                </div>
              ))}
              {guardianError ? <p className="text-sm text-red-600">{guardianError}</p> : null}
            </div>
          </>
        ) : null}
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
