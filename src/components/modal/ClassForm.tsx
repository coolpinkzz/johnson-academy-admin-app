"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ClassFormData,
  IClass,
  getClassTeacherList,
  getClassDocumentId,
  classTeacherRefId,
} from "@/types/class";
import { getTeachers } from "@/services/teacher";
import { createClass, updateClass } from "@/services/class";
import { useModal } from "../modal";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/user";
import { Search } from "lucide-react";

interface ClassFormProps {
  onSubmit?: (data: Partial<IClass>) => void;
  onCancel?: () => void;
  initialData?: Partial<IClass>;
  submitLabel?: string;
  cancelLabel?: string;
}

function teacherIdsFromInitial(initialData: Partial<IClass>): string[] {
  return getClassTeacherList(initialData).map((t) => classTeacherRefId(t));
}

function TeacherAvatar({
  name,
  profilePicture,
  size = "md",
}: {
  name: string;
  profilePicture?: string | null;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-6 w-6 text-[10px]" : "h-10 w-10 text-sm";
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  if (profilePicture) {
    return (
      <img
        src={profilePicture}
        alt=""
        className={`${box} shrink-0 rounded-full object-cover bg-gray-100`}
      />
    );
  }
  return (
    <div
      className={`${box} shrink-0 rounded-full bg-blue-600 flex items-center justify-center font-medium text-white`}
    >
      {initial}
    </div>
  );
}

export function ClassForm({
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel,
  cancelLabel = "Cancel",
}: ClassFormProps) {
  const { closeModal } = useModal();
  const queryClient = useQueryClient();
  const classId = getClassDocumentId(initialData);
  const isEdit = Boolean(classId);

  const [formData, setFormData] = useState<ClassFormData>(() => ({
    name: initialData.name || "",
    teachers: teacherIdsFromInitial(initialData),
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");

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
    void fetchTeachers();
  }, []);

  /** Full list when search is empty; filtered by name/email when typing. */
  const displayedTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) {
      return teachers;
    }
    return teachers.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const email = (t.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [teachers, teacherSearch]);

  const selectedTeacherUsers = useMemo(
    () =>
      formData.teachers
        .map((id) => teachers.find((t) => t._id === id))
        .filter((t): t is User => t != null),
    [formData.teachers, teachers],
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    }

    if (!formData.teachers.length) {
      newErrors.teachers = "Select at least one teacher";
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
      const payload = {
        name: formData.name,
        teachers: formData.teachers,
      };

      if (isEdit && classId) {
        await updateClass(classId, payload);
      } else {
        await createClass(payload);
      }

      onSubmit?.(payload);

      queryClient.invalidateQueries({ queryKey: ["classes"] });

      closeModal();
    } catch (error) {
      console.error("Error saving class:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setFormData((prev) => {
      const has = prev.teachers.includes(teacherId);
      const teachers = has
        ? prev.teachers.filter((id) => id !== teacherId)
        : [...prev.teachers, teacherId];
      return { ...prev, teachers };
    });
    if (errors.teachers) {
      setErrors((prev) => ({ ...prev, teachers: "" }));
    }
  };

  const handleCancel = () => {
    onCancel?.();
    closeModal();
  };

  const defaultSubmitLabel = isEdit ? "Update Class" : "Create Class";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter class name"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teachers *{" "}
          <span className="font-normal text-gray-500">(one or more)</span>
        </label>

        {selectedTeacherUsers.length > 0 ? (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-1.5">Selected</p>
            <div className="flex flex-wrap gap-2">
              {selectedTeacherUsers.map((teacher) => (
                <span
                  key={teacher._id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-900 border border-blue-100 pl-1 pr-1 py-0.5 text-sm max-w-full"
                >
                  <TeacherAvatar
                    name={teacher.name}
                    profilePicture={teacher.profilePicture}
                    size="sm"
                  />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="max-w-[160px] truncate">
                      {teacher.name}
                    </span>
                    {teacher.email ? (
                      <span className="max-w-[160px] truncate text-[10px] text-blue-700/80 font-normal">
                        {teacher.email}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleTeacher(teacher._id)}
                    className="rounded-full p-0.5 hover:bg-blue-100 text-blue-700 leading-none"
                    aria-label={`Remove ${teacher.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            placeholder="Search to filter teachers by name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingTeachers}
            autoComplete="off"
          />
        </div>

        <div
          className={`max-h-52 overflow-y-auto rounded-md border p-2 space-y-2 ${
            errors.teachers ? "border-red-500" : "border-gray-300"
          }`}
        >
          {isLoadingTeachers ? (
            <p className="text-sm text-gray-500 py-2">Loading teachers...</p>
          ) : teachers.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No teachers available</p>
          ) : displayedTeachers.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">
              {teacherSearch.trim()
                ? `No teachers match "${teacherSearch.trim()}"`
                : "No teachers available."}
            </p>
          ) : (
            displayedTeachers.map((teacher) => (
              <label
                key={teacher._id}
                className="flex items-center gap-3 cursor-pointer text-sm text-gray-800 py-1.5 px-1 rounded-md hover:bg-gray-50 has-[:focus-visible]:bg-gray-50"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 shrink-0"
                  checked={formData.teachers.includes(teacher._id)}
                  onChange={() => toggleTeacher(teacher._id)}
                />
                <TeacherAvatar
                  name={teacher.name}
                  profilePicture={teacher.profilePicture}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-medium text-gray-900 truncate">
                    {teacher.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {teacher.email || "—"}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
        {errors.teachers && (
          <p className="text-sm text-red-600 mt-1">{errors.teachers}</p>
        )}
      </div>

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
          {isSubmitting ? "Saving..." : (submitLabel ?? defaultSubmitLabel)}
        </Button>
      </div>
    </form>
  );
}
