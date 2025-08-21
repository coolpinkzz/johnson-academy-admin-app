import { ClassResponse, IClass } from "@/types/class";
import { AuthService } from "./auth";
import { client } from "./api-client";
import { ServerResponse } from "@/models/common/client";

export const getClasses = async (): Promise<ClassResponse> => {
  const response: ServerResponse<ClassResponse> = await client("/classes", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });

  return response as unknown as ClassResponse;
};

export const createClass = async (classData: IClass): Promise<IClass> => {
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
  classData: Partial<IClass>
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
  studentIds: string[]
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
