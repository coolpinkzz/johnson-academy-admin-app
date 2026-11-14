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
  teachers?: string[];
  /** @deprecated Prefer teachers[] on class documents */
  teacherId?: string;
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

export interface EnrolledClassCourse {
  id: string;
  name?: string;
  instrument?: string;
}

export interface EnrolledClassTeacher {
  id: string;
  name: string;
}

/** Class a student is enrolled in, with the courses they opted for in that class. */
export interface EnrolledClass {
  id: string;
  name: string;
  branch?: string;
  academicYear?: string;
  status?: string;
  defaultWeekdays?: string[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  teachers?: EnrolledClassTeacher[];
  courses: EnrolledClassCourse[];
}

export interface StudentGuardian {
  name: string;
  relation: string;
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
  /** Populated on student list and student profile responses. */
  enrolledClasses?: EnrolledClass[];
  courses: Course[];
  progress: Progress[];
  rollNumber?: string;
  employeeId?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  dateOfBirth?: string;
  occupation?: string;
  gender?: string;
  address?: string;
  referralSource?: string;
  referralSourceOther?: string;
  dateOfJoining?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  motherName?: string;
  fatherName?: string;
  guardians?: StudentGuardian[];
  isProfileCardComplete?: boolean;
  /** Set on the student list for roles that can read fees. */
  feeProfileStatus?: "expired" | "expiring" | "active" | "upcoming" | "none";
  profilePicture?: string;
  department?: string;
  /** Staff-only: branches whose students this user may access */
  branchAccess?: number[];
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
