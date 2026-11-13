"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, Clock, Loader2, Users } from "lucide-react";
import { IClassByTeacher } from "@/types/class";

interface ClassSelectProps {
  value: string;
  onChange: (classId: string) => void;
  classes: IClassByTeacher[];
  isLoading?: boolean;
  error?: Error | null;
  label?: string;
  disabled?: boolean;
  noTeacherSelected?: boolean;
}

function getStudentCount(classItem: IClassByTeacher): number {
  return classItem.students?.length ?? classItem.studentsInClass?.length ?? 0;
}

function formatSchedule(classItem: IClassByTeacher): string | null {
  const days = classItem.classesInOneWeek?.join(", ");
  const time =
    classItem.startTime && classItem.endTime
      ? `${classItem.startTime} – ${classItem.endTime}`
      : null;

  return [days, time].filter(Boolean).join(" · ") || null;
}

function ClassOptionDetails({ classItem }: { classItem: IClassByTeacher }) {
  const schedule = formatSchedule(classItem);
  const studentCount = getStudentCount(classItem);

  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-medium text-gray-900 truncate">
        {classItem.name}
      </span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
        {schedule ? (
          <span className="inline-flex items-center gap-1 truncate">
            <Clock className="h-3 w-3 shrink-0" />
            {schedule}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3 shrink-0" />
          {studentCount} student{studentCount === 1 ? "" : "s"}
        </span>
      </span>
    </span>
  );
}

export function ClassSelect({
  value,
  onChange,
  classes,
  isLoading = false,
  error = null,
  label = "Class",
  disabled = false,
  noTeacherSelected = false,
}: ClassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedClass = classes.find((classItem) => classItem.id === value);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isDisabled =
    disabled ||
    noTeacherSelected ||
    isLoading ||
    Boolean(error) ||
    classes.length === 0;

  const getPlaceholder = () => {
    if (noTeacherSelected) return "Select a teacher first";
    if (isLoading) return "Loading classes...";
    if (error) return "Error loading classes";
    if (classes.length === 0) return "No classes for this teacher";
    return "Select a class";
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen((open) => !open)}
        disabled={isDisabled}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2 min-w-0">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500">Loading classes...</span>
            </>
          ) : error ? (
            <span className="text-sm text-red-500">Error loading classes</span>
          ) : selectedClass ? (
            <>
              <ClassOptionDetails classItem={selectedClass} />
            </>
          ) : (
            <>
              <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-gray-400" />
              </div>
              <span className="text-sm text-gray-500">{getPlaceholder()}</span>
            </>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg max-h-72 overflow-y-auto">
          {classes.map((classItem) => {
            const isSelected = classItem.id === value;

            return (
              <button
                key={classItem.id}
                type="button"
                onClick={() => {
                  onChange(classItem.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                  isSelected ? "bg-blue-50" : ""
                }`}
              >
                <ClassOptionDetails classItem={classItem} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
