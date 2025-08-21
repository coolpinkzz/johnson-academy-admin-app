// get all modules

import { client } from "./api-client";
import { AuthService } from "./auth";

export const getModules = async (
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  //pagination
  const response = await client(`/modules`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    page,
    limit,
  });
  return response;
};

// get modules by type
export const getModulesByType = async (type: string): Promise<any> => {
  const response = await client(`/modules?type=${type}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });
  return response;
};

// create module
export const createModule = async (moduleData: any): Promise<any> => {
  const response = await client(`/modules`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: moduleData,
  });
  return response;
};

// delete module
export const deleteModule = async (id: string): Promise<any> => {
  const response = await client(`/modules/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });
  return response;
};
