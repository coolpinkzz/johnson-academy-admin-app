"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { EditTeacherForm, useClassModals } from "@/components/modal";
import { useModal } from "@/hooks/use-modal";
import { TeacherTimetable } from "@/components/TeacherTimetable";
import { useClasses } from "@/services/class";
import { getTeacherById } from "@/services/teacher";
import {
  IClass,
  ICourse,
  getPopulatedStudentsInClass,
  getStudentInClassUserId,
  type ClassTeacherRef,
} from "@/types/class";
import { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Mail,
  Pencil,
  Phone,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo } from "react";

function teacherRefName(ref: ClassTeacherRef): string {
  if (typeof ref === "string") return "Teacher";
  return ref.name || "Teacher";
}

function courseLabel(course: ICourse | string | undefined | null): string | null {
  if (!course || typeof course === "string") return null;
  return course.name || null;
}

function collectCourseNames(klass: IClass): string[] {
  const names = new Set<string>();
  const primary = courseLabel(klass.courseId);
  if (primary) names.add(primary);

  for (const enrollment of getPopulatedStudentsInClass(klass.studentsInClass)) {
    if (enrollment.course?.name) names.add(enrollment.course.name);
  }

  return [...names];
}

const TeacherDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id as string;
  const { openModal } = useModal();
  const { handleViewClass } = useClassModals();

  const {
    data: teacher,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["teacher", teacherId],
    queryFn: () => getTeacherById(teacherId),
    enabled: Boolean(teacherId),
  });

  const { data: classesData, isLoading: classesLoading } = useClasses(
    { teacherId, limit: 200 },
    { enabled: Boolean(teacherId) },
  );

  const classes = useMemo(() => {
    const list = classesData?.results ?? [];
    return [...list].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      }),
    );
  }, [classesData?.results]);

  const stats = useMemo(() => {
    const studentIds = new Set<string>();
    const courseNames = new Set<string>();

    for (const klass of classes) {
      for (const name of collectCourseNames(klass)) {
        courseNames.add(name);
      }
      for (const enrollment of getPopulatedStudentsInClass(
        klass.studentsInClass,
      )) {
        const id = getStudentInClassUserId(enrollment);
        if (id) studentIds.add(id);
      }
    }

    return {
      classCount: classes.length,
      studentCount: studentIds.size,
      courseCount: courseNames.size,
    };
  }, [classes]);

  const openEditProfile = () => {
    if (!teacher) return;
    openModal({
      title: "Edit Teacher",
      content: (
        <EditTeacherForm teacher={teacher} submitLabel="Update Teacher" />
      ),
      size: "lg",
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-4 p-6 border-b bg-white">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex-1 p-6">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border p-6 animate-pulse space-y-4">
              <div className="h-20 w-20 bg-gray-200 rounded-full" />
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !teacher || teacher.role !== "teacher") {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-4 p-6 border-b bg-white">
            <button
              type="button"
              onClick={() => router.push("/dashboard/teachers")}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Teacher Details
            </h1>
          </div>
          <div className="flex-1 p-6">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Teacher not found
              </h3>
              <p className="text-gray-500 mb-4">
                This teacher does not exist or has been removed.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/teachers")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Teachers
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const employeeId = (teacher.rollNumber || teacher.employeeId || "").trim();

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between gap-4 p-4 sm:p-6 border-b bg-white">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/dashboard/teachers")}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              aria-label="Back to teachers"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900">
                Teacher Details
              </h1>
              <p className="text-sm text-gray-600 truncate">
                Classes and profile for {teacher.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEditProfile}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto space-y-6">
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="shrink-0">
                  {teacher.profilePicture ? (
                    <img
                      src={teacher.profilePicture}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium">
                      {teacher.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {teacher.name}
                    </h2>
                    {teacher.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <UserX className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                    {teacher.isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Mail className="h-3 w-3" />
                        Verified
                      </span>
                    ) : null}
                  </div>
                  <p className="text-gray-600 break-all">{teacher.email}</p>
                  {teacher.department ? (
                    <p className="text-sm text-gray-500 mt-2">
                      Department: {teacher.department}
                    </p>
                  ) : null}
                  {employeeId ? (
                    <p className="text-sm text-gray-500 mt-1">
                      Employee ID: {employeeId}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600 break-all">
                      {teacher.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">
                      {teacher.phoneNumber || "Not added"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {classesLoading ? "—" : stats.classCount}
                </p>
                <p className="text-sm text-gray-600">Classes</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {classesLoading ? "—" : stats.studentCount}
                </p>
                <p className="text-sm text-gray-600">Students</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {classesLoading ? "—" : stats.courseCount}
                </p>
                <p className="text-sm text-gray-600">Courses</p>
              </div>
            </section>

            {!classesLoading && classes.length > 0 ? (
              <TeacherTimetable
                classes={classes}
                onOpenClass={(klass) => handleViewClass(klass, teacherRefName)}
              />
            ) : null}

            {teacher.subjects && teacher.subjects.length > 0 ? (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Subjects
                </h3>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Role</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {teacher.role}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Email verification
                  </p>
                  <p className="text-sm text-gray-600">
                    {teacher.isEmailVerified ? "Verified" : "Not verified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Account status
                  </p>
                  <p className="text-sm text-gray-600">
                    {teacher.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Teacher ID
                  </p>
                  <p className="text-sm text-gray-600 font-mono break-all">
                    {teacher.id || teacher._id}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TeacherDetailPage;
