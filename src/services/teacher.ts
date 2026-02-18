import { UserResponse } from "@/types/user";
import { AuthService } from "./auth";
import { client } from "./api-client";
import { ServerResponse } from "@/models/common/client";

export const getTeachers = async (): Promise<UserResponse> => {
  const response: ServerResponse<UserResponse> = await client(
    "/users?role=teacher",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
      page: 1,
      limit: 100,
    },
  );

  return response as unknown as UserResponse;
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
