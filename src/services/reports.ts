import { ServerResponse } from "@/models/common/client";
import { client } from "./api-client";
import { AuthService } from "./auth";
import {
  MonthlyReportRequest,
  MonthlyReportResponse,
  StudentMonthlyReportRequest,
  StudentMonthlyReportResponse,
  MRTListParams,
  MRTListResponse,
} from "@/types/reports";

const buildMRTQueryString = (params: MRTListParams): string => {
  const searchParams = new URLSearchParams();
  if (params.courseId) searchParams.set("courseId", params.courseId);
  if (params.classId) searchParams.set("classId", params.classId);
  if (params.studentId) searchParams.set("studentId", params.studentId);
  if (params.month) searchParams.set("month", params.month);
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const generateMonthlyReport = async (
  request: MonthlyReportRequest
): Promise<MonthlyReportResponse> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const params = new URLSearchParams({
      studentId: request.studentId,
      classId: request.classId,
      courseId: request.courseId,
      month: request.month,
    });
    const response = await fetch(
      `${baseUrl}/pdf/attendance?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const reportUrl = URL.createObjectURL(blob);
    const fileName = `attendance-report-${request.studentId}-${request.month}.pdf`;

    return {
      reportUrl,
      fileName,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating monthly report:", error);
    throw error;
  }
};

export const downloadReport = async (reportUrl: string): Promise<Blob> => {
  try {
    if (reportUrl.startsWith("blob:")) {
      const response = await fetch(reportUrl);
      return await response.blob();
    }

    const response = await fetch(reportUrl, {
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download report");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error downloading report:", error);
    throw error;
  }
};

export const checkReportExists = async (
  _request: MonthlyReportRequest
): Promise<boolean> => {
  return false;
};

export const getMRTs = async (
  params: MRTListParams = {}
): Promise<MRTListResponse> => {
  const response: ServerResponse<MRTListResponse> = await client(
    `/mrt${buildMRTQueryString(params)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    }
  );

  return response as unknown as MRTListResponse;
};

export const getMRTsByStudent = async (
  studentId: string,
  params: Omit<MRTListParams, "studentId"> = {}
): Promise<MRTListResponse> => {
  const response: ServerResponse<MRTListResponse> = await client(
    `/mrt/student/${studentId}${buildMRTQueryString(params)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    }
  );

  return response as unknown as MRTListResponse;
};

export const getMRTsByClass = async (
  classId: string,
  params: Omit<MRTListParams, "classId"> = {}
): Promise<MRTListResponse> => {
  const response: ServerResponse<MRTListResponse> = await client(
    `/mrt/class/${classId}${buildMRTQueryString(params)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AuthService.getAccessToken()}`,
      },
    }
  );

  return response as unknown as MRTListResponse;
};

export const getStudentMonthlyReport = async (
  request: StudentMonthlyReportRequest
): Promise<StudentMonthlyReportResponse> => {
  try {
    const params = new URLSearchParams({ courseId: request.courseId });
    const response = await client(
      `/mrt/student/${request.studentId}/class/${request.classId}/month/${request.month}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      }
    );

    return response as unknown as StudentMonthlyReportResponse;
  } catch (error) {
    console.error("Error fetching student monthly report:", error);
    throw error;
  }
};
