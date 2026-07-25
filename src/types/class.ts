import { User } from "./user";

/** Teachers assigned to a class (populated users and/or raw ids from API). */
export type ClassTeacherRef = string | User;

export type ClassStatus = "active" | "inactive" | "archived";

export type ClassWeekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type ClassBranch =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12";

export const CLASS_STATUSES: ClassStatus[] = [
  "active",
  "inactive",
  "archived",
];

export const CLASS_WEEKDAYS: ClassWeekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const CLASS_BRANCHES: ClassBranch[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

export const DEFAULT_CLASS_TIMEZONE = "Asia/Kolkata";

export interface ICourse {
  id: string;
  name: string;
  description: string;
  image: string;
  syllabus: string[];
  instrument: string;
  level?: number;
  _id?: string;
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
  courseId?: ICourse | string;
  /** Student IDs when creating/updating; may be populated as User[] in API responses */
  students?: (string | User)[];
  studentsInClass?: IStudentInClass[];
  /** Optional enrolled count from API; fall back to studentsInClass length */
  enrolledCount?: number;

  // Cohort / compensation-prep fields
  code?: string;
  status?: ClassStatus;
  branch?: string;
  gradeLevel?: string;
  academicYear?: string;
  primaryCourseId?: string | ICourse;
  notes?: string;
  regularCapacity?: number;
  sessionCapacity?: number;
  allowsCompensationInbound?: boolean;
  allowsCompensationOutbound?: boolean;
  compensationSameCourseOnly?: boolean;
  maxOpenCompensationBookings?: number;
  defaultWeekdays?: ClassWeekday[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultTimezone?: string;
  defaultRoom?: string;
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

export function getClassEnrolledCount(klass: Partial<IClass>): number {
  if (typeof klass.enrolledCount === "number") {
    return klass.enrolledCount;
  }
  return klass.studentsInClass?.length ?? klass.students?.length ?? 0;
}

export function resolveCourseRefId(
  ref: string | ICourse | undefined | null,
): string {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return ref.id || ref._id || "";
}

export interface ClassResponse {
  results: IClass[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

/** Payload for POST /v1/classes and PATCH /v1/classes/:id */
export interface ClassFormData {
  name: string;
  /** At least one teacher id required by API */
  teachers: string[];
  branch?: string;
  academicYear?: string;
  notes?: string;
  sessionCapacity?: number;
  defaultWeekdays: ClassWeekday[];
  defaultStartTime?: string;
  defaultEndTime?: string;
}

/** Query filters for GET /v1/classes */
export interface GetClassesParams {
  page?: number;
  limit?: number;
  name?: string;
  code?: string;
  status?: ClassStatus;
  branch?: string;
  gradeLevel?: string;
  academicYear?: string;
  allowsCompensationInbound?: boolean;
  allowsCompensationOutbound?: boolean;
  teacherId?: string;
  courseId?: string;
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
