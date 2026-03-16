import { User } from "./user";

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
  name: string;
  teacherId: User;
  courseId: ICourse | string;
  /** Student IDs when creating/updating; may be populated as User[] in API responses */
  students: (string | User)[];
  studentsInClass: IStudentInClass[];
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
  teacherId: string;
}
