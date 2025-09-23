import { ServerResponse } from "@/models/common/client";
import { client } from "./api-client";
import { AuthService } from "./auth";
import {
  MonthlyReportRequest,
  MonthlyReportResponse,
  ReportCheckResponse,
  StudentMonthlyReportRequest,
  StudentMonthlyReportResponse,
} from "@/types/reports";

export const generateMonthlyReport = async (
  request: MonthlyReportRequest
): Promise<MonthlyReportResponse> => {
  try {
    // Use the actual PDF generation endpoint
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(
      `${baseUrl}/pdf/attendance?studentId=${request.studentId}&classId=${request.classId}&month=${request.month}`,
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

    // Get the PDF blob
    const blob = await response.blob();

    // Create a temporary URL for the blob
    const reportUrl = URL.createObjectURL(blob);

    // Generate filename
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
    // If it's a blob URL, fetch it directly
    if (reportUrl.startsWith("blob:")) {
      const response = await fetch(reportUrl);
      return await response.blob();
    }

    // If it's a regular URL, use the authorization header
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
  request: MonthlyReportRequest
): Promise<boolean> => {
  // Since we're generating reports on-demand, we don't need to check if they exist
  // This function is kept for compatibility but always returns false
  return false;
};

export const getStudentMonthlyReport = async (
  request: StudentMonthlyReportRequest
): Promise<StudentMonthlyReportResponse> => {
  try {
    const response = await client(
      `/mrt/student/${request.studentId}/class/${request.classId}/month/${request.month}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      }
    );

    const data: StudentMonthlyReportResponse =
      response as unknown as StudentMonthlyReportResponse;
    return data;
  } catch (error) {
    console.error("Error fetching student monthly report:", error);
    throw error;
  }
};
