import { AuthService } from "./auth";
import { client } from "./api-client";
import type { DashboardAggregates } from "@/types/dashboard";

/** GET /v1/dashboard/aggregates when base URL includes /v1 */
export const getDashboardAggregates = async (): Promise<DashboardAggregates> => {
  const response = await client("/dashboard/aggregates", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
    },
  });

  return response as unknown as DashboardAggregates;
};
