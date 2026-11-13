export interface StudentAttendance {
  studentId: string;
  classId: string;
  presentDates: string[];
  absentDates: string[];
  joiningDate: string;
  classesInOneWeek: any[];
  lastDate: string;
  id: string;
}

export interface AttendanceResponse {
  results: StudentAttendance[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface AttendanceData {
  studentId: string;
  classId: string;
  date: string;
}

export interface MarkAttendanceResponse {
  success: boolean;
  message: string;
  data?: any;
}
