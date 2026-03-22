"use client";

import { useModal } from "@/hooks/use-modal";
import { deleteClass } from "@/services/class";
import { IClass, IStudentInClass } from "@/types/class";
import { User } from "@/types/user";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback } from "react";
import { AddSingleStudentToClassModal } from "./AddSingleStudentToClassModal";
import { BulkAddStudentsModal } from "./BulkAddStudentsModal";
import { ClassForm } from "./ClassForm";
import { ViewStudentsInClassModal } from "./ViewStudentsInClassModal";
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
      const students: IStudentInClass[] = classItem.studentsInClass.filter(
        (s: unknown): s is IStudentInClass =>
          typeof s === "object" && s != null && "user" in s,
      );
      openModal({
        title: `Students - ${classItem.name}`,
        content: (
          <ViewStudentsInClassModal
            classId={classItem.id || ""}
            students={students}
          />
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
