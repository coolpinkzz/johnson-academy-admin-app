import { ServerResponse } from "@/models/common/client";
import { client } from "./api-client";
import { AuthService } from "./auth";
import { UserResponse, StudentInClass, User } from "@/types/user";
import { StudentProgressResponse } from "@/types/progress";

export const getStudents = async (): Promise<UserResponse> => {
  const response: ServerResponse<UserResponse> = await client(
    "/users?role=student",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    }
  );

  return response as unknown as UserResponse;
};

export const searchStudents = async (query: string): Promise<UserResponse> => {
  const response: ServerResponse<UserResponse> = await client(
    `/users?role=student&rollNumber=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    }
  );

  return response as unknown as UserResponse;
};

// delete student
export const deleteStudent = async (userId: string) => {
  const response = await client(`/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });

  return response;
};

// Get students for a specific class
export const getStudentsByClass = async (
  classId: string
): Promise<StudentInClass[]> => {
  const response: ServerResponse<StudentInClass[]> = await client(
    `/classes/${classId}/students`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    }
  );

  return response as unknown as StudentInClass[];
};

// Get student by ID
export const getStudentById = async (studentId: string): Promise<User> => {
  const response: ServerResponse<User> = await client(
    `/users/student/${studentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    }
  );

  return response as unknown as User;
};

// Get student progress for a specific class
export const getStudentProgress = async (
  studentId: string,
  classId: string
): Promise<StudentProgressResponse> => {
  const response: ServerResponse<StudentProgressResponse> = await client(
    `/student-progress/student/${studentId}/class/${classId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    }
  );

  return response as unknown as StudentProgressResponse;
};
