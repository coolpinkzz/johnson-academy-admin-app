import { ClassFormData, ClassResponse, IClass } from "@/types/class";
import { AuthService } from "./auth";
import { client } from "./api-client";
import { ServerResponse } from "@/models/common/client";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

export const getClasses = async (): Promise<ClassResponse> => {
  try {
    const response: ServerResponse<ClassResponse> = await client("/classes", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
      page: 1,
      limit: 100,
    });

    return response as unknown as ClassResponse;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
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
  classData: Partial<IClass>,
): Promise<IClass> => {
  const response: ServerResponse<IClass> = await client(`/classes/${classId}`, {
    method: "PUT",
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
        error?.response?.data?.message || "Error adding student to class",
      );
    },
  });
};
