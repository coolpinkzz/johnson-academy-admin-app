import { ticketStatusLabel } from "@/lib/tickets";
import { TicketStatus } from "@/types/ticket";

const STYLES: Record<TicketStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-sky-100 text-sky-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-700",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      {ticketStatusLabel(status)}
    </span>
  );
}
