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
  courseId: ICourse;
  students: string[];
}

export interface ClassResponse {
  results: IClass[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}
