"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatClassScheduleSummary } from "@/lib/class-validation";
import { formatDisplayDate } from "@/lib/utils";
import {
  getCompensationWhatsAppPhone,
  openCompensationWhatsApp,
} from "@/lib/whatsapp";
import type {
  CompensationBooking,
  CompensationBookingStatus,
  CompensationClassRef,
  CompensationUserRef,
} from "@/types/compensation";
import {
  getCompensationRefName,
  isCompensationDatePast,
  toCompensationDateKey,
} from "@/types/compensation";
import { toast } from "react-toastify";

function StatusBadge({ status }: { status: CompensationBookingStatus }) {
  const isConfirmed = status === "confirmed";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isConfirmed
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isConfirmed ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {isConfirmed ? "Confirmed" : "Cancelled"}
    </span>
  );
}

function asUser(
  ref: CompensationBooking["studentId"] | undefined | null,
): CompensationUserRef | null {
  if (!ref || typeof ref === "string") return null;
  return ref;
}

function asClass(
  ref: CompensationBooking["homeClassId"] | undefined | null,
): CompensationClassRef | null {
  if (!ref || typeof ref === "string") return null;
  return ref;
}

type Props = {
  booking: CompensationBooking;
  onCancel?: () => void;
  onClose: () => void;
  isCancelling?: boolean;
};

export function CompensationBookingDetail({
  booking,
  onCancel,
  onClose,
  isCancelling = false,
}: Props) {
  const student = asUser(booking.studentId);
  const homeClass = asClass(booking.homeClassId);
  const targetClass = asClass(booking.targetClassId);
  const bookedBy = asUser(booking.bookedBy ?? null);
  const cancelledBy = asUser(booking.cancelledBy ?? null);
  const dateKey = toCompensationDateKey(booking.date);
  const canCancel =
    booking.status === "confirmed" &&
    Boolean(onCancel) &&
    !isCompensationDatePast(booking.date);
  const whatsappPhone = getCompensationWhatsAppPhone(booking);
  const canShareWhatsApp =
    booking.status === "confirmed" && Boolean(whatsappPhone);

  const homeSchedule = homeClass
    ? formatClassScheduleSummary(homeClass)
    : null;
  const targetSchedule = targetClass
    ? formatClassScheduleSummary(targetClass)
    : null;

  const handleShareWhatsApp = () => {
    const opened = openCompensationWhatsApp(booking);
    if (!opened) {
      toast.error(
        "Student phone number is missing or invalid. Add it on the student profile.",
      );
    }
  };

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Status",
      value: <StatusBadge status={booking.status} />,
    },
    {
      label: "Date",
      value: dateKey ? formatDisplayDate(dateKey) : "—",
    },
    {
      label: "Student",
      value: (
        <span>
          {student?.name || getCompensationRefName(booking.studentId)}
          {student?.rollNumber ? (
            <span className="text-gray-500"> · Roll {student.rollNumber}</span>
          ) : null}
        </span>
      ),
    },
    {
      label: "Phone",
      value: student?.phoneNumber || (
        <span className="text-amber-700">Not on profile</span>
      ),
    },
    {
      label: "Home class",
      value: (
        <span>
          {homeClass?.name || getCompensationRefName(booking.homeClassId)}
          {homeClass?.branch ? ` · Branch ${homeClass.branch}` : ""}
          {homeSchedule ? (
            <span className="block text-xs text-gray-500">{homeSchedule}</span>
          ) : null}
        </span>
      ),
    },
    {
      label: "Target class",
      value: (
        <span>
          {targetClass?.name || getCompensationRefName(booking.targetClassId)}
          {targetClass?.branch ? ` · Branch ${targetClass.branch}` : ""}
          {targetSchedule ? (
            <span className="block text-xs text-gray-500">{targetSchedule}</span>
          ) : null}
        </span>
      ),
    },
    {
      label: "Booked by",
      value: bookedBy?.name || "—",
    },
    ...(booking.status === "cancelled"
      ? [
          {
            label: "Cancelled by",
            value: cancelledBy?.name || "—",
          },
          {
            label: "Cancelled at",
            value: booking.cancelledAt
              ? new Date(booking.cancelledAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—",
          },
        ]
      : []),
    {
      label: "Notes",
      value: booking.notes?.trim() || "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs text-gray-500">From</p>
          <p className="truncate text-sm font-semibold text-gray-900">
            {homeClass?.name || getCompensationRefName(booking.homeClassId)}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-blue-600" />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs text-gray-500">To</p>
          <p className="truncate text-sm font-semibold text-gray-900">
            {targetClass?.name || getCompensationRefName(booking.targetClassId)}
          </p>
        </div>
      </div>

      <dl className="overflow-hidden rounded-lg border border-gray-100 divide-y divide-gray-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-3 gap-2 bg-white px-3 py-2.5 text-sm"
          >
            <dt className="col-span-1 text-gray-500">{row.label}</dt>
            <dd className="col-span-2 min-w-0 break-words text-gray-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {booking.status === "confirmed" && isCompensationDatePast(booking.date) && (
        <p className="text-xs text-gray-500">
          This booking date has passed, so it can no longer be cancelled.
        </p>
      )}

      {booking.status === "confirmed" && !whatsappPhone && (
        <p className="text-xs text-amber-700">
          Add a phone number on the student profile to share via WhatsApp.
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        {booking.status === "confirmed" && (
          <Button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={!canShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            Share on WhatsApp
          </Button>
        )}
        {canCancel && (
          <Button
            type="button"
            variant="destructive"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel booking"}
          </Button>
        )}
      </div>
    </div>
  );
}

export { StatusBadge as CompensationStatusBadge };
