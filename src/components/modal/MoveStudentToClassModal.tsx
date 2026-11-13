"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Search, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/modal";
import {
  ClassTeacherRef,
  getClassDocumentId,
  getClassTeacherList,
  IClass,
} from "@/types/class";
import { useClasses, useTransferStudentToClass } from "@/services/class";

type Props = {
  fromClassId: string;
  studentId: string;
  studentName: string;
  courseNames: string[];
  onSuccess?: () => void;
};

type TeacherDisplay = {
  name: string;
  profilePicture?: string | null;
};

function TeacherAvatar({
  name,
  profilePicture,
}: {
  name: string;
  profilePicture?: string | null;
}) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  if (profilePicture) {
    return (
      <img
        src={profilePicture}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover bg-gray-100"
      />
    );
  }

  return (
    <div className="h-8 w-8 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white">
      {initial}
    </div>
  );
}

function resolveTeacher(ref: ClassTeacherRef): TeacherDisplay | null {
  if (typeof ref === "string") {
    return { name: "Teacher" };
  }
  if (ref != null && typeof ref === "object" && "name" in ref) {
    return {
      name: ref.name || "Teacher",
      profilePicture: ref.profilePicture,
    };
  }
  return null;
}

function getTeachersForClass(klass: IClass): TeacherDisplay[] {
  return getClassTeacherList(klass)
    .map(resolveTeacher)
    .filter((t): t is TeacherDisplay => t != null);
}

export function MoveStudentToClassModal({
  fromClassId,
  studentId,
  studentName,
  courseNames,
  onSuccess,
}: Props) {
  const { closeModal, closeAllModals, activeModals } = useModal();
  const [targetClassId, setTargetClassId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const transferMutation = useTransferStudentToClass();

  const { data: classesData, isLoading: isClassesLoading } = useClasses({
    page: 1,
    limit: 200,
  });

  const targetClasses = useMemo(() => {
    const results = classesData?.results ?? [];
    return results.filter((klass) => getClassDocumentId(klass) !== fromClassId);
  }, [classesData?.results, fromClassId]);

  const selectedClass = useMemo(
    () =>
      targetClasses.find(
        (klass) => getClassDocumentId(klass) === targetClassId,
      ),
    [targetClasses, targetClassId],
  );

  const filteredClasses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return targetClasses;

    return targetClasses.filter((klass) => {
      const name = (klass.name || "").toLowerCase();
      const teacherNames = getTeachersForClass(klass)
        .map((t) => t.name.toLowerCase())
        .join(" ");
      return name.includes(query) || teacherNames.includes(query);
    });
  }, [targetClasses, searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    requestAnimationFrame(() => searchInputRef.current?.focus());

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCancel = () => {
    const topModal = activeModals[activeModals.length - 1];
    if (topModal?.id) {
      closeModal(topModal.id);
      return;
    }
    closeModal();
  };

  const handleSubmit = () => {
    if (!fromClassId || !studentId || !targetClassId) return;

    transferMutation.mutate(
      { fromClassId, studentId, targetClassId },
      {
        onSuccess: () => {
          onSuccess?.();
          closeAllModals();
        },
      },
    );
  };

  const closeAndSelect = (classId: string) => {
    setTargetClassId(classId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const isDisabled = isClassesLoading || transferMutation.isPending;
  const selectedTeachers = selectedClass
    ? getTeachersForClass(selectedClass)
    : [];
  const primaryTeacher = selectedTeachers[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Move {studentName}
        </h3>
        <p className="text-sm text-gray-600">
          All courses, progress, attendance, and monthly reports will move with
          this student to the selected class.
        </p>
        {courseNames.length > 0 ? (
          <p className="text-sm text-gray-500 mt-2">
            Courses: {courseNames.join(", ")}
          </p>
        ) : null}
      </div>

      <div ref={containerRef} className="relative space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="targetClass">
          Target class
        </label>
        <button
          id="targetClass"
          type="button"
          onClick={() => !isDisabled && setIsOpen((open) => !open)}
          disabled={isDisabled}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 min-w-0">
            {isClassesLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">Loading classes...</span>
              </>
            ) : selectedClass ? (
              <>
                {primaryTeacher ? (
                  <TeacherAvatar
                    name={primaryTeacher.name}
                    profilePicture={primaryTeacher.profilePicture}
                  />
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                  </div>
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {selectedClass.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {selectedTeachers.length > 0
                      ? selectedTeachers.map((t) => t.name).join(", ")
                      : "No teachers"}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Select a class...</span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && !isDisabled ? (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Search by class or teacher…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {targetClasses.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-500">
                  No other classes available
                </p>
              ) : filteredClasses.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-500">
                  No classes match &quot;{searchTerm.trim()}&quot;
                </p>
              ) : (
                filteredClasses.map((klass) => {
                  const classId = getClassDocumentId(klass) || "";
                  const teachers = getTeachersForClass(klass);
                  const teacher = teachers[0];
                  const isSelected = classId === targetClassId;

                  return (
                    <button
                      key={classId}
                      type="button"
                      onClick={() => closeAndSelect(classId)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      {teacher ? (
                        <TeacherAvatar
                          name={teacher.name}
                          profilePicture={teacher.profilePicture}
                        />
                      ) : (
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {klass.name}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {teachers.length > 0
                            ? teachers.map((t) => t.name).join(", ")
                            : "No teachers"}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={transferMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={transferMutation.isPending || !targetClassId}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {transferMutation.isPending ? "Moving..." : "Move Student"}
        </Button>
      </div>
    </div>
  );
}
