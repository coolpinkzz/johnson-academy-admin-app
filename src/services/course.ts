import { useQuery } from "@tanstack/react-query";
import { AuthService } from "./auth";
import { client } from "./api-client";
import {
  CourseResponse,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "@/types/course";

// get all courses
export const getCourses = async (): Promise<CourseResponse> => {
  const response = await client("/courses", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    page: 1,
    limit: 100,
  });

  return response as unknown as CourseResponse;
};

export const useCourses = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options ?? {};
  return useQuery<CourseResponse>({
    queryKey: ["courses"],
    queryFn: getCourses,
    enabled,
  });
};

// create course
export const createCourse = async (
  courseData: CreateCoursePayload,
): Promise<unknown> => {
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

// update course
export const updateCourse = async (
  courseId: string,
  payload: UpdateCoursePayload,
): Promise<unknown> => {
  const response = await client(`/courses/${courseId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: payload,
  });
  return response;
};
