"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { PAGE_SIZE } from "@/constant";
import { getApiErrorMessage } from "@/lib/utils";
import {
  formatResolutionDays,
  formatTicketDate,
  staffRoleLabel,
  ticketStatusLabel,
  TICKET_STATUSES,
} from "@/lib/tickets";
import {
  useTicketAssignees,
  useTickets,
  useTicketStats,
} from "@/services/tickets";
import { TicketStatus } from "@/types/ticket";
import { Loader2, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type StatusFilter = "all" | TicketStatus;
type AssignmentFilter = "all" | "unassigned" | string;

function isTicketStatus(value: string | null): value is TicketStatus {
  return !!value && TICKET_STATUSES.includes(value as TicketStatus);
}

const TicketsPageContent = () => {
  const searchParams = useSearchParams();
  const initialStatus = isTicketStatus(searchParams.get("status"))
    ? searchParams.get("status")
    : "all";

  const [status, setStatus] = useState<StatusFilter>(
    (initialStatus as StatusFilter) ?? "all",
  );
  const [assignment, setAssignment] = useState<AssignmentFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      sortBy: "createdAt:desc",
      ...(status !== "all" ? { status } : {}),
      ...(assignment === "unassigned"
        ? { unassigned: true }
        : assignment !== "all"
          ? { assigneeId: assignment }
          : {}),
      ...(search ? { search } : {}),
    }),
    [page, status, assignment, search],
  );

  const statsQuery = useTicketStats();
  const assigneesQuery = useTicketAssignees();
  const ticketsQuery = useTickets(listParams);
  const stats = statsQuery.data;

  const statCards: Array<{
    key: string;
    label: string;
    value: string;
    onClick?: () => void;
    active?: boolean;
  }> = [
    {
      key: "total",
      label: "Total",
      value: String(stats?.total ?? 0),
      active: status === "all" && assignment === "all",
      onClick: () => {
        setStatus("all");
        setAssignment("all");
        setPage(1);
      },
    },
    {
      key: "open",
      label: "Open",
      value: String(stats?.open ?? 0),
      active: status === "open",
      onClick: () => {
        setStatus("open");
        setPage(1);
      },
    },
    {
      key: "in_progress",
      label: "In progress",
      value: String(stats?.inProgress ?? 0),
      active: status === "in_progress",
      onClick: () => {
        setStatus("in_progress");
        setPage(1);
      },
    },
    {
      key: "resolved",
      label: "Resolved",
      value: String(stats?.resolved ?? 0),
      active: status === "resolved",
      onClick: () => {
        setStatus("resolved");
        setPage(1);
      },
    },
    {
      key: "closed",
      label: "Closed",
      value: String(stats?.closed ?? 0),
      active: status === "closed",
      onClick: () => {
        setStatus("closed");
        setPage(1);
      },
    },
    {
      key: "unassigned",
      label: "Unassigned",
      value: String(stats?.unassigned ?? 0),
      active: assignment === "unassigned",
      onClick: () => {
        setAssignment("unassigned");
        setPage(1);
      },
    },
    {
      key: "average",
      label: "Avg. resolution",
      value: formatResolutionDays(stats?.averageResolutionDays),
    },
  ];

  const results = ticketsQuery.data?.results ?? [];
  const totalPages = ticketsQuery.data?.totalPages ?? 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Concerns</h1>
            <p className="text-sm text-gray-600">
              Student tickets from the time they are raised until they are
              resolved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              statsQuery.refetch();
              ticketsQuery.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        <main className="space-y-6 p-4 sm:p-6">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
            {statCards.map((card) => (
              <button
                key={card.key}
                type="button"
                disabled={!card.onClick}
                onClick={card.onClick}
                className={`rounded-2xl border p-4 text-left shadow-sm ${
                  card.active
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 bg-white"
                } ${card.onClick ? "hover:border-blue-200" : "cursor-default"}`}
              >
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                {statsQuery.isLoading ? (
                  <div className="mt-2 h-8 w-12 animate-pulse rounded bg-gray-100" />
                ) : (
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                )}
              </button>
            ))}
          </section>

          {stats?.byAssignee && stats.byAssignee.length > 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Assigned tickets
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {stats.byAssignee.map((item) => (
                  <li key={item.assignee.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignment(item.assignee.id);
                        setPage(1);
                      }}
                      className={`rounded-full px-3 py-1 text-sm ${
                        assignment === item.assignee.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {item.assignee.name}
                      {item.assignee.role
                        ? ` · ${staffRoleLabel(item.assignee.role)}`
                        : ""}{" "}
                      ({item.count})
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  Search
                </span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Subject, ticket, student, roll number"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
                  />
                </span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as StatusFilter);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All statuses</option>
                  {TICKET_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {ticketStatusLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  Assignee
                </span>
                <select
                  value={assignment}
                  onChange={(event) => {
                    setAssignment(event.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">Everyone</option>
                  <option value="unassigned">Unassigned</option>
                  {(assigneesQuery.data ?? []).map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name} · {staffRoleLabel(assignee.role)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {ticketsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : ticketsQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {getApiErrorMessage(
                ticketsQuery.error,
                "Couldn’t load concerns.",
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No concerns match these filters.
            </div>
          ) : (
            <ul className="space-y-3">
              {results.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-blue-700">
                          {ticket.displayId}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-gray-900">
                          {ticket.subject}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          {ticket.student.name}
                          {ticket.student.rollNumber
                            ? ` · ${ticket.student.rollNumber}`
                            : ""}
                        </p>
                      </div>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-gray-500">Assignee</dt>
                        <dd className="font-medium text-gray-900">
                          {ticket.assignee?.name ?? "Unassigned"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Raised</dt>
                        <dd className="font-medium text-gray-900">
                          {formatTicketDate(ticket.createdAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Resolved</dt>
                        <dd className="font-medium text-gray-900">
                          {formatTicketDate(ticket.resolvedAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Days</dt>
                        <dd className="font-medium text-gray-900">
                          {formatResolutionDays(ticket.resolutionDays)}
                        </dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </main>
      </div>
    </ProtectedRoute>
  );
};

const TicketsPage = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    }
  >
    <TicketsPageContent />
  </Suspense>
);

export default TicketsPage;
