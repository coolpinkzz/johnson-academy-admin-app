import { AuthService } from "./auth";
import { client } from "./api-client";
import { CourseResponse } from "@/types/course";

// get all courses
export const getCourses = async (): Promise<CourseResponse> => {
  const response = await client("/courses", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });

  return response as unknown as CourseResponse;
};

// create course
export const createCourse = async (courseData: any): Promise<any> => {
  const response = await client("/courses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: courseData,
  });
  return response;
};

// delete course
export const deleteCourse = async (courseId: string): Promise<any> => {
  const response = await client(`/courses/${courseId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });
};
