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
}

export interface IStudentInClass {
  _id: string;
  user: User;
  course: ICourse;
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
