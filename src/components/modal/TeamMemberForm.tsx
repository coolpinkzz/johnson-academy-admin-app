"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal";
import { createTeamMember, CreateTeamMemberPayload } from "@/services/team";
import { STAFF_ROLE_LABELS, STAFF_ROLES, StaffRole } from "@/lib/rbac";
import { STUDENT_BRANCHES } from "@/services/student";
import { Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

interface FormState {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  department: string;
  phoneNumber: string;
  branchAccess: number[];
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const PHONE_PATTERN = /^\+?[\d\s-()]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const needsBranchAccess = (role: StaffRole) =>
  role === "admin" || role === "aqsd";

interface TeamMemberFormProps {
  submitLabel?: string;
}

export function TeamMemberForm({
  submitLabel = "Add team member",
}: TeamMemberFormProps) {
  const { closeModal } = useModal();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    role: "admin",
    department: "General",
    phoneNumber: "",
    branchAccess: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const next: FormErrors = {};

    if (!formData.name.trim()) next.name = "Name is required";
    if (!formData.email.trim()) {
      next.email = "Email is required";
    } else if (!EMAIL_PATTERN.test(formData.email)) {
      next.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      next.password = "Password is required";
    } else if (!PASSWORD_PATTERN.test(formData.password)) {
      next.password =
        "Password must be at least 8 characters and include a letter and a number";
    }

    if (!formData.department.trim()) {
      next.department = "Department is required";
    }

    if (formData.phoneNumber && !PHONE_PATTERN.test(formData.phoneNumber)) {
      next.phoneNumber = "Please enter a valid phone number";
    }

    if (needsBranchAccess(formData.role) && formData.branchAccess.length === 0) {
      next.branchAccess = "Select at least one branch";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateTeamMemberPayload) => createTeamMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member created");
      closeModal();
    },
    onError: (error) => {
      const ax = error as AxiosError<{ message?: string }>;
      toast.error(
        ax.response?.data?.message ||
          (error instanceof Error ? error.message : null) ||
          "Failed to create team member",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: CreateTeamMemberPayload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      department: formData.department.trim(),
      ...(formData.phoneNumber.trim()
        ? { phoneNumber: formData.phoneNumber.trim() }
        : {}),
      ...(needsBranchAccess(formData.role)
        ? { branchAccess: formData.branchAccess }
        : {}),
      isActive: true,
    };

    mutation.mutate(payload);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const toggleBranch = (branch: number) => {
    setFormData((prev) => {
      const has = prev.branchAccess.includes(branch);
      return {
        ...prev,
        branchAccess: has
          ? prev.branchAccess.filter((b) => b !== branch)
          : [...prev.branchAccess, branch].sort((a, b) => a - b),
      };
    });
    if (errors.branchAccess) {
      setErrors((prev) => ({ ...prev, branchAccess: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Full name"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="email@example.com"
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setField("password", e.target.value)}
            placeholder="Min 8 chars, letter + number"
            className={errors.password ? "border-red-500 pr-10" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <select
          value={formData.role}
          onChange={(e) => setField("role", e.target.value as StaffRole)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STAFF_ROLES.map((role) => (
            <option key={role} value={role}>
              {STAFF_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>

      {needsBranchAccess(formData.role) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branch access *
          </label>
          <div className="flex flex-wrap gap-3">
            {STUDENT_BRANCHES.map((branch) => {
              const value = Number(branch);
              const checked = formData.branchAccess.includes(value);
              return (
                <label
                  key={branch}
                  className="inline-flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBranch(value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Branch {branch}
                </label>
              );
            })}
          </div>
          {errors.branchAccess && (
            <p className="text-sm text-red-600 mt-1">{errors.branchAccess}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Students whose roll numbers belong to these branches will be visible.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department *
        </label>
        <Input
          value={formData.department}
          onChange={(e) => setField("department", e.target.value)}
          placeholder="e.g. General"
          className={errors.department ? "border-red-500" : ""}
        />
        {errors.department && (
          <p className="text-sm text-red-600 mt-1">{errors.department}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <Input
          value={formData.phoneNumber}
          onChange={(e) => setField("phoneNumber", e.target.value)}
          placeholder="Optional"
          className={errors.phoneNumber ? "border-red-500" : ""}
        />
        {errors.phoneNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => closeModal()}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
