import { STAFF_ROLE_LABELS, StaffRole, isStaffRole } from "@/lib/rbac";
import {
  TicketActivity,
  TicketStatus,
} from "@/types/ticket";

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const ALLOWED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress"],
  in_progress: ["open", "resolved"],
  resolved: ["closed", "in_progress"],
  closed: ["in_progress"],
};

export function ticketStatusLabel(status: TicketStatus): string {
  return STATUS_LABELS[status];
}

export function formatTicketDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatResolutionDays(days: number | null | undefined): string {
  if (days == null) return "—";
  if (days === 0) return "Same day";
  if (days === 1) return "1 day";
  const rounded = Number.isInteger(days) ? String(days) : days.toFixed(1);
  return `${rounded} days`;
}

export function staffRoleLabel(role: string | undefined): string {
  if (role && isStaffRole(role)) {
    return STAFF_ROLE_LABELS[role as StaffRole];
  }
  return role ?? "";
}

export function activitySummary(activity: TicketActivity): string {
  switch (activity.type) {
    case "created":
      return "Raised this concern";
    case "assigned":
      return `Assigned to ${activity.toAssignee?.name ?? "a staff member"}`;
    case "reassigned":
      return `Reassigned from ${activity.fromAssignee?.name ?? "the previous assignee"} to ${activity.toAssignee?.name ?? "a staff member"}`;
    case "unassigned":
      return "Removed the assignee";
    case "status_changed":
      return `Changed status from ${activity.fromStatus ? ticketStatusLabel(activity.fromStatus) : "the previous status"} to ${activity.toStatus ? ticketStatusLabel(activity.toStatus) : "a new status"}`;
    case "comment":
      return activity.body ?? "";
    default:
      return "Updated the ticket";
  }
}
