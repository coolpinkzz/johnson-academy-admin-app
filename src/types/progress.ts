// Student Progress API Types

export interface Resource {
  file: string;
  key: string;
}

export interface ModuleId {
  type: "theory" | "technical" | "learning" | "others";
  title: string;
  description: string;
  session: number;
  resources: Resource[];
  id: string;
}

export interface ModuleProgress {
  moduleId: ModuleId | null;
  status: "completed" | "inprogress" | "upcoming";
  startDate?: string;
  dateTakenToComplete?: number;
  endDate?: string;
  remark?: string;
  score?: number;
}

export interface SyllabusId {
  title: string;
  description: string;
  id: string;
}

export interface SyllabusProgress {
  syllabusId: SyllabusId;
  modules: ModuleProgress[];
}

export interface StudentInfo {
  name: string;
  email: string;
  role: string;
  id: string;
}

export interface ClassInfo {
  name: string;
  id: string;
}

export interface CourseInfo {
  name: string;
  description: string;
  id: string;
}

export interface StudentProgressResponse {
  studentId: StudentInfo;
  classId: ClassInfo;
  courseId: CourseInfo;
  progress: number;
  syllabusProgress: SyllabusProgress[];
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  upcomingModules: number;
  id: string;
}
