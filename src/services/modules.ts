import { client } from "./api-client";
import { AuthService } from "./auth";
import { ServerResponse } from "@/models/common/client";
import {
  IModule,
  IModuleCreate,
  IModuleUpdate,
  ModuleResponse,
  ModuleType,
} from "@/types/module";

export const getModules = async (
  page: number = 1,
  limit: number = 10,
  syllabusId?: string,
): Promise<ModuleResponse> => {
  const endpoint = syllabusId
    ? `/modules?syllabusId=${syllabusId}`
    : `/modules`;
  const response: ServerResponse<ModuleResponse> = await client(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    page,
    limit,
  });
  return response as unknown as ModuleResponse;
};

export const getModulesByType = async (
  type: ModuleType,
): Promise<ModuleResponse> => {
  const response: ServerResponse<ModuleResponse> = await client(
    `/modules?type=${type}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    },
  );
  return response as unknown as ModuleResponse;
};

export const createModule = async (
  moduleData: IModuleCreate,
): Promise<IModule> => {
  const response: ServerResponse<IModule> = await client(`/modules`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: moduleData,
  });
  return response as unknown as IModule;
};

export const updateModule = async (
  id: string,
  moduleData: IModuleUpdate,
): Promise<IModule> => {
  const response: ServerResponse<IModule> = await client(`/modules/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: moduleData,
  });
  return response as unknown as IModule;
};

export const deleteModule = async (id: string): Promise<void> => {
  await client(`/modules/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });
};
