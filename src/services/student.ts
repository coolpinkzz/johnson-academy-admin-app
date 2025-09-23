import { ServerResponse } from "@/models/common/client";
import { client } from "./api-client";
import { AuthService } from "./auth";
import { UserResponse, StudentInClass } from "@/types/user";

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
    `/users?role=student&name=${encodeURIComponent(query)}`,
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
