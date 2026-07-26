"use client";

import React from "react";
import {
  IClass,
  getClassEnrolledCount,
  getClassTeacherList,
  type ClassTeacherRef,
} from "@/types/class";
import { formatClassScheduleSummary } from "@/lib/class-validation";
import { Clock } from "lucide-react";

export function ClassCapacityLabel({ klass }: { klass: Partial<IClass> }) {
  return <span>{getClassEnrolledCount(klass)}</span>;
}

type ClassDetailViewProps = {
  classItem: IClass;
  getTeacherDisplayName: (ref: ClassTeacherRef) => string;
};

export function ClassDetailView({
  classItem,
  getTeacherDisplayName,
}: ClassDetailViewProps) {
  const teachers = getClassTeacherList(classItem)
    .map((t) => getTeacherDisplayName(t))
    .join(", ");
  const schedule = formatClassScheduleSummary(classItem);
  const enrolled = getClassEnrolledCount(classItem);

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Branch",
      value: classItem.branch ? `Branch ${classItem.branch}` : "—",
    },
    { label: "Academic year", value: classItem.academicYear || "—" },
    { label: "Teachers", value: teachers || "—" },
    { label: "Students enrolled", value: enrolled },
    {
      label: "Maximum class capacity",
      value: classItem.sessionCapacity ?? "—",
    },
    {
      label: "Schedule defaults",
      value: schedule ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {schedule}
        </span>
      ) : (
        "—"
      ),
    },
    { label: "Notes", value: classItem.notes || "—" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {classItem.name}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">Class details</p>
      </div>
      <dl className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-3 gap-2 px-3 py-2.5 text-sm bg-white"
          >
            <dt className="col-span-1 text-gray-500">{row.label}</dt>
            <dd className="col-span-2 text-gray-900 min-w-0 break-words">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
