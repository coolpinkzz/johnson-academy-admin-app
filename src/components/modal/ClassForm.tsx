"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ClassFormData,
  IClass,
  CLASS_WEEKDAYS,
  CLASS_BRANCHES,
  ClassWeekday,
  getClassDocumentId,
} from "@/types/class";
import { getTeachers } from "@/services/teacher";
import { createClass, updateClass } from "@/services/class";
import { useModal } from "../modal";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/user";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import {
  classFormSchema,
  classToFormValues,
  toClassApiPayload,
  zodErrorsToRecord,
} from "@/lib/class-validation";

interface ClassFormProps {
  onSubmit?: (data: ClassFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<IClass>;
  submitLabel?: string;
  cancelLabel?: string;
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-gray-100 pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-600 mt-1">{message}</p>;
}

const inputClass = (hasError?: boolean) =>
  `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;

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

  const [formData, setFormData] = useState<ClassFormData>(() =>
    classToFormValues(initialData),
  );
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

  const displayedTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
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

  const updateField = <K extends keyof ClassFormData>(
    key: K,
    value: ClassFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setFormData((prev) => {
      const has = prev.teachers.includes(teacherId);
      const nextTeachers = has
        ? prev.teachers.filter((id) => id !== teacherId)
        : [...prev.teachers, teacherId];
      return { ...prev, teachers: nextTeachers };
    });
    if (errors.teachers) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.teachers;
        return next;
      });
    }
  };

  const toggleWeekday = (day: ClassWeekday) => {
    setFormData((prev) => {
      const has = prev.defaultWeekdays.includes(day);
      const defaultWeekdays = has
        ? prev.defaultWeekdays.filter((d) => d !== day)
        : [...prev.defaultWeekdays, day];
      return { ...prev, defaultWeekdays };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = classFormSchema.safeParse({
      name: formData.name,
      teachers: formData.teachers,
      branch: formData.branch ?? "",
      academicYear: formData.academicYear ?? "",
      notes: formData.notes ?? "",
      defaultStartTime: formData.defaultStartTime ?? "",
      defaultEndTime: formData.defaultEndTime ?? "",
      sessionCapacity: formData.sessionCapacity ?? "",
      defaultWeekdays: formData.defaultWeekdays,
    });

    if (!result.success) {
      setErrors(zodErrorsToRecord(result.error));
      return;
    }

    const payload = toClassApiPayload(result.data);
    if (isEdit) {
      if (result.data.defaultStartTime && result.data.defaultEndTime) {
        payload.defaultStartTime = result.data.defaultStartTime;
        payload.defaultEndTime = result.data.defaultEndTime;
      }
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      if (isEdit && classId) {
        await updateClass(classId, payload);
        toast.success("Class updated successfully");
      } else {
        await createClass(payload);
        toast.success("Class created successfully");
      }

      onSubmit?.(payload);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      closeModal();
    } catch (error) {
      const ax = error as AxiosError<{ message?: string }>;
      const message =
        ax.response?.data?.message || "Failed to save class. Please try again.";
      toast.error(message);
      setErrors((prev) => ({ ...prev, _form: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    closeModal();
  };

  const defaultSubmitLabel = isEdit ? "Update Class" : "Create Class";

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {errors._form ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-3">
          {errors._form}
        </div>
      ) : null}

      <Section title="Basics">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputClass(Boolean(errors.name))}
            placeholder="Enter class name"
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teachers *{" "}
            <span className="font-normal text-gray-500">(one or more)</span>
          </label>

          {selectedTeacherUsers.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Selected
              </p>
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
            className={`max-h-40 overflow-y-auto rounded-md border p-2 space-y-2 ${
              errors.teachers ? "border-red-500" : "border-gray-300"
            }`}
          >
            {isLoadingTeachers ? (
              <p className="text-sm text-gray-500 py-2">Loading teachers...</p>
            ) : teachers.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                No teachers available
              </p>
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
                  className="flex items-center gap-3 cursor-pointer text-sm text-gray-800 py-1.5 px-1 rounded-md hover:bg-gray-50"
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
          <FieldError message={errors.teachers} />
        </div>
      </Section>

      <Section title="Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={formData.branch ?? ""}
              onChange={(e) =>
                updateField("branch", e.target.value || undefined)
              }
              className={inputClass(Boolean(errors.branch))}
            >
              <option value="">—</option>
              {CLASS_BRANCHES.map((b) => (
                <option key={b} value={b}>
                  Branch {b}
                </option>
              ))}
            </select>
            <FieldError message={errors.branch} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic year
            </label>
            <input
              type="text"
              value={formData.academicYear ?? ""}
              onChange={(e) => updateField("academicYear", e.target.value)}
              className={inputClass(Boolean(errors.academicYear))}
              placeholder="e.g. 2025-26"
            />
            <FieldError message={errors.academicYear} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes ?? ""}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={2}
            className={inputClass(Boolean(errors.notes))}
            placeholder="Internal notes"
          />
          <FieldError message={errors.notes} />
        </div>
      </Section>

      <Section title="Capacity">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum class capacity
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={formData.sessionCapacity ?? ""}
            onChange={(e) =>
              updateField(
                "sessionCapacity",
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
            className={inputClass(Boolean(errors.sessionCapacity))}
            placeholder="e.g. 12"
          />
          <FieldError message={errors.sessionCapacity} />
        </div>
      </Section>

      <Section
        title="Schedule defaults"
        description="Defaults for future sessions — not live booking inventory."
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Default weekdays
          </label>
          <div className="flex flex-wrap gap-2">
            {CLASS_WEEKDAYS.map((day) => {
              const active = formData.defaultWeekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <FieldError message={errors.defaultWeekdays} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start time
            </label>
            <input
              type="time"
              value={formData.defaultStartTime ?? ""}
              onChange={(e) =>
                updateField("defaultStartTime", e.target.value || undefined)
              }
              className={inputClass(Boolean(errors.defaultStartTime))}
            />
            <FieldError message={errors.defaultStartTime} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End time
            </label>
            <input
              type="time"
              value={formData.defaultEndTime ?? ""}
              onChange={(e) =>
                updateField("defaultEndTime", e.target.value || undefined)
              }
              className={inputClass(Boolean(errors.defaultEndTime))}
            />
            <FieldError message={errors.defaultEndTime} />
          </div>
        </div>
      </Section>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
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
