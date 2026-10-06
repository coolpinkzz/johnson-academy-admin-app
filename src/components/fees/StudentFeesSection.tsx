"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  ChevronDown,
  ChevronRight,
  IndianRupee,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import {
  describePackageTiming,
  formatDuration,
  formatRupees,
  formatShortDate,
  groupPackagesByCourse,
} from "@/lib/fees";
import {
  useAddPayment,
  useCancelPackage,
  useCreatePackage,
  useStudentFees,
  useUpdatePackage,
  useVoidPayment,
} from "@/services/studentFee";
import type { Course } from "@/types/user";
import type { FeePackage, FeePayment, PaymentType } from "@/types/studentFee";
import { PAYMENT_METHOD_LABELS, getRefundableAmount } from "@/types/studentFee";
import { PackageForm } from "./PackageForm";
import { PaymentForm } from "./PaymentForm";
import { ReasonForm } from "./ReasonForm";
import { PaymentStatusBadge, RenewalStatusBadge } from "./FeeStatusBadge";

type StudentFeesSectionProps = {
  studentId: string;
  enrolledCourses: Course[];
};

export function StudentFeesSection({
  studentId,
  enrolledCourses,
}: StudentFeesSectionProps) {
  const { openModal } = useModal();
  const { data, isLoading, error } = useStudentFees(studentId);
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const cancelPackage = useCancelPackage();
  const addPayment = useAddPayment();
  const voidPayment = useVoidPayment();

  const courseOptions = useMemo(
    () =>
      enrolledCourses.map((course) => ({
        id: course.id,
        name: course.name,
        instrument: course.instrument,
      })),
    [enrolledCourses],
  );

  const groups = useMemo(() => {
    const fromPackages = groupPackagesByCourse(data?.packages ?? []);
    const known = new Set(fromPackages.map((group) => group.courseId));
    const missing = enrolledCourses
      .filter((course) => course.id && !known.has(course.id))
      .map((course) => ({
        courseId: course.id,
        courseName: course.name,
        instrument: course.instrument ?? null,
        current: null,
        history: [],
      }));
    return [...fromPackages, ...missing];
  }, [data?.packages, enrolledCourses]);

  const openPackageForm = (options?: {
    defaultCourseId?: string;
    lockCourse?: boolean;
    renewalOf?: FeePackage;
    editing?: FeePackage;
  }) => {
    const title = options?.editing
      ? "Edit package"
      : options?.renewalOf
        ? "Renew package"
        : "Add package";
    openModal({
      title,
      size: "lg",
      content: (
        <PackageForm
          studentId={studentId}
          enrolledCourses={courseOptions}
          defaultCourseId={options?.defaultCourseId}
          lockCourse={options?.lockCourse}
          renewalOf={options?.renewalOf}
          editing={options?.editing}
          isPending={createPackage.isPending || updatePackage.isPending}
          onCreate={async (payload) => {
            await createPackage.mutateAsync(payload);
          }}
          onUpdate={async (packageId, payload) => {
            await updatePackage.mutateAsync({ packageId, payload });
          }}
        />
      ),
    });
  };

  const openPaymentForm = (pkg: FeePackage, type: PaymentType) => {
    const refundable = getRefundableAmount(pkg);
    const remaining = Math.max(pkg.balance, 0);
    openModal({
      title: type === "refund" ? "Record refund" : "Record payment",
      size: "lg",
      content: (
        <PaymentForm
          type={type}
          defaultAmount={type === "refund" ? refundable : remaining || undefined}
          maxAmount={type === "refund" ? refundable : undefined}
          isPending={addPayment.isPending}
          onSubmit={async (payload) => {
            await addPayment.mutateAsync({ packageId: pkg.id, payload });
          }}
        />
      ),
    });
  };

  const openCancelForm = (pkg: FeePackage) => {
    openModal({
      title: "Cancel package",
      size: "md",
      content: (
        <ReasonForm
          submitLabel="Cancel package"
          pendingLabel="Cancelling…"
          description="This package will stay in history. Payments must already be voided or refunded."
          isPending={cancelPackage.isPending}
          onSubmit={async (reason) => {
            await cancelPackage.mutateAsync({ packageId: pkg.id, reason });
          }}
        />
      ),
    });
  };

  const openVoidForm = (payment: FeePayment) => {
    openModal({
      title: "Void payment",
      size: "md",
      content: (
        <ReasonForm
          submitLabel="Void payment"
          pendingLabel="Voiding…"
          description="The payment stays on the record as voided. Package totals will be recalculated."
          isPending={voidPayment.isPending}
          onSubmit={async (reason) => {
            await voidPayment.mutateAsync({ paymentId: payment.id, reason });
          }}
        />
      ),
    });
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Fees &amp; Packages
          </h3>
          <p className="text-sm text-gray-600">
            Current packages, payments, and renewals for this student
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            openPackageForm({
              defaultCourseId:
                enrolledCourses.length === 1 ? enrolledCourses[0]?.id : undefined,
              lockCourse: enrolledCourses.length === 1,
            })
          }
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add package
        </button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading fee records…</p>
        ) : error ? (
          <p className="text-sm text-red-600">
            Could not load fee records. You may not have access to this student&apos;s
            branch.
          </p>
        ) : groups.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm font-medium text-gray-900 mb-1">No package yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Add this student&apos;s current package to start tracking fees.
            </p>
            <button
              type="button"
              onClick={() => openPackageForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add package
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <CourseFeeCard
                key={group.courseId}
                courseName={group.courseName}
                instrument={group.instrument}
                current={group.current}
                history={group.history}
                onAdd={() =>
                  openPackageForm({
                    defaultCourseId: group.courseId,
                    lockCourse: group.courseId !== "unknown",
                  })
                }
                onEdit={(pkg) => openPackageForm({ editing: pkg, lockCourse: true })}
                onRenew={(pkg) =>
                  openPackageForm({
                    renewalOf: pkg,
                    defaultCourseId: group.courseId,
                    lockCourse: true,
                  })
                }
                onPay={(pkg) => openPaymentForm(pkg, "payment")}
                onRefund={(pkg) => openPaymentForm(pkg, "refund")}
                onCancel={openCancelForm}
                onVoid={openVoidForm}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CourseFeeCard({
  courseName,
  instrument,
  current,
  history,
  onAdd,
  onEdit,
  onRenew,
  onPay,
  onRefund,
  onCancel,
  onVoid,
}: {
  courseName: string;
  instrument: string | null;
  current: FeePackage | null;
  history: FeePackage[];
  onAdd: () => void;
  onEdit: (pkg: FeePackage) => void;
  onRenew: (pkg: FeePackage) => void;
  onPay: (pkg: FeePackage) => void;
  onRefund: (pkg: FeePackage) => void;
  onCancel: (pkg: FeePackage) => void;
  onVoid: (payment: FeePayment) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const canCancel = current ? getRefundableAmount(current) === 0 : false;
  const canRefund = current ? getRefundableAmount(current) > 0 : false;

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex flex-col gap-2 border-b bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">{courseName}</h4>
          {instrument ? (
            <p className="text-xs text-gray-500">{instrument}</p>
          ) : null}
        </div>
        {!current ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add package
          </button>
        ) : null}
      </div>

      <div className="p-4 space-y-4">
        {current ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <RenewalStatusBadge status={current.renewalStatus} />
              <PaymentStatusBadge status={current.paymentStatus} />
              <span className="text-sm text-gray-500">
                {describePackageTiming(current)}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InfoCell
                label="Period"
                value={`${formatShortDate(current.startDate)} – ${formatShortDate(current.endDate)}`}
              />
              <InfoCell label="Duration" value={formatDuration(current.durationMonths)} />
              <InfoCell label="Amount" value={formatRupees(current.amount)} />
              <InfoCell
                label="Pending"
                value={formatRupees(Math.max(current.balance, 0))}
              />
            </dl>
            <p className="text-xs text-gray-500">
              Received {formatRupees(current.amountPaid)}
              {current.amountRefunded > 0
                ? ` · Refunded ${formatRupees(current.amountRefunded)}`
                : ""}
            </p>
            {current.notes ? (
              <p className="text-sm text-gray-600">Note: {current.notes}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <ActionButton icon={Plus} label="Record payment" onClick={() => onPay(current)} />
              <ActionButton icon={RefreshCw} label="Renew" onClick={() => onRenew(current)} />
              <ActionButton icon={Pencil} label="Edit" onClick={() => onEdit(current)} />
              {canRefund ? (
                <ActionButton
                  icon={RotateCcw}
                  label="Refund"
                  onClick={() => onRefund(current)}
                />
              ) : null}
              <ActionButton
                icon={Ban}
                label="Cancel"
                onClick={() => onCancel(current)}
                disabled={!canCancel}
                title={
                  canCancel
                    ? undefined
                    : "Void or refund payments before cancelling"
                }
              />
            </div>

            <PaymentTable payments={current.payments} onVoid={onVoid} />
          </>
        ) : (
          <p className="text-sm text-gray-500">No current package for this course.</p>
        )}

        {history.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => setShowHistory((open) => !open)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              aria-expanded={showHistory}
            >
              {showHistory ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Previous packages ({history.length})
            </button>
            {showHistory ? (
              <div className="mt-3 space-y-3">
                {history.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="rounded-md border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <RenewalStatusBadge status={pkg.renewalStatus} />
                      <PaymentStatusBadge status={pkg.paymentStatus} />
                      <span className="text-sm text-gray-600">
                        {formatShortDate(pkg.startDate)} – {formatShortDate(pkg.endDate)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatRupees(pkg.amount)}
                      </span>
                    </div>
                    {pkg.cancelReason ? (
                      <p className="mb-2 text-xs text-gray-500">
                        Cancelled: {pkg.cancelReason}
                      </p>
                    ) : null}
                    <PaymentTable payments={pkg.payments} onVoid={onVoid} compact />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function PaymentTable({
  payments,
  onVoid,
  compact = false,
}: {
  payments: FeePayment[];
  onVoid: (payment: FeePayment) => void;
  compact?: boolean;
}) {
  if (payments.length === 0) {
    return <p className="text-sm text-gray-500">No payments recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th scope="col" className="py-2 pr-3">
              Date
            </th>
            <th scope="col" className="py-2 pr-3">
              Type
            </th>
            <th scope="col" className="py-2 pr-3">
              Amount
            </th>
            {!compact ? (
              <th scope="col" className="py-2 pr-3">
                Method
              </th>
            ) : null}
            <th scope="col" className="py-2 pr-3">
              Transaction ID
            </th>
            <th scope="col" className="py-2 pr-3">
              Status
            </th>
            <th scope="col" className="py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((payment) => (
            <tr key={payment.id} className="text-gray-800">
              <td className="py-2 pr-3 whitespace-nowrap">
                {formatShortDate(payment.paidAt)}
              </td>
              <td className="py-2 pr-3 capitalize">{payment.type}</td>
              <td className="py-2 pr-3 whitespace-nowrap">
                {formatRupees(payment.amount)}
              </td>
              {!compact ? (
                <td className="py-2 pr-3">{PAYMENT_METHOD_LABELS[payment.method]}</td>
              ) : null}
              <td className="py-2 pr-3 font-mono text-xs">
                {payment.reference || "—"}
              </td>
              <td className="py-2 pr-3 capitalize">{payment.status}</td>
              <td className="py-2">
                {payment.status === "completed" ? (
                  <button
                    type="button"
                    onClick={() => onVoid(payment)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Void
                  </button>
                ) : payment.voidReason ? (
                  <span className="text-xs text-gray-500">{payment.voidReason}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
