"use client";

import { useModal } from "@/hooks/use-modal";
import { deleteClass } from "@/services/class";
import { IClass, IStudentInClass } from "@/types/class";
import { User } from "@/types/user";
import { useQueryClient } from "@tanstack/react-query";
import { User as UserIcon } from "lucide-react";
import React, { useCallback } from "react";
import { AddSingleStudentToClassModal } from "./AddSingleStudentToClassModal";
import { BulkAddStudentsModal } from "./BulkAddStudentsModal";
import { ClassForm } from "./ClassForm";
import { DeleteConfirmation } from "./ConfirmationDialog";

export type ClassModalsHandlers = {
  handleClassForm: () => void;
  handleBulkAddStudents: (classItem: IClass) => void;
  handleAddStudent: (classItem: IClass) => void;
  handleViewStudents: (classItem: IClass) => void;
  handleDeleteClass: (classId: string, className: string) => void;
};

export function useClassModals(): ClassModalsHandlers {
  const { openModal, closeModal } = useModal();
  const queryClient = useQueryClient();

  const handleClassForm = useCallback(() => {
    openModal({
      title: "Create Class",
      content: <ClassForm />,
    });
  }, [openModal]);

  const handleBulkAddStudents = useCallback(
    (classItem: IClass) => {
      const raw = classItem.students || [];
      const existingStudentIds: string[] = raw.map((s) =>
        typeof s === "string" ? s : (s as User)._id || (s as User).id,
      );
      openModal({
        title: "Add Students to Class",
        content: (
          <BulkAddStudentsModal
            classId={classItem.id || ""}
            className={classItem.name}
            existingStudentIds={existingStudentIds}
          />
        ),
      });
    },
    [openModal],
  );

  const handleAddStudent = useCallback(
    (classItem: IClass) => {
      const raw = classItem.students || [];
      const existingStudentIds: string[] = raw.map((s) =>
        typeof s === "string" ? s : (s as User)._id || (s as User).id,
      );

      const defaultCourseId =
        typeof classItem.courseId === "string"
          ? classItem.courseId
          : (classItem.courseId as any)?._id || (classItem.courseId as any)?.id;

      openModal({
        title: "Add Student",
        content: (
          <AddSingleStudentToClassModal
            classId={classItem.id || ""}
            className={classItem.name}
            existingStudentIds={existingStudentIds}
            defaultCourseId={defaultCourseId}
          />
        ),
        size: "md",
      });
    },
    [openModal],
  );

  const handleViewStudents = useCallback(
    (classItem: IClass) => {
      const raw = Array.isArray(classItem.students) ? classItem.students : [];
      const students: IStudentInClass[] = classItem.studentsInClass.filter(
        (s: unknown): s is IStudentInClass =>
          typeof s === "object" && s != null && "user" in s,
      );
      openModal({
        title: `Students - ${classItem.name}`,
        content: (
          <div className="max-h-[60vh] overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No students in this class yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {students.map((student) => (
                  <li
                    key={student._id || student.user._id}
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
                      <p className="text-xs text-gray-500">
                        {student.course.name}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ),
        size: "md",
      });
    },
    [openModal],
  );

  const handleDeleteClass = useCallback(
    (classId: string, className: string) => {
      openModal({
        title: "Confirm Deletion",
        content: (
          <DeleteConfirmation
            itemName={className}
            onConfirm={async () => {
              await deleteClass(classId);
              closeModal("");
              queryClient.invalidateQueries({ queryKey: ["classes"] });
            }}
            onCancel={() => closeModal("")}
          />
        ),
        size: "md",
        showCloseButton: false,
        closeOnOverlayClick: true,
        closeOnEscape: false,
      });
    },
    [openModal, closeModal, queryClient],
  );

  return {
    handleClassForm,
    handleBulkAddStudents,
    handleAddStudent,
    handleViewStudents,
    handleDeleteClass,
  };
}
