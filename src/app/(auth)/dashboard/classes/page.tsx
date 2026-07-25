"use client";

import { useClassModals } from "@/components/modal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getClasses } from "@/services/class";
import { getTeachers } from "@/services/teacher";
import {
  ClassResponse,
  GetClassesParams,
  CLASS_BRANCHES,
  getClassTeacherList,
  classTeacherRefId,
  getClassDocumentId,
  type ClassTeacherRef,
} from "@/types/class";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Users,
  BookOpen,
  User as UserIcon,
  Clock,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";
import { ClassCapacityLabel } from "@/components/ClassDetailView";
import { formatClassScheduleSummary } from "@/lib/class-validation";

function getClassNamePrefix(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";

  const slashIndex = trimmed.indexOf("/");
  return slashIndex === -1 ? trimmed : trimmed.slice(0, slashIndex);
}

type FilterState = {
  name: string;
  branch: string;
  academicYear: string;
  teacherId: string;
};

const EMPTY_FILTERS: FilterState = {
  name: "",
  branch: "",
  academicYear: "",
  teacherId: "",
};

function filtersToParams(filters: FilterState): GetClassesParams {
  const params: GetClassesParams = {};
  if (filters.name.trim()) params.name = filters.name.trim();
  if (filters.branch) params.branch = filters.branch;
  if (filters.academicYear.trim())
    params.academicYear = filters.academicYear.trim();
  if (filters.teacherId) params.teacherId = filters.teacherId;
  return params;
}

const ClassesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const {
    handleClassForm,
    handleEditClass,
    handleViewClass,
    handleAddStudent,
    handleViewStudents,
    handleDeleteClass,
  } = useClassModals();

  const queryParams = useMemo(
    () => filtersToParams(appliedFilters),
    [appliedFilters],
  );

  const {
    data: classesData,
    isLoading,
    error,
  } = useQuery<ClassResponse>({
    queryKey: ["classes", "list", queryParams],
    queryFn: () => getClasses(queryParams),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => getTeachers(),
  });

  const getTeacherDisplayName = useCallback(
    (ref: ClassTeacherRef) => {
      if (typeof ref === "object" && ref != null && "name" in ref) {
        return ref.name;
      }
      const id = classTeacherRefId(ref);
      const teacher = teachersData?.results?.find((t) => t?._id === id);
      return teacher?.name ?? "Teacher";
    },
    [teachersData],
  );

  const formatTeacherNames = (teacherRefs: ClassTeacherRef[]) => {
    const names = teacherRefs.map((t) => getTeacherDisplayName(t));
    if (names.length === 0) return "No teachers";
    return names.join(", ");
  };

  const resolveTeacherAvatar = useCallback(
    (ref: ClassTeacherRef) => {
      if (typeof ref === "object" && ref != null && "name" in ref) {
        return {
          id: classTeacherRefId(ref),
          src: ref.profilePicture,
          initial: ref.name?.charAt(0) ?? "?",
        };
      }
      const id = classTeacherRefId(ref);
      const teacher = teachersData?.results?.find((t) => t._id === id);
      return {
        id,
        src: teacher?.profilePicture,
        initial: teacher?.name?.charAt(0) ?? "?",
      };
    },
    [teachersData],
  );

  const TEACHER_STACK_MAX = 5;

  const classPrefixes = useMemo(() => {
    const prefixes = new Set<string>();

    for (const classItem of classesData?.results ?? []) {
      const prefix = getClassNamePrefix(classItem.name || "");
      if (prefix) {
        prefixes.add(prefix);
      }
    }

    return Array.from(prefixes).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }, [classesData?.results]);

  const filteredClasses = useMemo(() => {
    let list = classesData?.results ?? [];

    if (selectedPrefix) {
      list = list.filter(
        (classItem) =>
          getClassNamePrefix(classItem.name || "") === selectedPrefix,
      );
    }

    const query = searchTerm.trim().toLowerCase();
    if (!query) return list;

    return list.filter((classItem) => {
      const name = (classItem.name || "").toLowerCase();
      const teachers = getClassTeacherList(classItem)
        .map((t) => getTeacherDisplayName(t).toLowerCase())
        .join(" ");
      const instrument =
        typeof classItem.courseId === "string"
          ? ""
          : (classItem.courseId?.instrument || "").toLowerCase();

      return (
        name.includes(query) ||
        teachers.includes(query) ||
        instrument.includes(query)
      );
    });
  }, [classesData?.results, searchTerm, selectedPrefix, getTeacherDisplayName]);

  const hasServerFilters = Object.keys(queryParams).length > 0;
  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedPrefix || hasServerFilters,
  );

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setSearchTerm("");
    setSelectedPrefix(null);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">Loading classes...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-red-600">Error loading classes</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-auto sm:h-16 px-4 sm:px-6 py-4 border-b bg-white">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Classes
            </h1>
            <p className="text-sm text-gray-600">
              Manage class assignments and student enrollments
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
              onClick={handleClassForm}
            >
              <Plus className="h-4 w-4" />
              <span>Create Class</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto sm:py-6 sm:px-6 px-0 py-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick search on this page…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                  showFilters || hasServerFilters
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              {classPrefixes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {classPrefixes.map((prefix) => {
                    const isActive = selectedPrefix === prefix;

                    return (
                      <button
                        key={prefix}
                        type="button"
                        onClick={() =>
                          setSelectedPrefix((current) =>
                            current === prefix ? null : prefix,
                          )
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                          isActive
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                        )}
                      >
                        {prefix}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {showFilters ? (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={filters.name}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Filter by name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Branch
                    </label>
                    <select
                      value={filters.branch}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, branch: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All</option>
                      {CLASS_BRANCHES.map((b) => (
                        <option key={b} value={b}>
                          Branch {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Academic year
                    </label>
                    <input
                      type="text"
                      value={filters.academicYear}
                      onChange={(e) =>
                        setFilters((p) => ({
                          ...p,
                          academicYear: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="2025-26"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Teacher
                    </label>
                    <select
                      value={filters.teacherId}
                      onChange={(e) =>
                        setFilters((p) => ({
                          ...p,
                          teacherId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All</option>
                      {(teachersData?.results ?? []).map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {filteredClasses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredClasses.map((classItem) => {
                const teacherList = getClassTeacherList(classItem);
                const teachersLabel = formatTeacherNames(teacherList);
                const teacherAvatars = teacherList.map((t) =>
                  resolveTeacherAvatar(t),
                );
                const visibleAvatars = teacherAvatars.slice(
                  0,
                  TEACHER_STACK_MAX,
                );
                const overflowCount = teacherAvatars.length - TEACHER_STACK_MAX;
                const schedule = formatClassScheduleSummary(classItem);

                return (
                  <div
                    key={getClassDocumentId(classItem) ?? classItem.name}
                    className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col"
                  >
                    <div className="p-4 sm:p-6 flex-1">
                      <div className="flex items-center justify-between mb-4 gap-3">
                        <div className="flex min-w-0 flex-1 items-center">
                          {teacherAvatars.length === 0 ? (
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-medium text-blue-600"
                              title="No teachers"
                            >
                              ?
                            </div>
                          ) : (
                            <div className="flex items-center pr-1">
                              <div className="flex -space-x-2">
                                {visibleAvatars.map((a, index) => (
                                  <div
                                    key={a.id}
                                    className="relative inline-flex h-12 w-12 shrink-0 rounded-full bg-gray-100 ring-2 ring-white"
                                    style={{
                                      zIndex: visibleAvatars.length - index,
                                    }}
                                    title={getTeacherDisplayName(
                                      teacherList[index]!,
                                    )}
                                  >
                                    {a.src ? (
                                      <img
                                        src={a.src}
                                        alt=""
                                        className="h-full w-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="flex h-full w-full items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                                        {a.initial}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {overflowCount > 0 ? (
                                  <div
                                    className="relative z-50 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-800 ring-2 ring-white"
                                    title={`${overflowCount} more teacher${overflowCount === 1 ? "" : "s"}`}
                                  >
                                    +{overflowCount}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                        {classItem?.name}
                      </h3>
                      {classItem.branch ? (
                        <p className="text-xs text-gray-500 mb-3">
                          Branch {classItem.branch}
                          {classItem.academicYear
                            ? ` · ${classItem.academicYear}`
                            : ""}
                        </p>
                      ) : (
                        <div className="mb-3" />
                      )}

                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="min-w-0 break-words">
                            <span className="font-medium text-gray-700">
                              Teachers:{" "}
                            </span>
                            {teachersLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4 text-purple-500" />
                          <span>
                            Students: <ClassCapacityLabel klass={classItem} />
                          </span>
                        </div>

                        {schedule ? (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{schedule}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t flex flex-wrap gap-4">
                      <button
                        onClick={() =>
                          handleViewClass(classItem, getTeacherDisplayName)
                        }
                        className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleViewStudents(classItem)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Students
                      </button>
                      <button
                        onClick={() => handleAddStudent(classItem)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Add Student
                      </button>
                      <button
                        onClick={() => handleEditClass(classItem)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClass(
                            getClassDocumentId(classItem) || "",
                            classItem.name,
                          )
                        }
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredClasses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {hasActiveFilters ? "No classes found" : "No classes"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters
                  ? "Try adjusting search or filters."
                  : "Get started by creating your first class."}
              </p>
              {!hasActiveFilters && (
                <div className="mt-6">
                  <button
                    onClick={handleClassForm}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Create Class
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ClassesPage;
