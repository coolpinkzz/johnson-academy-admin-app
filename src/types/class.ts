import { User } from "./user";

export interface ICourse {
  id: string;
  name: string;
  description: string;
  image: string;
  syllabus: string[];
  instrument: string;
}
export interface IClass {
  id?: string;
  name: string;
  teacherId: string;
  courseId: ICourse | string;
  /** Student IDs when creating/updating; may be populated as User[] in API responses */
  students: (string | User)[];
}

export interface ClassResponse {
  results: IClass[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}
