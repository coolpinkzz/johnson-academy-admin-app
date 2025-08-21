import { Course } from "./course";
import { Module } from "./course";

export interface SyllabusResponse {
  _id?: string;
  id: string;
  courseId: Course;
  title: string;
  description: string;
  learning: Module[];
  theory: Module[];
  technical: Module[];
}
