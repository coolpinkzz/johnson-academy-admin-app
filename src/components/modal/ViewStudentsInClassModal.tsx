"use client";

import React, { useState } from "react";
import { User as UserIcon, Trash2 } from "lucide-react";
import { IStudentInClass } from "@/types/class";
import { useRemoveStudentFromClass } from "@/services/class";
import { useModal } from "@/components/modal";

interface ViewStudentsInClassModalProps {
  classId: string;
  students: IStudentInClass[];
}

export function ViewStudentsInClassModal({
  classId,
  students: initialStudents,
}: ViewStudentsInClassModalProps) {
  const { closeModal } = useModal();
  const [students, setStudents] = useState(initialStudents);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(
    null
  );
  const { mutateAsync: removeStudent } = useRemoveStudentFromClass();

  const handleRemove = async (studentId: string) => {
    setRemovingStudentId(studentId);
    try {
      await removeStudent({ classId, studentId });
      setStudents((prev) => prev.filter((s) => (s.user._id || s.user.id) !== studentId));
      if (students.length <= 1) {
        closeModal();
      }
    } catch {
      // Keep list as-is on error
    } finally {
      setRemovingStudentId(null);
    }
  };

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {students.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No students in this class yet.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {students.map((student) => {
            const studentId = student.user._id || student.user.id;
            const isRemoving = removingStudentId === studentId;
            return (
              <li
                key={student._id || studentId}
                className="py-3 flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {student.user.profilePicture ? (
                    <img
                      src={student.user.profilePicture}
                      alt={student.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {student.user.name}
                  </p>
                  <p className="text-xs text-gray-500">{student.course.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(studentId)}
                  disabled={isRemoving}
                  className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove from class"
                >
                  {isRemoving ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
