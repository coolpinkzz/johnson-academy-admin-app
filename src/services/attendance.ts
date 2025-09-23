import { ServerResponse } from "@/models/common/client";
import { client } from "./api-client";
import { AuthService } from "./auth";
import {
  AttendanceData,
  AttendanceResponse,
  MarkAttendanceResponse,
} from "@/types/attendance";

/**
 * Mark student attendance as present
 * @param attendanceData - Object containing studentId, classId, and date
 * @returns Promise<MarkAttendanceResponse>
 */
export const markAttendanceAsPresent = async (
  attendanceData: AttendanceData
): Promise<MarkAttendanceResponse> => {
  try {
    // First get the attendance record to get the attendance ID
    const attendanceRecord = await getStudentAttendance(
      attendanceData.studentId,
      attendanceData.classId
    );

    if (!attendanceRecord?.results || attendanceRecord.results.length === 0) {
      throw new Error("No attendance record found for this student");
    }

    const attendanceId = attendanceRecord.results[0].id;

    const response: ServerResponse<MarkAttendanceResponse> = await client(
      `/student-attendance/${attendanceId}/present`,
      {
        method: "POST",
        data: attendanceData,
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      }
    );

    return response as unknown as MarkAttendanceResponse;
  } catch (error) {
    console.error("Error marking attendance as present:", error);
    throw error;
  }
};

/**
 * Mark student attendance as absent
 * @param attendanceData - Object containing studentId, classId, and date
 * @returns Promise<MarkAttendanceResponse>
 */
export const markAttendanceAsAbsent = async (
  attendanceData: AttendanceData
): Promise<MarkAttendanceResponse> => {
  try {
    // First get the attendance record to get the attendance ID
    const attendanceRecord = await getStudentAttendance(
      attendanceData.studentId,
      attendanceData.classId
    );

    if (!attendanceRecord?.results || attendanceRecord.results.length === 0) {
      throw new Error("No attendance record found for this student");
    }

    const attendanceId = attendanceRecord.results[0].id;

    const response: ServerResponse<MarkAttendanceResponse> = await client(
      `/student-attendance/${attendanceId}/absent`,
      {
        method: "POST",
        data: attendanceData,
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      }
    );

    return response as unknown as MarkAttendanceResponse;
  } catch (error) {
    console.error("Error marking attendance as absent:", error);
    throw error;
  }
};

/**
 * Get attendance details for a specific student in a specific class
 * @param studentId - Student ID
 * @param classId - Class ID
 * @returns Promise<any>
 */
export const getStudentAttendance = async (
  studentId: string,
  classId: string
): Promise<AttendanceResponse> => {
  try {
    const response: ServerResponse<AttendanceResponse> = await client(
      `/student-attendance?studentId=${studentId}&classId=${classId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
        },
      }
    );

    return response as unknown as AttendanceResponse;
  } catch (error) {
    console.error("Error fetching student attendance details:", error);
    throw error;
  }
};
