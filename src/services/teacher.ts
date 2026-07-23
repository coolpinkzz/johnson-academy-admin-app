import { User, UserResponse } from "@/types/user";
import { AuthService } from "./auth";
import { client } from "./api-client";
import { ServerResponse } from "@/models/common/client";

export interface UpdateTeacherProfileData {
  email?: string;
  password?: string;
  name?: string;
  rollNumber?: string;
  profilePicture?: string;
  phoneNumber?: string;
}

export const getTeachers = async (): Promise<UserResponse> => {
  const response: ServerResponse<UserResponse> = await client(
    "/users?role=teacher",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
      page: 1,
      limit: 200,
    },
  );

  return response as unknown as UserResponse;
};

export const updateTeacherProfile = async (
  userId: string,
  profileData: UpdateTeacherProfileData,
): Promise<User> => {
  const response: ServerResponse<User> = await client(`/users/${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: profileData,
  });

  return response as unknown as User;
};

// delete teacher
export const deleteTeacher = async (userId: string) => {
  const response = await client(`/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });

  return response;
};
