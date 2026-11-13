import {
  ClassFormData,
  ClassResponse,
  ClassesByTeacherResponse,
  GetClassesParams,
  IClass,
} from "@/types/class";
import { AuthService } from "./auth";
import { client } from "./api-client";
import { ServerResponse } from "@/models/common/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

function buildClassesSearchParams(params?: GetClassesParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params?.page != null) searchParams.set("page", String(params.page));
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.name) searchParams.set("name", params.name);
  if (params?.code) searchParams.set("code", params.code);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.branch) searchParams.set("branch", params.branch);
  if (params?.gradeLevel) searchParams.set("gradeLevel", params.gradeLevel);
  if (params?.academicYear)
    searchParams.set("academicYear", params.academicYear);
  if (params?.allowsCompensationInbound != null) {
    searchParams.set(
      "allowsCompensationInbound",
      String(params.allowsCompensationInbound),
    );
  }
  if (params?.allowsCompensationOutbound != null) {
    searchParams.set(
      "allowsCompensationOutbound",
      String(params.allowsCompensationOutbound),
    );
  }
  if (params?.teacherId) searchParams.set("teacherId", params.teacherId);
  if (params?.courseId) searchParams.set("courseId", params.courseId);

  return searchParams;
}

export const getClasses = async (
  params?: GetClassesParams,
): Promise<ClassResponse> => {
  try {
    const searchParams = buildClassesSearchParams({
      page: 1,
      limit: 200,
      ...params,
    });
    const qs = searchParams.toString();
    const response: ServerResponse<ClassResponse> = await client(
      `/classes${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      },
    );

    return response as unknown as ClassResponse;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

export const useClasses = (
  params?: GetClassesParams,
  options?: { enabled?: boolean },
) => {
  const { enabled = true } = options ?? {};
  return useQuery<ClassResponse>({
    queryKey: ["classes", "list", params ?? {}],
    queryFn: () => getClasses(params),
    enabled,
  });
};

export const getClassById = async (classId: string): Promise<IClass> => {
  try {
    const response: ServerResponse<IClass> = await client(
      `/classes/${classId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      },
    );

    return response as unknown as IClass;
  } catch (error) {
    console.error("Error fetching class:", error);
    throw error;
  }
};

export const getClassesByTeacher = async (
  teacherId: string,
): Promise<ClassesByTeacherResponse> => {
  try {
    const response: ServerResponse<ClassesByTeacherResponse> = await client(
      `/classes/teacher/${teacherId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      },
    );

    return response as unknown as ClassesByTeacherResponse;
  } catch (error) {
    console.error("Error fetching classes by teacher:", error);
    throw error;
  }
};

export const useClassesByTeacher = (
  teacherId: string,
  options?: { enabled?: boolean },
) => {
  const { enabled = true } = options ?? {};
  return useQuery<ClassesByTeacherResponse>({
    queryKey: ["classes", "teacher", teacherId],
    queryFn: () => getClassesByTeacher(teacherId),
    enabled: enabled && Boolean(teacherId),
  });
};

export const createClass = async (
  classData: ClassFormData,
): Promise<IClass> => {
  const response: ServerResponse<IClass> = await client("/classes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: classData,
  });

  return response as unknown as IClass;
};

export const updateClass = async (
  classId: string,
  classData: ClassFormData | Partial<ClassFormData>,
): Promise<IClass> => {
  const response: ServerResponse<IClass> = await client(`/classes/${classId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: classData,
  });

  return response as unknown as IClass;
};

export const deleteClass = async (classId: string) => {
  const response = await client(`/classes/${classId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });

  return response;
};

export const bulkAddStudents = async (
  classId: string,
  studentIds: string[],
) => {
  const response = await client(`/classes/${classId}/students/bulk-add`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
      "Content-Type": "application/json",
    },
    data: {
      studentIds,
    },
  });

  return response;
};

export const addSingleStudentToClass = async (
  classId: string,
  studentId: string,
  courseId: string,
) => {
  const response = await client(`/classes/${classId}/add-student`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: {
      studentId,
      courseId,
    },
  });

  return response;
};

export const removeStudentFromClass = async (
  classId: string,
  studentId: string,
  courseId: string,
) => {
  const response = await client(`/classes/${classId}/remove-student`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: {
      studentId,
      courseId,
    },
  });

  return response;
};

export const transferStudentToClass = async (
  fromClassId: string,
  studentId: string,
  targetClassId: string,
) => {
  const response = await client(`/classes/${fromClassId}/transfer-student`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: {
      studentId,
      targetClassId,
    },
  });

  return response;
};

function getAxiosErrorMessage(
  error: AxiosError<{ message?: string }>,
  fallback: string,
): string {
  return error?.response?.data?.message || fallback;
}

// create a react query hook to add a single student to a class
export const useAddSingleStudentToClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      studentId,
      courseId,
    }: {
      classId: string;
      studentId: string;
      courseId: string;
    }) => addSingleStudentToClass(classId, studentId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Student added to class successfully");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        getAxiosErrorMessage(error, "Error adding student to class"),
      );
    },
  });
};

// React Query hook to remove a student from a class
export const useRemoveStudentFromClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      studentId,
      courseId,
    }: {
      classId: string;
      studentId: string;
      courseId: string;
    }) => removeStudentFromClass(classId, studentId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Student removed from class successfully");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        getAxiosErrorMessage(error, "Error removing student from class"),
      );
    },
  });
};

export const useTransferStudentToClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fromClassId,
      studentId,
      targetClassId,
    }: {
      fromClassId: string;
      studentId: string;
      targetClassId: string;
    }) => transferStudentToClass(fromClassId, studentId, targetClassId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Student moved to the new class successfully");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        getAxiosErrorMessage(error, "Error moving student to another class"),
      );
    },
  });
};

export const useBulkAddStudents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      studentIds,
    }: {
      classId: string;
      studentIds: string[];
    }) => bulkAddStudents(classId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Students added to class successfully");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(
        getAxiosErrorMessage(error, "Error adding students to class"),
      );
    },
  });
};
