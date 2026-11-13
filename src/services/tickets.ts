import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ServerResponse } from "@/models/common/client";
import { PAGE_SIZE } from "@/constant";
import {
  GetTicketsParams,
  TicketAssigneeOption,
  TicketDetail,
  TicketListResponse,
  TicketStats,
  TicketStatus,
} from "@/types/ticket";
import { AuthService } from "./auth";
import { client } from "./api-client";

function authHeaders() {
  return {
    Authorization: `Bearer ${AuthService.getAccessToken()}`,
  };
}

function buildTicketSearchParams(params?: GetTicketsParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params?.page ?? 1));
  searchParams.set("limit", String(params?.limit ?? PAGE_SIZE));
  searchParams.set("sortBy", params?.sortBy ?? "createdAt:desc");
  if (params?.status) searchParams.set("status", params.status);
  if (params?.assigneeId) searchParams.set("assigneeId", params.assigneeId);
  if (params?.unassigned) searchParams.set("unassigned", "true");
  if (params?.search) searchParams.set("search", params.search);
  return searchParams.toString();
}

export const getTickets = async (
  params?: GetTicketsParams,
): Promise<TicketListResponse> => {
  const response: ServerResponse<TicketListResponse> = await client(
    `/tickets?${buildTicketSearchParams(params)}`,
    { method: "GET", headers: authHeaders() },
  );
  return response as unknown as TicketListResponse;
};

export const getTicket = async (ticketId: string): Promise<TicketDetail> => {
  const response: ServerResponse<TicketDetail> = await client(
    `/tickets/${ticketId}`,
    { method: "GET", headers: authHeaders() },
  );
  return response as unknown as TicketDetail;
};

export const getTicketStats = async (): Promise<TicketStats> => {
  const response: ServerResponse<TicketStats> = await client("/tickets/stats", {
    method: "GET",
    headers: authHeaders(),
  });
  return response as unknown as TicketStats;
};

export const getTicketAssignees = async (): Promise<TicketAssigneeOption[]> => {
  const response: ServerResponse<TicketAssigneeOption[]> = await client(
    "/tickets/assignees",
    { method: "GET", headers: authHeaders() },
  );
  return response as unknown as TicketAssigneeOption[];
};

export const updateTicketAssignment = async (
  ticketId: string,
  assigneeId: string | null,
): Promise<TicketDetail> => {
  const response: ServerResponse<TicketDetail> = await client(
    `/tickets/${ticketId}/assignment`,
    {
      method: "PATCH",
      data: { assigneeId },
      headers: authHeaders(),
    },
  );
  return response as unknown as TicketDetail;
};

export const updateTicketStatus = async (
  ticketId: string,
  status: TicketStatus,
): Promise<TicketDetail> => {
  const response: ServerResponse<TicketDetail> = await client(
    `/tickets/${ticketId}/status`,
    {
      method: "PATCH",
      data: { status },
      headers: authHeaders(),
    },
  );
  return response as unknown as TicketDetail;
};

export const addTicketComment = async (
  ticketId: string,
  body: string,
): Promise<TicketDetail> => {
  const response: ServerResponse<TicketDetail> = await client(
    `/tickets/${ticketId}/comments`,
    {
      method: "POST",
      data: { body },
      headers: authHeaders(),
    },
  );
  return response as unknown as TicketDetail;
};

export const useTickets = (
  params: GetTicketsParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["tickets", "list", params],
    queryFn: () => getTickets(params),
    enabled: options?.enabled ?? true,
  });

export const useTicket = (ticketId: string) =>
  useQuery({
    queryKey: ["tickets", "detail", ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: ticketId.length > 0,
  });

export const useTicketStats = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["tickets", "stats"],
    queryFn: getTicketStats,
    enabled: options?.enabled ?? true,
  });

export const useTicketAssignees = () =>
  useQuery({
    queryKey: ["tickets", "assignees"],
    queryFn: getTicketAssignees,
  });

export const useTicketMutations = (ticketId: string) => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tickets", "detail", ticketId] }),
      queryClient.invalidateQueries({ queryKey: ["tickets", "list"] }),
      queryClient.invalidateQueries({ queryKey: ["tickets", "stats"] }),
    ]);
  };

  const assignment = useMutation({
    mutationFn: (assigneeId: string | null) =>
      updateTicketAssignment(ticketId, assigneeId),
    onSuccess: invalidate,
  });

  const status = useMutation({
    mutationFn: (nextStatus: TicketStatus) =>
      updateTicketStatus(ticketId, nextStatus),
    onSuccess: invalidate,
  });

  const comment = useMutation({
    mutationFn: (body: string) => addTicketComment(ticketId, body),
    onSuccess: invalidate,
  });

  return { assignment, status, comment };
};
