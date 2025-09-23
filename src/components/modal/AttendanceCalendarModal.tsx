"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudentAttendance } from "@/services/attendance";
import { AttendanceResponse } from "@/types/attendance";
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  classId: string;
  studentName: string;
}

export default function AttendanceCalendarModal({
  isOpen,
  onClose,
  studentId,
  classId,
  studentName,
}: AttendanceCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Fetch attendance data for the student
  const { data: attendanceData, isLoading } = useQuery<AttendanceResponse>({
    queryKey: ["studentAttendance", studentId, classId],
    queryFn: () => getStudentAttendance(studentId, classId),
    enabled: isOpen && !!studentId && !!classId,
  });

  // Get current month's start and end dates
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = startOfMonth.getDay();

  // Get total days in the month
  const daysInMonth = endOfMonth.getDate();

  // Generate calendar days array
  const generateCalendarDays = () => {
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, date: null });
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      // Use local date formatting to avoid timezone issues
      const dateString = date.toLocaleDateString("en-CA"); // Returns YYYY-MM-DD format
      days.push({ day, date: dateString });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Check if a date has attendance data
  const getAttendanceStatus = (dateString: string) => {
    if (!attendanceData?.results || attendanceData.results.length === 0)
      return null;

    const record = attendanceData.results[0]; // Assuming single result for student
    if (!record) return null;

    // Parse the target date string to get year, month, and day
    const targetDate = new Date(dateString);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // getMonth() returns 0-11
    const targetDay = targetDate.getDate();

    const isPresent = record.presentDates?.some((date) => {
      const apiDate = new Date(date);
      const apiYear = apiDate.getFullYear();
      const apiMonth = apiDate.getMonth() + 1;
      const apiDay = apiDate.getDate();

      console.log("Comparing with API date:", date, "->", {
        apiYear,
        apiMonth,
        apiDay,
      });

      return (
        apiYear === targetYear &&
        apiMonth === targetMonth &&
        apiDay === targetDay
      );
    });

    const isAbsent = record.absentDates?.some((date) => {
      const apiDate = new Date(date);
      const apiYear = apiDate.getFullYear();
      const apiMonth = apiDate.getMonth() + 1;
      const apiDay = apiDate.getDate();

      console.log("Comparing with API date:", date, "->", {
        apiYear,
        apiMonth,
        apiDay,
      });

      return (
        apiYear === targetYear &&
        apiMonth === targetMonth &&
        apiDay === targetDay
      );
    });

    console.log("Result:", { isPresent, isAbsent });
    if (isPresent) return "present";
    if (isAbsent) return "absent";
    return null;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // Format month and year for display
  const formatMonthYear = () => {
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Handle date selection
  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
  };

  // Get attendance count for the month
  const getMonthlyStats = () => {
    if (!attendanceData?.results || attendanceData.results.length === 0) {
      return { present: 0, absent: 0 };
    }

    const record = attendanceData.results[0];
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

    const presentCount =
      record.presentDates?.filter((date) => {
        const apiDate = new Date(date);
        return (
          apiDate.getFullYear() === currentYear &&
          apiDate.getMonth() + 1 === currentMonth
        );
      }).length || 0;

    const absentCount =
      record.absentDates?.filter((date) => {
        const apiDate = new Date(date);
        return (
          apiDate.getFullYear() === currentYear &&
          apiDate.getMonth() + 1 === currentMonth
        );
      }).length || 0;

    return { present: presentCount, absent: absentCount };
  };

  const monthlyStats = getMonthlyStats();

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
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Present: {monthlyStats.present}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Absent: {monthlyStats.absent}
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
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
              const isToday = date === new Date().toLocaleDateString("en-CA");
              const isSelected = date === selectedDate;

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`
                    h-12 border border-gray-200 hover:border-blue-300 transition-colors
                    flex flex-col items-center justify-center relative
                    ${isToday ? "bg-blue-50 border-blue-300" : ""}
                    ${isSelected ? "bg-blue-100 border-blue-400" : ""}
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

                  {/* Attendance indicator */}
                  {attendanceStatus && (
                    <div
                      className={`
                      w-2 h-2 rounded-full mt-1
                      ${
                        attendanceStatus === "present"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }
                    `}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="p-4 border-t bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-gray-600">Selected Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {(() => {
                const status = getAttendanceStatus(selectedDate);
                if (status === "present") {
                  return (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-700 font-medium">
                        Present
                      </span>
                    </div>
                  );
                } else if (status === "absent") {
                  return (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-red-700 font-medium">Absent</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-600">
                        No attendance marked
                      </span>
                    </div>
                  );
                }
              })()}
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
