import { User, UserResponse } from "@/types/user";
import { StaffRole } from "@/lib/rbac";
import { AuthService } from "./auth";
import { client } from "./api-client";
import { ServerResponse } from "@/models/common/client";

export interface CreateTeamMemberPayload {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  department: string;
  phoneNumber?: string;
  profilePicture?: string;
  isActive?: boolean;
  branchAccess?: number[];
}

export interface UpdateTeamMemberPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: StaffRole;
  department?: string;
  phoneNumber?: string;
  profilePicture?: string;
  isActive?: boolean;
  branchAccess?: number[];
}

const authHeaders = () => ({
  Authorization: `Bearer ${AuthService.getAccessToken()}`,
});

async function getUsersByRole(role: StaffRole): Promise<User[]> {
  const response: ServerResponse<UserResponse> = await client(
    `/users?role=${role}`,
    {
      method: "GET",
      headers: authHeaders(),
      page: 1,
      limit: 200,
    },
  );

  const data = response as unknown as UserResponse;
  return data.results ?? [];
}

/** Fetch admin + aqsd + master users and merge. */
export const getTeamMembers = async (): Promise<User[]> => {
  const [admins, aqsd, masters] = await Promise.all([
    getUsersByRole("admin"),
    getUsersByRole("aqsd"),
    getUsersByRole("master"),
  ]);

  const byId = new Map<string, User>();
  for (const user of [...admins, ...aqsd, ...masters]) {
    const id = user.id || user._id;
    if (id) byId.set(id, user);
  }

  return Array.from(byId.values()).sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, {
      sensitivity: "base",
    }),
  );
};

export const createTeamMember = async (
  payload: CreateTeamMemberPayload,
): Promise<User> => {
  const response: ServerResponse<User> = await client("/users", {
    method: "POST",
    headers: authHeaders(),
    data: payload,
  });
  return response as unknown as User;
};

export const updateTeamMember = async (
  userId: string,
  payload: UpdateTeamMemberPayload,
): Promise<User> => {
  const response: ServerResponse<User> = await client(`/users/${userId}`, {
    method: "PATCH",
    headers: authHeaders(),
    data: payload,
  });
  return response as unknown as User;
};

export const deleteTeamMember = async (userId: string): Promise<void> => {
  await client(`/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
};
