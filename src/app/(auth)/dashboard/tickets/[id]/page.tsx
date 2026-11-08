"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { getApiErrorMessage } from "@/lib/utils";
import {
  ALLOWED_STATUS_TRANSITIONS,
  activitySummary,
  formatResolutionDays,
  formatTicketDate,
  staffRoleLabel,
  ticketStatusLabel,
} from "@/lib/tickets";
import {
  useTicket,
  useTicketAssignees,
  useTicketMutations,
} from "@/services/tickets";
import { TicketStatus } from "@/types/ticket";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const TicketDetailPage = () => {
  const params = useParams();
  const ticketId = typeof params.id === "string" ? params.id : "";
  const ticketQuery = useTicket(ticketId);
  const assigneesQuery = useTicketAssignees();
  const mutations = useTicketMutations(ticketId);
  const ticket = ticketQuery.data;

  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!ticket) return;
    setAssigneeId(ticket.assignee?.id ?? "");
    setStatus(ticket.status);
  }, [ticket]);

  const assigneeOptions = useMemo(() => {
    const options = assigneesQuery.data ?? [];
    if (
      ticket?.assignee &&
      !options.some((option) => option.id === ticket.assignee?.id)
    ) {
      return [
        {
          id: ticket.assignee.id,
          name: ticket.assignee.name,
          role: ticket.assignee.role ?? "admin",
        },
        ...options,
      ];
    }
    return options;
  }, [assigneesQuery.data, ticket?.assignee]);

  const statusOptions = useMemo(() => {
    if (!ticket) return [];
    return [ticket.status, ...ALLOWED_STATUS_TRANSITIONS[ticket.status]];
  }, [ticket]);

  const savedAssigneeId = ticket?.assignee?.id ?? "";
  const assignmentChanged = assigneeId !== savedAssigneeId;
  const statusChanged = !!ticket && status !== ticket.status;
  const statusNeedsAssignee =
    !!ticket && status !== "open" && !ticket.assignee && statusChanged;

  const saveAssignment = async () => {
    try {
      await mutations.assignment.mutateAsync(assigneeId || null);
      toast.success(assigneeId ? "Ticket assigned." : "Assignee removed.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn’t update the assignee."));
    }
  };

  const saveStatus = async () => {
    try {
      await mutations.status.mutateAsync(status);
      toast.success("Status updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn’t update the status."));
    }
  };

  const saveComment = async () => {
    const body = comment.trim();
    if (!body) return;
    try {
      await mutations.comment.mutateAsync(body);
      setComment("");
      toast.success("Note added. The student will be notified.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn’t add the note."));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white px-4 py-4 sm:px-6">
          <Link
            href="/dashboard/tickets"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All concerns
          </Link>
        </header>

        <main className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
          {ticketQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : ticketQuery.isError || !ticket ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {getApiErrorMessage(
                ticketQuery.error,
                "This concern could not be found.",
              )}
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">
                      {ticket.displayId}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900">
                      {ticket.subject}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                      {ticket.student.name}
                      {ticket.student.rollNumber
                        ? ` · ${ticket.student.rollNumber}`
                        : ""}
                    </p>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {ticket.description}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Raised</dt>
                    <dd className="font-medium text-gray-900">
                      {formatTicketDate(ticket.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">First assigned</dt>
                    <dd className="font-medium text-gray-900">
                      {formatTicketDate(ticket.firstAssignedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Resolved</dt>
                    <dd className="font-medium text-gray-900">
                      {formatTicketDate(ticket.resolvedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Days to resolve</dt>
                    <dd className="font-medium text-gray-900">
                      {formatResolutionDays(ticket.resolutionDays)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-base font-semibold text-gray-900">
                  Assignment
                </h2>
                <label className="mt-3 block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">
                    Assignee
                  </span>
                  <select
                    value={assigneeId}
                    onChange={(event) => setAssigneeId(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="" disabled={ticket.status !== "open"}>
                      Unassigned
                    </option>
                    {assigneeOptions.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name} · {staffRoleLabel(assignee.role)}
                      </option>
                    ))}
                  </select>
                </label>
                {ticket.status !== "open" ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Move the ticket back to Open before removing the assignee.
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={!assignmentChanged || mutations.assignment.isPending}
                  onClick={saveAssignment}
                  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {mutations.assignment.isPending ? "Saving…" : "Save assignment"}
                </button>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-base font-semibold text-gray-900">Status</h2>
                <label className="mt-3 block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">
                    Next status
                  </span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as TicketStatus)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {ticketStatusLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                {statusNeedsAssignee ? (
                  <p className="mt-2 text-sm text-amber-700">
                    Assign someone and save that assignment before moving this
                    ticket out of Open.
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={
                    !statusChanged ||
                    statusNeedsAssignee ||
                    mutations.status.isPending
                  }
                  onClick={saveStatus}
                  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {mutations.status.isPending ? "Saving…" : "Update status"}
                </button>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-base font-semibold text-gray-900">
                  Note for the student
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Students can read every note. Adding one sends them a push
                  notification.
                </p>
                <label className="mt-3 block text-sm">
                  <span className="sr-only">Note</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="What did you find, or how was this resolved?"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
                <button
                  type="button"
                  disabled={!comment.trim() || mutations.comment.isPending}
                  onClick={saveComment}
                  className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {mutations.comment.isPending ? "Sending…" : "Add note"}
                </button>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-base font-semibold text-gray-900">
                  History
                </h2>
                <ol className="mt-4 space-y-4">
                  {ticket.activities.map((activity, index) => (
                    <li key={`${activity.at}-${activity.type}-${index}`} className="border-l-2 border-gray-200 pl-4">
                      <p className="text-xs text-gray-500">
                        {formatTicketDate(activity.at)}
                        {activity.actor?.name ? ` · ${activity.actor.name}` : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                        {activitySummary(activity)}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TicketDetailPage;
