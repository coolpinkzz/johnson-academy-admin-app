"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { BookCompensationModal } from "@/components/modal/BookCompensationModal";
import {
  CompensationBookingDetail,
  CompensationStatusBadge,
} from "@/components/modal/CompensationBookingDetail";
import { ConfirmationDialog } from "@/components/modal/ConfirmationDialog";
import { DatePicker } from "@/components/DatePicker";
import { useModalContext } from "@/contexts/ModalContext";
import { formatClassScheduleSummary } from "@/lib/class-validation";
import { formatDisplayDate } from "@/lib/utils";
import {
  getCompensationWhatsAppPhone,
  openCompensationWhatsApp,
} from "@/lib/whatsapp";
import {
  useCancelCompensationBooking,
  useCompensationBookings,
} from "@/services/compensation";
import type {
  CompensationBooking,
  CompensationBookingStatus,
} from "@/types/compensation";
import {
  getCompensationRefName,
  isCompensationDatePast,
  toCompensationDateKey,
  todayInIndia,
} from "@/types/compensation";
import { ArrowRight, Eye, Plus, RefreshCw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

type StatusFilter = "all" | CompensationBookingStatus;
type DatePreset = "upcoming" | "today" | "all" | "custom";

function studentLabel(booking: CompensationBooking): string {
  if (typeof booking.studentId === "object" && booking.studentId) {
    const roll = booking.studentId.rollNumber
      ? ` · ${booking.studentId.rollNumber}`
      : "";
    return `${booking.studentId.name}${roll}`;
  }
  return getCompensationRefName(booking.studentId, "Unknown student");
}

function classLabel(ref: CompensationBooking["homeClassId"]): string {
  if (typeof ref === "object" && ref) {
    return ref.branch ? `${ref.name} (B${ref.branch})` : ref.name;
  }
  return getCompensationRefName(ref, "—");
}

const CompensationPage = () => {
  const { openModal, closeModal } = useModalContext();
  const cancelMutation = useCancelCompensationBooking();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("confirmed");
  const [datePreset, setDatePreset] = useState<DatePreset>("upcoming");
  const [customDate, setCustomDate] = useState(todayInIndia());
  const [page, setPage] = useState(1);

  const listParams = useMemo(() => {
    const params: {
      page: number;
      limit: number;
      sortBy: string;
      status?: CompensationBookingStatus;
      date?: string;
    } = {
      page: datePreset === "upcoming" ? 1 : page,
      // BE has no date-range filter; load a wider window then keep today+ locally
      limit: datePreset === "upcoming" ? 100 : 20,
      // upcoming: newest/future first so the window isn't filled with old past bookings
      sortBy:
        datePreset === "upcoming" || datePreset === "all"
          ? "date:desc"
          : "date:asc",
    };

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (datePreset === "today") {
      params.date = todayInIndia();
    } else if (datePreset === "custom") {
      params.date = customDate;
    }

    return params;
  }, [page, statusFilter, datePreset, customDate]);

  const { data, isLoading, error, refetch, isFetching } =
    useCompensationBookings(listParams);

  const bookings = useMemo(() => {
    const results = data?.results ?? [];
    if (datePreset !== "upcoming") return results;
    const today = todayInIndia();
    return results
      .filter((booking) => toCompensationDateKey(booking.date) >= today)
      .sort((a, b) =>
        toCompensationDateKey(a.date).localeCompare(toCompensationDateKey(b.date)),
      );
  }, [data?.results, datePreset]);

  const openBookModal = () => {
    openModal({
      title: "Book compensation",
      content: (
        <BookCompensationModal
          onSuccess={() => {
            setStatusFilter("confirmed");
            setDatePreset("upcoming");
            setPage(1);
          }}
        />
      ),
      size: "half",
      closeOnOverlayClick: false,
    });
  };

  const openCancelConfirm = (booking: CompensationBooking) => {
    const name = studentLabel(booking);
    const dateKey = toCompensationDateKey(booking.date);

    openModal({
      title: "Cancel compensation",
      content: (
        <ConfirmationDialog
          type="warning"
          title="Cancel this booking?"
          message={`Cancel compensation for ${name} on ${dateKey ? formatDisplayDate(dateKey) : "this date"}? The guest seat will be released.`}
          confirmLabel="Cancel booking"
          cancelLabel="Keep booking"
          onConfirm={() => {
            cancelMutation.mutate(booking.id, {
              onSuccess: () => closeModal(),
            });
          }}
          onCancel={() => closeModal()}
        />
      ),
      size: "sm",
      closeOnOverlayClick: false,
      showCloseButton: false,
    });
  };

  const handleShareWhatsApp = (booking: CompensationBooking) => {
    const opened = openCompensationWhatsApp(booking);
    if (!opened) {
      toast.error(
        "Student phone number is missing or invalid. Add it on the student profile.",
      );
    }
  };

  const openDetail = (booking: CompensationBooking) => {
    openModal({
      title: "Compensation details",
      content: (
        <CompensationBookingDetail
          booking={booking}
          isCancelling={cancelMutation.isPending}
          onClose={() => closeModal()}
          onCancel={
            booking.status === "confirmed" &&
            !isCompensationDatePast(booking.date)
              ? () => {
                  closeModal();
                  // Allow detail modal to close before opening confirm
                  setTimeout(() => openCancelConfirm(booking), 0);
                }
              : undefined
          }
        />
      ),
      size: "lg",
    });
  };

  const resetFilters = () => {
    setStatusFilter("confirmed");
    setDatePreset("upcoming");
    setCustomDate(todayInIndia());
    setPage(1);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center gap-2 border-b bg-white px-4">
          <div className="flex flex-1 items-center justify-between px-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Compensation
              </h1>
              <p className="text-sm text-gray-600">
                Book guest seats when students need to make up a class
              </p>
            </div>
            <button
              type="button"
              onClick={openBookModal}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Book compensation
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {/* Filters */}
          <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { value: "confirmed", label: "Confirmed" },
                        { value: "cancelled", label: "Cancelled" },
                        { value: "all", label: "All" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(option.value);
                          setPage(1);
                        }}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          statusFilter === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Date
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { value: "upcoming", label: "Upcoming" },
                        { value: "today", label: "Today" },
                        { value: "all", label: "All dates" },
                        { value: "custom", label: "Pick date" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setDatePreset(option.value);
                          setPage(1);
                        }}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          datePreset === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-md px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Reset
                </button>
              </div>
            </div>

            {datePreset === "custom" && (
              <div className="mt-4 max-w-xs">
                <DatePicker
                  value={customDate}
                  onChange={(next) => {
                    setCustomDate(next);
                    setPage(1);
                  }}
                  label="Filter date"
                />
              </div>
            )}

            {typeof data?.totalResults === "number" && (
              <p className="mt-3 text-sm text-gray-600">
                {datePreset === "upcoming"
                  ? `${bookings.length} upcoming on this page`
                  : `${data.totalResults} booking${data.totalResults === 1 ? "" : "s"}`}
                {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
                {datePreset === "today"
                  ? ` · ${formatDisplayDate(todayInIndia())}`
                  : ""}
                {datePreset === "custom" && customDate
                  ? ` · ${formatDisplayDate(customDate)}`
                  : ""}
              </p>
            )}
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="mb-4 inline-flex h-8 w-8 animate-spin items-center justify-center rounded-full border-4 border-blue-200 border-t-blue-600" />
                  <p className="text-gray-500">Loading compensation bookings...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="mb-2 font-medium text-gray-900">
                    Failed to load bookings
                  </p>
                  <p className="mb-4 text-gray-500">
                    Check your connection and try again
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <ArrowRight className="h-6 w-6 text-gray-500" />
                  </div>
                  <p className="mb-2 font-medium text-gray-900">
                    No compensation bookings
                  </p>
                  <p className="mb-4 text-gray-500">
                    {statusFilter === "confirmed" && datePreset === "upcoming"
                      ? "No upcoming confirmed guest seats. Book one when a student needs a makeup class."
                      : "Nothing matches these filters."}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Reset filters
                    </button>
                    <button
                      type="button"
                      onClick={openBookModal}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Book compensation
                    </button>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Home → Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {bookings.map((booking) => {
                      const dateKey = toCompensationDateKey(booking.date);
                      const target =
                        typeof booking.targetClassId === "object"
                          ? booking.targetClassId
                          : null;
                      const schedule = target
                        ? formatClassScheduleSummary(target)
                        : null;
                      const canCancel =
                        booking.status === "confirmed" &&
                        !isCompensationDatePast(booking.date);
                      const canShare =
                        booking.status === "confirmed" &&
                        Boolean(getCompensationWhatsAppPhone(booking));

                      return (
                        <tr
                          key={booking.id}
                          onClick={() => openDetail(booking)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {dateKey ? (
                              <>
                                <span className="font-medium">
                                  {formatDisplayDate(dateKey).split(",")[0]}
                                </span>
                                <span className="mt-0.5 block text-xs text-gray-500">
                                  {dateKey}
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {studentLabel(booking)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                              <span className="text-gray-600">
                                {classLabel(booking.homeClassId)}
                              </span>
                              <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-blue-500 sm:block" />
                              <div>
                                <span className="font-medium">
                                  {classLabel(booking.targetClassId)}
                                </span>
                                {schedule ? (
                                  <span className="mt-0.5 block text-xs text-gray-500">
                                    {schedule}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <CompensationStatusBadge status={booking.status} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => openDetail(booking)}
                                className="flex items-center gap-1 rounded px-2 py-1 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              {canShare && (
                                <button
                                  type="button"
                                  onClick={() => handleShareWhatsApp(booking)}
                                  className="rounded px-2 py-1 text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                                >
                                  WhatsApp
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => openCancelConfirm(booking)}
                                  disabled={cancelMutation.isPending}
                                  className="flex items-center gap-1 rounded px-2 py-1 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {data && data.totalPages > 1 && datePreset !== "upcoming" && (
              <div className="flex items-center justify-between border-t px-6 py-3">
                <p className="text-sm text-gray-600">
                  Page {data.page} of {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CompensationPage;
