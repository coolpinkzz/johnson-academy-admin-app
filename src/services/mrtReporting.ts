import axios from "axios";
import { client } from "./api-client";
import { AuthService } from "./auth";
import type {
  MrtDashboardParams,
  MrtRecordParams,
  MrtReportingDashboard,
  MrtReportingRecords,
} from "@/types/mrtReporting";

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    const text = String(value).trim();
    if (!text) return;
    search.set(key, text);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function authHeaders(): { Authorization: string } {
  return { Authorization: `Bearer ${AuthService.getAccessToken()}` };
}

export const getMrtReportingDashboard = async (
  params: MrtDashboardParams,
): Promise<MrtReportingDashboard> => {
  const response = await client(`/mrt/reporting/dashboard${toQuery(params)}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return response as unknown as MrtReportingDashboard;
};

export const getMrtReportingRecords = async (
  params: MrtRecordParams,
): Promise<MrtReportingRecords> => {
  const response = await client(`/mrt/reporting/records${toQuery(params)}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return response as unknown as MrtReportingRecords;
};

export function reportingErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }
  }
  return fallback;
}
