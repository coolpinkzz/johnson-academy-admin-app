"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/services/course";
import { useAddSingleStudentToClass, useClasses } from "@/services/class";
import type { Course } from "@/types/course";
import {
  CLASS_BRANCHES,
  formatClassBranchLabel,
  getClassDocumentId,
  getClassEnrolledCount,
  getClassTeacherList,
  type IClass,
} from "@/types/class";
import { formatClassScheduleSummary } from "@/lib/class-validation";

type AssignClassStepProps = {
  studentId: string;
  studentName: string;
  courseId?: string;
  courseName?: string;
  onDone: () => void;
  onSkip: () => void;
};

function courseOptionId(course: Course): string {
  return course.id || course._id || "";
}

function teacherLabel(klass: IClass): string {
  const teachers = getClassTeacherList(klass);
  if (teachers.length === 0) return "No teacher assigned";
  return teachers
    .map((teacher) => (typeof teacher === "string" ? "Teacher" : teacher.name))
    .join(", ");
}

export function AssignClassStep({
  studentId,
  studentName,
  courseId,
  courseName,
  onDone,
  onSkip,
}: AssignClassStepProps) {
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [pickedCourseId, setPickedCourseId] = useState(courseId ?? "");
  const [showAllClasses, setShowAllClasses] = useState(false);
  const addToClass = useAddSingleStudentToClass();
  const { data: coursesData, isLoading: isLoadingCourses } = useCourses();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const enrollmentCourseId = courseId || pickedCourseId;
  const { data, isLoading, isFetching } = useClasses(
    {
      courseId: showAllClasses ? undefined : enrollmentCourseId || undefined,
      branch: branch || undefined,
      name: debouncedSearch || undefined,
      limit: 100,
    },
    { enabled: Boolean(enrollmentCourseId) },
  );

  const classes = useMemo(
    () =>
      (data?.results ?? []).filter(
        (klass) => klass.status !== "archived" && klass.status !== "inactive",
      ),
    [data?.results],
  );

  const courseOptions = useMemo(
    () =>
      (coursesData?.results ?? [])
        .map((course) => ({
          id: courseOptionId(course),
          name: course.instrument
            ? `${course.name} · ${course.instrument}`
            : course.name,
        }))
        .filter((course) => course.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [coursesData?.results],
  );

  const selectedClass = classes.find(
    (klass) => getClassDocumentId(klass) === selectedClassId,
  );

  const handleAdd = () => {
    const classId = getClassDocumentId(selectedClass ?? {});
    if (!classId || !enrollmentCourseId) return;
    addToClass.mutate(
      { classId, studentId, courseId: enrollmentCourseId },
      { onSuccess: onDone },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Add {studentName} to a class
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {courseName
            ? `Classes for ${courseName}. Pick one to finish enrollment.`
            : "Choose the course, then the class this student should join."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {courseId ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Course</p>
            <p className="text-sm font-medium text-gray-900">{courseName}</p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="enroll-course"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Course
            </label>
            <select
              id="enroll-course"
              value={pickedCourseId}
              onChange={(event) => {
                setPickedCourseId(event.target.value);
                setSelectedClassId("");
              }}
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">
                {isLoadingCourses ? "Loading courses…" : "Select a course"}
              </option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label
            htmlFor="enroll-branch"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Branch
          </label>
          <select
            id="enroll-branch"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">All branches</option>
            {CLASS_BRANCHES.map((item) => (
              <option key={item} value={item}>
                {formatClassBranchLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="enroll-class-search"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Search class
          </label>
          <input
            id="enroll-class-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Class name"
            className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
          />
        </div>
      </div>

      {enrollmentCourseId ? (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showAllClasses}
            onChange={(event) => {
              setShowAllClasses(event.target.checked);
              setSelectedClassId("");
            }}
            className="h-4 w-4 rounded border-gray-300"
          />
          Show classes for every course
        </label>
      ) : null}

      <div className="max-h-[22rem] overflow-y-auto pr-1">
        {!enrollmentCourseId ? (
          <p className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            Select a course to see its classes.
          </p>
        ) : isLoading || isFetching ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            Loading classes…
          </p>
        ) : classes.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            No active classes match these filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {classes.map((klass) => {
              const id = getClassDocumentId(klass) ?? "";
              const selected = id === selectedClassId;
              const schedule = formatClassScheduleSummary(klass);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedClassId(id)}
                  aria-pressed={selected}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selected
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900">{klass.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {klass.branch
                      ? formatClassBranchLabel(klass.branch)
                      : "No branch"}
                    {klass.academicYear ? ` · ${klass.academicYear}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{teacherLabel(klass)}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {schedule ?? "Schedule not set"}
                    {" · "}
                    {getClassEnrolledCount(klass)} students
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="outline" onClick={onSkip} disabled={addToClass.isPending}>
          Skip for now
        </Button>
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!selectedClassId || !enrollmentCourseId || addToClass.isPending}
        >
          {addToClass.isPending ? "Adding…" : "Add to class"}
        </Button>
      </div>
    </div>
  );
}
