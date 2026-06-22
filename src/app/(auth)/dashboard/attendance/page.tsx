"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClassesByTeacher } from "@/services/class";
import { getTeachers } from "@/services/teacher";
import { getStudentsByClass } from "@/services/student";
import {
  markAttendanceAsPresent,
  markAttendanceAsAbsent,
} from "@/services/attendance";
import { StudentInClass, UserResponse } from "@/types/user";
import { Loader2, Calendar } from "lucide-react";
import AttendanceCalendarModal from "@/components/modal/AttendanceCalendarModal";
import { DatePicker } from "@/components/DatePicker";
import { TeacherSelect } from "@/components/TeacherSelect";
import { ClassSelect } from "@/components/ClassSelect";
import { formatDisplayDate } from "@/lib/utils";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentInClass | null>(
    null,
  );
  const queryClient = useQueryClient();

  const {
    data: teachersData,
    isLoading: teachersLoading,
    error: teachersError,
  } = useQuery<UserResponse>({
    queryKey: ["teachers"],
    queryFn: () => getTeachers(),
  });

  const {
    data: teacherClassesData,
    isLoading: teacherClassesLoading,
    error: teacherClassesError,
  } = useClassesByTeacher(selectedTeacherId, {
    enabled: Boolean(selectedTeacherId),
  });

  // Fetch students by class when a class is selected
  const {
    data: classStudentsData,
    isLoading: classStudentsLoading,
    error: classStudentsError,
  } = useQuery<StudentInClass[]>({
    queryKey: ["studentsByClass", selectedClassId],
    queryFn: () => getStudentsByClass(selectedClassId),
    enabled: !!selectedClassId && selectedClassId !== "",
  });

  // Mutation for marking attendance as present
  const markPresentMutation = useMutation({
    mutationFn: ({
      studentId,
      classId,
      date,
    }: {
      studentId: string;
      classId: string;
      date: string;
    }) => markAttendanceAsPresent({ studentId, classId, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error) => {
      console.error("Failed to mark attendance as present:", error);
      alert("Failed to mark attendance as present");
    },
  });

  // Mutation for marking attendance as absent
  const markAbsentMutation = useMutation({
    mutationFn: ({
      studentId,
      classId,
      date,
    }: {
      studentId: string;
      classId: string;
      date: string;
    }) => markAttendanceAsAbsent({ studentId, classId, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error) => {
      console.error("Failed to mark attendance as absent:", error);
      alert("Failed to mark attendance as absent");
    },
  });

  // Auto-select first class when teacher classes load
  useEffect(() => {
    const classes = teacherClassesData ?? [];
    if (classes.length === 0) {
      setSelectedClass("");
      setSelectedClassId("");
      return;
    }

    const currentClass = classes.find(
      (c) => c.name === selectedClass || c.id === selectedClassId,
    );

    if (!currentClass) {
      const firstClass = classes[0];
      setSelectedClass(firstClass.name);
      setSelectedClassId(firstClass.id);
    }
  }, [teacherClassesData, selectedClass, selectedClassId]);

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setSelectedClass("");
    setSelectedClassId("");
  };

  const handleClassChange = (classId: string) => {
    const selectedClassObj = teacherClassesData?.find((c) => c.id === classId);
    setSelectedClassId(classId);
    setSelectedClass(selectedClassObj?.name || "");
  };

  const handleMarkAttendance = (
    studentId: string,
    status: "present" | "absent",
  ) => {
    if (!selectedClassId || !selectedDate) return;

    if (status === "present") {
      markPresentMutation.mutate({
        studentId,
        classId: selectedClassId,
        date: selectedDate,
      });
    } else {
      markAbsentMutation.mutate({
        studentId,
        classId: selectedClassId,
        date: selectedDate,
      });
    }
  };

  const stats = {
    total: classStudentsData?.length || 0,
    present: 0, // Will be updated when attendance data is available
    absent: 0, // Will be updated when attendance data is available
    late: 0, // Not implemented in current API
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Attendance Management
          </h1>
          <p className="text-gray-600 mt-2">
            Track and manage student attendance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="h-6 w-6 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.present}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <div className="h-6 w-6 bg-red-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="h-6 w-6 bg-yellow-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Class Summary */}
      {/* <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Class Summary: {selectedClass}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-blue-600">
              {classStudentsData?.length || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Attendance Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.total > 0
                ? Math.round((stats.present / stats.total) * 100)
                : 0}
              %
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Date</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div> */}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <DatePicker
              label="Date"
              value={selectedDate}
              onChange={setSelectedDate}
            />
          </div>
          <div className="flex-1">
            <TeacherSelect
              label="Teacher"
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              teachers={teachersData?.results ?? []}
              isLoading={teachersLoading}
              error={teachersError}
            />
          </div>
          <div className="flex-1">
            <ClassSelect
              label="Class"
              value={selectedClassId}
              onChange={handleClassChange}
              classes={teacherClassesData ?? []}
              isLoading={teacherClassesLoading}
              error={teacherClassesError}
              noTeacherSelected={!selectedTeacherId}
            />
          </div>
        </div>
      </div>

      {/* Students in Class Section */}
      {classStudentsData && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Students in {selectedClass} - {formatDisplayDate(selectedDate)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {classStudentsData.length} students enrolled
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classStudentsLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading students...
                    </td>
                  </tr>
                ) : classStudentsError ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-red-500"
                    >
                      Error loading students
                    </td>
                  </tr>
                ) : classStudentsData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No students found in this class
                    </td>
                  </tr>
                ) : (
                  classStudentsData.map((student) => {
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-start">
                            {student.profilePicture ? (
                              <img
                                src={student.profilePicture}
                                alt={student.name}
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
                                <span className="text-white font-semibold text-lg">
                                  {student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                          {/* <div className="text-sm text-gray-500">
                          </div> */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.email}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleMarkAttendance(student.id, "present")
                              }
                              disabled={
                                markPresentMutation.isPending ||
                                markAbsentMutation.isPending
                              }
                              className="px-3 py-1 text-xs rounded-md transition-colors bg-green-100 text-green-700 hover:bg-green-200 hover:border-green-300 border border-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {markPresentMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Present"
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleMarkAttendance(student.id, "absent")
                              }
                              disabled={
                                markPresentMutation.isPending ||
                                markAbsentMutation.isPending
                              }
                              className="px-3 py-1 text-xs rounded-md transition-colors bg-red-100 text-red-700 hover:bg-red-200 hover:border-red-300 border border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {markAbsentMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Absent"
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setCalendarModalOpen(true);
                              }}
                              className="px-3 py-1 text-xs rounded-md transition-colors bg-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 border border-blue-300"
                              title="View Attendance Calendar"
                            >
                              <Calendar className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Calendar Modal */}
      {selectedStudent && (
        <AttendanceCalendarModal
          isOpen={calendarModalOpen}
          onClose={() => {
            setCalendarModalOpen(false);
            setSelectedStudent(null);
          }}
          studentId={selectedStudent.id}
          classId={selectedClassId}
          studentName={selectedStudent.name}
        />
      )}
    </div>
  );
}
