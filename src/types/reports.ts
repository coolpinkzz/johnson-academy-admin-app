export interface MonthlyReportRequest {
  classId: string;
  studentId: string;
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
  month: string; // Format: MM-YYYY
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
