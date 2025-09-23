"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/services/auth";
import { getClasses } from "@/services/class";
import { getStudentsByClass } from "@/services/student";
import { generateMonthlyReport, downloadReport } from "@/services/reports";
import { ClassResponse, IClass } from "@/types/class";
import { StudentInClass } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Search,
  Filter,
  Download,
  Calendar,
  Users,
  FileText,
  ChevronDown,
  Check,
} from "lucide-react";
import React, { useState, useMemo } from "react";

const MonthlyReportsPage = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<IClass | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentInClass | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Get all classes
  const {
    data: classesData,
    isLoading: classesLoading,
    error: classesError,
  } = useQuery<ClassResponse>({
    queryKey: ["classes"],
    queryFn: () => getClasses(),
  });

  // Get students for selected class
  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery<StudentInClass[]>({
    queryKey: ["students", selectedClass?.id],
    queryFn: () => getStudentsByClass(selectedClass?.id || ""),
    enabled: !!selectedClass?.id,
  });

  // Generate months list for the current year
  const months = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthsList = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1);
      const monthName = date.toLocaleString("default", { month: "long" });
      const monthValue = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
      monthsList.push({
        name: monthName,
        value: monthValue,
        display: `${monthName} ${currentYear}`,
      });
    }
    return monthsList;
  }, []);

  const handleClassSelect = (classItem: IClass) => {
    setSelectedClass(classItem);
    setSelectedStudent(null); // Reset student selection
    setReportUrl(null);
    setShowClassDropdown(false);
  };

  const handleStudentSelect = (student: StudentInClass) => {
    setSelectedStudent(student);
    setReportUrl(null);
    setShowStudentDropdown(false);
  };

  const handleMonthSelect = (monthValue: string) => {
    setSelectedMonth(monthValue);
    setReportUrl(null);
    setShowMonthDropdown(false);
  };

  const handleGenerateReport = async () => {
    if (!selectedClass || !selectedStudent || !selectedMonth) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateMonthlyReport({
        classId: selectedClass.id || "",
        studentId: selectedStudent.id,
        month: selectedMonth,
      });

      setReportUrl(response.reportUrl);

      // Auto-download the report
      const blob = await downloadReport(response.reportUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = selectedClass && selectedStudent && selectedMonth;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-2 border-b px-4 bg-white">
          <div className="flex items-center justify-between flex-1 px-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Monthly Reports
              </h1>
              <p className="text-sm text-gray-600">
                Generate monthly attendance and progress reports
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {/* Report Generation Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Generate Monthly Report
              </h2>

              <div className="space-y-6">
                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowClassDropdown(!showClassDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <span
                        className={
                          selectedClass ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {selectedClass
                          ? selectedClass.name
                          : "Choose a class..."}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {showClassDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {classesLoading ? (
                          <div className="p-3 text-center text-gray-500">
                            Loading classes...
                          </div>
                        ) : classesError ? (
                          <div className="p-3 text-center text-red-500">
                            Error loading classes
                          </div>
                        ) : classesData?.results?.length === 0 ? (
                          <div className="p-3 text-center text-gray-500">
                            No classes found
                          </div>
                        ) : (
                          classesData?.results?.map((classItem) => (
                            <button
                              key={classItem.id}
                              onClick={() => handleClassSelect(classItem)}
                              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100"
                            >
                              <span className="text-gray-900">
                                {classItem.name}
                              </span>
                              {selectedClass?.id === classItem.id && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setShowStudentDropdown(!showStudentDropdown)
                      }
                      disabled={!selectedClass}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <span
                        className={
                          selectedStudent ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {selectedStudent
                          ? selectedStudent.name
                          : "Choose a student..."}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {showStudentDropdown && selectedClass && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {studentsLoading ? (
                          <div className="p-3 text-center text-gray-500">
                            Loading students...
                          </div>
                        ) : studentsError ? (
                          <div className="p-3 text-center text-red-500">
                            Error loading students
                          </div>
                        ) : studentsData?.length === 0 ? (
                          <div className="p-3 text-center text-gray-500">
                            No students found in this class
                          </div>
                        ) : (
                          studentsData?.map((student) => (
                            <button
                              key={student.id}
                              onClick={() => handleStudentSelect(student)}
                              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-gray-900">
                                    {student.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {student.email}
                                  </div>
                                </div>
                              </div>
                              {selectedStudent?.id === student.id && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Month Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Month
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <span
                        className={
                          selectedMonth ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {selectedMonth
                          ? months.find((m) => m.value === selectedMonth)
                              ?.display
                          : "Choose a month..."}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {showMonthDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {months.map((month) => (
                          <button
                            key={month.value}
                            onClick={() => handleMonthSelect(month.value)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100"
                          >
                            <span className="text-gray-900">
                              {month.display}
                            </span>
                            {selectedMonth === month.value && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <button
                    onClick={handleGenerateReport}
                    disabled={!isFormValid || isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Generate PDF Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Report Preview/Info */}
            {isFormValid && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Report Preview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Class
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedClass.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Student
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedStudent.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Month
                      </div>
                      <div className="text-sm text-gray-600">
                        {months.find((m) => m.value === selectedMonth)?.display}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MonthlyReportsPage;
