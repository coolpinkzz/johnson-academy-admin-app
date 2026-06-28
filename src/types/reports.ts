export interface MonthlyReportRequest {
  classId: string;
  studentId: string;
  courseId: string;
  month: string; // Format: YYYY-MM
}

export interface MonthlyReportResponse {
  reportUrl: string;
  fileName: string;
  generatedAt: string;
}

export interface ReportCheckResponse {
  exists: boolean;
  reportUrl?: string;
  generatedAt?: string;
}

export interface StudentMonthlyReportRequest {
  studentId: string;
  classId: string;
  courseId: string;
  month: string; // Format: YYYY-MM or MM-YYYY
}

export interface MRTCourseRef {
  name: string;
  id: string;
}

export interface StudentMonthlyReportResponse {
  month: string;
  classId: {
    name: string;
    id: string;
  };
  studentId: {
    name: string;
    email: string;
    id: string;
  };
  courseId: MRTCourseRef;
  sptAndFileSubmission: number;
  regularity: number;
  learningSpeed: number;
  songLearning: number;
  theoryAndTechnicals: number;
  assignment: number;
  totalScore: number;
  averageScore: number;
  remarks: string;
  id: string;
}

export interface MRTListParams {
  courseId?: string;
  classId?: string;
  studentId?: string;
  month?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface MRTListResponse {
  results: StudentMonthlyReportResponse[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface StudentEnrollmentOption {
  enrollmentKey: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
}
