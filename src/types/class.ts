import { User } from "./user";

/** Teachers assigned to a class (populated users and/or raw ids from API). */
export type ClassTeacherRef = string | User;

export interface ICourse {
  id: string;
  name: string;
  description: string;
  image: string;
  syllabus: string[];
  instrument: string;
  level?: number;
}

export interface IStudentInClass {
  _id: string;
  user: User;
  course: ICourse;
}

/** Enrollment row with populated user and course (API may return null refs). */
export function isPopulatedStudentInClass(
  entry: unknown,
): entry is IStudentInClass {
  if (typeof entry !== "object" || entry == null) return false;
  const row = entry as Partial<IStudentInClass>;
  return row.user != null && row.course != null;
}

export function getPopulatedStudentsInClass(
  studentsInClass: IClass["studentsInClass"] | undefined,
): IStudentInClass[] {
  return (studentsInClass ?? []).filter(isPopulatedStudentInClass);
}

export function getStudentInClassUserId(student: IStudentInClass): string {
  return student.user._id || student.user.id;
}

export function getStudentInClassCourseId(
  course: ICourse & { _id?: string },
): string {
  return course.id || course._id || "";
}

export interface IClass {
  id?: string;
  _id?: string;
  name: string;
  /** Primary field: co-teachers for this class */
  teachers?: ClassTeacherRef[];
  /** @deprecated Legacy single teacher; prefer `teachers` after backend migration */
  teacherId?: ClassTeacherRef;
  courseId: ICourse | string;
  /** Student IDs when creating/updating; may be populated as User[] in API responses */
  students: (string | User)[];
  studentsInClass: IStudentInClass[];
}

/** Normalize API payloads that may still use deprecated `teacherId` only. */
export function getClassTeacherList(
  klass: Partial<Pick<IClass, "teachers" | "teacherId">>,
): ClassTeacherRef[] {
  if (klass.teachers?.length) {
    return klass.teachers;
  }
  if (klass.teacherId != null && klass.teacherId !== "") {
    return [klass.teacherId];
  }
  return [];
}

export function classTeacherRefId(ref: ClassTeacherRef): string {
  if (typeof ref === "string") {
    return ref;
  }
  return ref._id || ref.id;
}

export function getClassDocumentId(klass: Partial<IClass>): string | undefined {
  return klass.id ?? klass._id;
}

export interface ClassResponse {
  results: IClass[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface ClassFormData {
  name: string;
  /** At least one teacher id required by API */
  teachers: string[];
}

/** Class document returned from GET /classes/teacher/:teacherId */
export interface IClassByTeacher {
  id: string;
  name: string;
  teacherId: string;
  teachers: User[];
  students: User[];
  studentsInClass: IStudentInClass[];
  classMaxCapacity: number;
  classesInOneWeek: string[];
  endTime: string;
  startTime: string;
  courseId?: ICourse | string;
}

export type ClassesByTeacherResponse = IClassByTeacher[];
