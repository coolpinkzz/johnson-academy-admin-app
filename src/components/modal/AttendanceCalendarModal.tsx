"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStudentAttendance,
  markAttendanceAsAbsent,
  markAttendanceAsPresent,
} from "@/services/attendance";
import { AttendanceResponse } from "@/types/attendance";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { formatDisplayDate } from "@/lib/utils";

interface AttendanceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  classId: string;
  studentName: string;
}

function toLocalDateString(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function datesMatch(apiDate: string, targetDateString: string): boolean {
  const api = new Date(apiDate);
  const target = new Date(targetDateString);

  return (
    api.getFullYear() === target.getFullYear() &&
    api.getMonth() === target.getMonth() &&
    api.getDate() === target.getDate()
  );
}

export default function AttendanceCalendarModal({
  isOpen,
  onClose,
  studentId,
  classId,
  studentName,
}: AttendanceCalendarModalProps) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");

  const { data: attendanceData, isLoading } = useQuery<AttendanceResponse>({
    queryKey: ["studentAttendance", studentId, classId],
    queryFn: () => getStudentAttendance(studentId, classId),
    enabled: isOpen && !!studentId && !!classId,
  });

  useEffect(() => {
    if (!isOpen) return;
    const today = toLocalDateString(new Date());
    setSelectedDate(today);
    setCurrentDate(new Date());
  }, [isOpen, studentId, classId]);

  const invalidateAttendance = () => {
    queryClient.invalidateQueries({
      queryKey: ["studentAttendance", studentId, classId],
    });
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
  };

  const markPresentMutation = useMutation({
    mutationFn: (date: string) =>
      markAttendanceAsPresent({ studentId, classId, date }),
    onSuccess: () => {
      invalidateAttendance();
      toast.success("Marked as present");
    },
    onError: (error) => {
      console.error("Failed to mark attendance as present:", error);
      toast.error("Failed to mark as present");
    },
  });

  const markAbsentMutation = useMutation({
    mutationFn: (date: string) =>
      markAttendanceAsAbsent({ studentId, classId, date }),
    onSuccess: () => {
      invalidateAttendance();
      toast.success("Marked as absent");
    },
    onError: (error) => {
      console.error("Failed to mark attendance as absent:", error);
      toast.error("Failed to mark as absent");
    },
  });

  const isMarking =
    markPresentMutation.isPending || markAbsentMutation.isPending;

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  );
  const firstDayOfMonth = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const generateCalendarDays = () => {
    const days: { day: number | null; date: string | null }[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, date: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      days.push({ day, date: toLocalDateString(date) });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const getAttendanceStatus = (dateString: string) => {
    const record = attendanceData?.results?.[0];
    if (!record) return null;

    if (record.presentDates?.some((date) => datesMatch(date, dateString))) {
      return "present" as const;
    }
    if (record.absentDates?.some((date) => datesMatch(date, dateString))) {
      return "absent" as const;
    }
    return null;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const formatMonthYear = () =>
    currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  const getMonthlyStats = () => {
    const record = attendanceData?.results?.[0];
    if (!record) return { present: 0, absent: 0 };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const present =
      record.presentDates?.filter((date) => {
        const apiDate = new Date(date);
        return apiDate.getFullYear() === year && apiDate.getMonth() === month;
      }).length || 0;

    const absent =
      record.absentDates?.filter((date) => {
        const apiDate = new Date(date);
        return apiDate.getFullYear() === year && apiDate.getMonth() === month;
      }).length || 0;

    return { present, absent };
  };

  const monthlyStats = getMonthlyStats();
  const selectedStatus = selectedDate
    ? getAttendanceStatus(selectedDate)
    : null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Attendance Calendar
              </h2>
              <p className="text-sm text-gray-600">{studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <h3 className="text-lg font-semibold text-gray-900">
            {formatMonthYear()}
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Monthly Stats */}
        <div className="flex items-center justify-center gap-6 p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-600">
              Present: {monthlyStats.present}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm text-gray-600">
              Absent: {monthlyStats.absent}
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading attendance...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ day, date }, index) => {
                  if (!day || !date) {
                    return (
                      <div
                        key={index}
                        className="h-12 border border-gray-100 bg-gray-50"
                      />
                    );
                  }

                  const attendanceStatus = getAttendanceStatus(date);
                  const isToday = date === toLocalDateString(new Date());
                  const isSelected = date === selectedDate;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`
                        h-12 border border-gray-200 hover:border-blue-300 transition-colors
                        flex flex-col items-center justify-center relative
                        ${isToday ? "bg-blue-50 border-blue-300" : ""}
                        ${isSelected ? "ring-2 ring-blue-400 border-blue-400" : ""}
                        ${attendanceStatus === "present" ? "bg-green-50" : ""}
                        ${attendanceStatus === "absent" ? "bg-red-50" : ""}
                      `}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isToday ? "text-blue-600" : "text-gray-900"
                        }`}
                      >
                        {day}
                      </span>

                      {attendanceStatus && (
                        <div
                          className={`w-2 h-2 rounded-full mt-1 ${
                            attendanceStatus === "present"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Selected Date + Mark CTAs */}
        {selectedDate && (
          <div className="p-4 border-t bg-gray-50 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Selected Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDisplayDate(selectedDate)}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {selectedStatus === "present" ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-green-700 font-medium">Present</span>
                  </>
                ) : selectedStatus === "absent" ? (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-red-700 font-medium">Absent</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    <span className="text-gray-600">No attendance marked</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => markPresentMutation.mutate(selectedDate)}
                disabled={isMarking || selectedStatus === "present"}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markPresentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Mark Present
              </button>
              <button
                type="button"
                onClick={() => markAbsentMutation.mutate(selectedDate)}
                disabled={isMarking || selectedStatus === "absent"}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markAbsentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
                Mark Absent
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
