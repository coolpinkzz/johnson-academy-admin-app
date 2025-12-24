export interface UserResponse {
  results: User[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  courseId: string;
  students: string[];
}

export interface Course {
  id: string;
  name: string;
  description: string;
  image: string;
  syllabus: string[];
  instrument: string;
}

export interface ModuleProgress {
  moduleId: string;
  status: "completed" | "inprogress" | "upcoming";
  startDate?: string;
  endDate?: string;
  dateTakenToComplete?: number;
  remark?: string;
  score?: number;
}

export interface SyllabusProgress {
  syllabusId: string;
  modules: ModuleProgress[];
}

export interface Progress {
  id: string;
  studentId: string;
  classId: string;
  courseId: string;
  progress: number;
  syllabusProgress: SyllabusProgress[];
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  upcomingModules: number;
}

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  subjects: string[];
  isActive: boolean;
  isCompleteProfile?: boolean;
  classes: Class[];
  courses: Course[];
  progress: Progress[];
  rollNumber?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

// Student data returned from getStudentsByClass endpoint
export interface StudentInClass {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePicture: string | null;
  rollNumber?: string;
}
