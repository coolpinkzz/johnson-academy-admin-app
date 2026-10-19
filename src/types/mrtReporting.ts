export interface MrtMetricSnapshot {
  eligibleStudents: number;
  expected: number;
  submitted: number;
  missing: number;
  completionPercentage: number | null;
  averageTotalScore: number | null;
  averageScore: number | null;
}

export interface MrtReportCounts {
  expected: number;
  submitted: number;
  missing: number;
  completionPercentage: number | null;
}

export interface MrtBranchRow extends MrtMetricSnapshot {
  branch: string;
  branchName: string;
}

export interface MrtTeacherRow extends MrtMetricSnapshot {
  teacherId: string;
  teacherName: string;
  branches: { branch: string; branchName: string }[];
}

export interface MrtMonthRow extends MrtReportCounts {
  month: string;
  monthLabel: string;
  eligibleStudents: number;
}

export interface MrtInstrumentRow extends MrtMetricSnapshot {
  instrument: string;
}

export interface MrtReportingFilters {
  branch: string | null;
  branches: string[] | null;
  teacherId: string | null;
  instrument: string | null;
  monthFrom: string;
  monthTo: string;
}

export interface MrtFilterOptions {
  branches: { branch: string; branchName: string }[];
  teachers: { teacherId: string; teacherName: string }[];
  instruments: string[];
  months: { month: string; label: string }[];
}

export interface MrtMonthComparison {
  month: string;
  previousMonth: string;
  current: MrtReportCounts;
  previous: MrtReportCounts;
  submittedDelta: number;
  completionPercentageDelta: number | null;
}

export interface MrtReportingDashboard {
  filters: MrtReportingFilters;
  notes: string[];
  options: MrtFilterOptions;
  summary: MrtMetricSnapshot;
  comparison: MrtMonthComparison;
  branches: MrtBranchRow[];
  teachers: MrtTeacherRow[];
  months: MrtMonthRow[];
  instruments: MrtInstrumentRow[];
}

export type MrtRecordStatus = "submitted" | "missing";

export type MrtRecordSortField =
  | "studentName"
  | "rollNumber"
  | "branchName"
  | "className"
  | "instrument"
  | "month"
  | "status"
  | "submittedAt"
  | "teacherName"
  | "totalScore"
  | "averageScore";

export interface MrtReportingRecord {
  studentId: string;
  studentName: string;
  rollNumber: string | null;
  classId: string;
  className: string;
  branch: string;
  branchName: string;
  teacherIds: string[];
  teachers: { teacherId: string; teacherName: string }[];
  courseId: string;
  courseName: string;
  instrument: string;
  month: string;
  monthLabel: string;
  status: MrtRecordStatus;
  submittedAt: string | null;
  mrtId: string | null;
  totalScore: number | null;
  averageScore: number | null;
}

export interface MrtReportingRecords {
  filters: MrtReportingFilters;
  results: MrtReportingRecord[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface MrtDashboardParams {
  branch?: string;
  teacherId?: string;
  instrument?: string;
  month?: string;
  monthFrom?: string;
  monthTo?: string;
}

export interface MrtRecordParams extends MrtDashboardParams {
  search?: string;
  status?: MrtRecordStatus;
  sortBy?: MrtRecordSortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
