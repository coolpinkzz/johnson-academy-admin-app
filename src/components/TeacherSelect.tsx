"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { User } from "@/types/user";

interface TeacherSelectProps {
  value: string;
  onChange: (teacherId: string) => void;
  teachers: User[];
  isLoading?: boolean;
  error?: Error | null;
  label?: string;
  disabled?: boolean;
}

function getTeacherId(teacher: User): string {
  return teacher._id || teacher.id;
}

function UserAvatar({
  name,
  profilePicture,
  size = "md",
}: {
  name: string;
  profilePicture?: string | null;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-sm";
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

export function TeacherSelect({
  value,
  onChange,
  teachers,
  isLoading = false,
  error = null,
  label = "Teacher",
  disabled = false,
}: TeacherSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTeacher = teachers.find(
    (teacher) => getTeacherId(teacher) === value,
  );

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

  const isDisabled = disabled || isLoading || Boolean(error);

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
              <span className="text-sm text-gray-500">Loading teachers...</span>
            </>
          ) : error ? (
            <span className="text-sm text-red-500">Error loading teachers</span>
          ) : selectedTeacher ? (
            <>
              <UserAvatar
                name={selectedTeacher.name}
                profilePicture={selectedTeacher.profilePicture}
              />
              <span className="text-sm font-medium text-gray-900 truncate">
                {selectedTeacher.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Select a teacher</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg max-h-64 overflow-y-auto">
          {teachers.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">No teachers available</p>
          ) : (
            teachers.map((teacher) => {
              const teacherId = getTeacherId(teacher);
              const isSelected = teacherId === value;

              return (
                <button
                  key={teacherId}
                  type="button"
                  onClick={() => {
                    onChange(teacherId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <UserAvatar
                    name={teacher.name}
                    profilePicture={teacher.profilePicture}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {teacher.name}
                    </span>
                    {teacher.email ? (
                      <span className="text-xs text-gray-500 truncate">
                        {teacher.email}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
