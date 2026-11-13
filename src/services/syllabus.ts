// get all syllabus

import { client } from "./api-client";
import { AuthService } from "./auth";

export const getSyllabus = async (): Promise<any> => {
  const response = await client(`/syllabi/all`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    page: 1,
    limit: 100,
  });
  return response;
};

// create syllabus
export const createSyllabus = async (syllabusData: any): Promise<any> => {
  const response = await client(`/syllabi`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
    data: syllabusData,
  });
  return response;
};

// delete syllabus
export const deleteSyllabus = async (syllabusId: string): Promise<any> => {
  const response = await client(`/syllabi/${syllabusId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });
  return response;
};
