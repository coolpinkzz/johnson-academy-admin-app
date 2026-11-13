import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { ServerResponse } from "@/models/common/client";
import { PAGE_SIZE } from "@/constant";
import type {
  AvailableCompensationClass,
  ClassAvailabilityResponse,
  CompensationBooking,
  CompensationBookingResponse,
  CreateCompensationBookingPayload,
  GetCompensationBookingsParams,
  ListAvailableClassesParams,
} from "@/types/compensation";
import { getApiErrorMessage } from "@/lib/utils";
import { AuthService } from "./auth";
import { client } from "./api-client";

function authHeaders() {
  return {
    Authorization: `Bearer ${AuthService.getAccessToken()}`,
  };
}

function buildBookingsSearchParams(
  params?: GetCompensationBookingsParams,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params?.page != null) searchParams.set("page", String(params.page));
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.studentId) searchParams.set("studentId", params.studentId);
  if (params?.homeClassId) searchParams.set("homeClassId", params.homeClassId);
  if (params?.targetClassId)
    searchParams.set("targetClassId", params.targetClassId);
  if (params?.date) searchParams.set("date", params.date);
  if (params?.status) searchParams.set("status", params.status);

  return searchParams;
}

export const getCompensationBookings = async (
  params?: GetCompensationBookingsParams,
): Promise<CompensationBookingResponse> => {
  const searchParams = buildBookingsSearchParams({
    page: 1,
    limit: PAGE_SIZE,
    sortBy: "date:asc",
    ...params,
  });
  const qs = searchParams.toString();
  const response: ServerResponse<CompensationBookingResponse> = await client(
    `/compensation/bookings${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  return response as unknown as CompensationBookingResponse;
};

export const useCompensationBookings = (
  params?: GetCompensationBookingsParams,
  options?: { enabled?: boolean },
) => {
  const { enabled = true } = options ?? {};

  return useQuery<CompensationBookingResponse>({
    queryKey: ["compensation", "bookings", params ?? {}],
    queryFn: () => getCompensationBookings(params),
    enabled,
  });
};

export const getCompensationBookingById = async (
  bookingId: string,
): Promise<CompensationBooking> => {
  const response: ServerResponse<CompensationBooking> = await client(
    `/compensation/bookings/${bookingId}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  return response as unknown as CompensationBooking;
};

export const listAvailableCompensationClasses = async (
  params: ListAvailableClassesParams,
): Promise<AvailableCompensationClass[]> => {
  const searchParams = new URLSearchParams();
  searchParams.set("date", params.date);
  if (params.branch) searchParams.set("branch", params.branch);
  if (params.homeClassId) searchParams.set("homeClassId", params.homeClassId);
  if (params.excludeClassId)
    searchParams.set("excludeClassId", params.excludeClassId);

  const response: ServerResponse<AvailableCompensationClass[]> = await client(
    `/compensation/available-classes?${searchParams.toString()}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  return response as unknown as AvailableCompensationClass[];
};

export const useAvailableCompensationClasses = (
  params: ListAvailableClassesParams | null,
  options?: { enabled?: boolean },
) => {
  const { enabled = true } = options ?? {};
  const canFetch = Boolean(params?.date);

  return useQuery<AvailableCompensationClass[]>({
    queryKey: ["compensation", "available-classes", params ?? {}],
    queryFn: () => listAvailableCompensationClasses(params!),
    enabled: enabled && canFetch,
  });
};

export const getClassCompensationAvailability = async (
  classId: string,
  date: string,
): Promise<ClassAvailabilityResponse> => {
  const response: ServerResponse<ClassAvailabilityResponse> = await client(
    `/compensation/classes/${classId}/availability?date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  return response as unknown as ClassAvailabilityResponse;
};

export const createCompensationBooking = async (
  payload: CreateCompensationBookingPayload,
): Promise<CompensationBooking> => {
  const response: ServerResponse<CompensationBooking> = await client(
    `/compensation/bookings`,
    {
      method: "POST",
      headers: authHeaders(),
      data: payload,
    },
  );

  return response as unknown as CompensationBooking;
};

export const cancelCompensationBooking = async (
  bookingId: string,
): Promise<CompensationBooking> => {
  const response: ServerResponse<CompensationBooking> = await client(
    `/compensation/bookings/${bookingId}/cancel`,
    {
      method: "POST",
      headers: authHeaders(),
    },
  );

  return response as unknown as CompensationBooking;
};

export const useCreateCompensationBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompensationBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensation"] });
      toast.success("Compensation booked successfully");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(getApiErrorMessage(error, "Failed to book compensation"));
    },
  });
};

export const useCancelCompensationBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelCompensationBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensation"] });
      toast.success("Compensation booking cancelled");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        getApiErrorMessage(error, "Failed to cancel compensation booking"),
      );
    },
  });
};
