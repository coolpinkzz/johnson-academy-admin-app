import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { ServerResponse } from "@/models/common/client";
import { client } from "./api-client";
import { AuthService } from "./auth";
import { UserResponse, StudentInClass, User } from "@/types/user";
import { StudentProgressResponse } from "@/types/progress";
import { PAGE_SIZE } from "@/constant";
import { looksLikeRollNumberSearch } from "@/lib/roll-number";

export type StudentBranch = "1" | "2" | "3" | "4";

export const STUDENT_BRANCHES: StudentBranch[] = ["1", "2", "3", "4"];

export interface GetStudentsParams {
  page?: number;
  limit?: number;
  name?: string;
  rollNumber?: string;
  branch?: StudentBranch;
  sortBy?: string;
  role?: string;
}

function buildStudentsSearchParams(params?: GetStudentsParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  searchParams.set("role", params?.role ?? "student");

  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.page != null) searchParams.set("page", String(params.page));
  if (params?.name) searchParams.set("name", params.name);
  if (params?.rollNumber) searchParams.set("rollNumber", params.rollNumber);
  if (params?.branch) searchParams.set("branch", params.branch);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);

  return searchParams;
}

export const getStudents = async (
  params?: GetStudentsParams,
): Promise<UserResponse> => {
  const searchParams = buildStudentsSearchParams(params);

  const response: ServerResponse<UserResponse> = await client(
    `/users?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    },
  );

  return response as unknown as UserResponse;
};

export const useStudents = (
  params?: GetStudentsParams,
  options?: { enabled?: boolean },
) => {
  const { enabled = true } = options ?? {};

  return useQuery<UserResponse>({
    queryKey: ["students", "list", params ?? {}],
    queryFn: () => getStudents(params),
    enabled,
  });
};

/** Lightweight counts for Total + each branch (limit=1, uses totalResults). */
export const useStudentBranchCounts = () => {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["students", "count", { branch: null }],
        queryFn: () => getStudents({ page: 1, limit: 1 }),
      },
      ...STUDENT_BRANCHES.map((branch) => ({
        queryKey: ["students", "count", { branch }],
        queryFn: () => getStudents({ page: 1, limit: 1, branch }),
      })),
    ],
  });

  const [totalQuery, ...branchQueries] = queries;

  return {
    total: totalQuery?.data?.totalResults,
    isLoadingTotal: totalQuery?.isLoading ?? false,
    byBranch: Object.fromEntries(
      STUDENT_BRANCHES.map((branch, index) => [
        branch,
        {
          count: branchQueries[index]?.data?.totalResults,
          isLoading: branchQueries[index]?.isLoading ?? false,
        },
      ]),
    ) as Record<
      StudentBranch,
      { count: number | undefined; isLoading: boolean }
    >,
    isLoading: queries.some((query) => query.isLoading),
  };
};

export const useStudentsInfiniteQuery = (options?: {
  enabled?: boolean;
  pageSize?: number;
  branch?: StudentBranch;
}) => {
  const { enabled = true, pageSize = PAGE_SIZE, branch } = options ?? {};

  return useInfiniteQuery<UserResponse>({
    queryKey: ["students", "list", { pageSize, branch: branch ?? null }],
    queryFn: ({ pageParam }) =>
      getStudents({
        page: pageParam as number,
        limit: pageSize,
        ...(branch ? { branch } : {}),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled,
  });
};

export const searchStudents = async (
  query: string,
  params?: Pick<GetStudentsParams, "branch" | "page" | "limit" | "sortBy">,
): Promise<UserResponse> => {
  const trimmed = query.trim();
  const searchFilter = trimmed
    ? looksLikeRollNumberSearch(trimmed)
      ? { rollNumber: trimmed }
      : { name: trimmed }
    : {};

  return getStudents({
    ...params,
    ...searchFilter,
  });
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
  classId: string,
): Promise<StudentInClass[]> => {
  const response: ServerResponse<StudentInClass[]> = await client(
    `/classes/${classId}/students`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    },
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
    },
  );

  return response as unknown as User;
};

export interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
  profilePicture?: string;
  phoneNumber?: string;
  rollNumber?: string;
}

// Update student profile
export const updateStudentProfile = async (
  userId: string,
  profileData: UpdateProfileData,
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

// Get student progress for a specific class
export const getStudentProgress = async (
  studentId: string,
  classId: string,
  courseId: string,
): Promise<StudentProgressResponse> => {
  const response: ServerResponse<StudentProgressResponse> = await client(
    `/student-progress/student/${studentId}/class/${classId}?courseId=${courseId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    },
  );

  return response as unknown as StudentProgressResponse;
};
