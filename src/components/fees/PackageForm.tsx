"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/DatePicker";
import { useModal } from "@/hooks/use-modal";
import {
  addDaysToKey,
  calculatePackageEndDate,
  formatShortDate,
  toDateKey,
} from "@/lib/fees";
import { useCourses } from "@/services/course";
import { todayInIndia } from "@/types/compensation";
import type { Course } from "@/types/course";
import type { CreatePackagePayload, FeePackage, UpdatePackagePayload } from "@/types/studentFee";
import { DURATION_PRESETS } from "@/types/studentFee";
import { FieldError, FieldHint, FieldLabel, fieldClassName } from "./FormField";
import { PaymentFields } from "./PaymentFields";
import {
  packageFormSchema,
  toPaymentPayload,
  type PackageFormValues,
} from "./feeFormSchemas";

type CourseOption = { id: string; name: string; instrument?: string | null };

type PackageFormProps = {
  studentId: string;
  enrolledCourses?: CourseOption[];
  defaultCourseId?: string;
  lockCourse?: boolean;
  renewalOf?: FeePackage;
  editing?: FeePackage;
  isPending?: boolean;
  onCreate: (payload: CreatePackagePayload) => Promise<void>;
  onUpdate?: (packageId: string, payload: UpdatePackagePayload) => Promise<void>;
};

const emptyPayment = (amount: number, paidAt: string) => ({
  amount,
  method: "upi" as const,
  reference: "",
  paidAt,
  notes: "",
});

function courseLabel(course: CourseOption): string {
  return course.instrument ? `${course.name} · ${course.instrument}` : course.name;
}

export function PackageForm({
  studentId,
  enrolledCourses = [],
  defaultCourseId,
  lockCourse = false,
  renewalOf,
  editing,
  isPending = false,
  onCreate,
  onUpdate,
}: PackageFormProps) {
  const { closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: coursesData, isLoading: isLoadingCourses } = useCourses();
  const isEdit = Boolean(editing);
  const isRenew = Boolean(renewalOf);

  const courseOptions = useMemo(() => {
    const fromApi = (coursesData?.results ?? []).map((course: Course) => ({
      id: course.id,
      name: course.name,
      instrument: course.instrument,
    }));
    const byId = new Map<string, CourseOption>();
    [...enrolledCourses, ...fromApi].forEach((course) => {
      if (course.id) byId.set(course.id, course);
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [coursesData?.results, enrolledCourses]);

  const resolvedCourseId =
    editing?.course?.id ||
    renewalOf?.course?.id ||
    defaultCourseId ||
    (enrolledCourses.length === 1 ? enrolledCourses[0]?.id : "") ||
    "";

  const defaultStart = editing
    ? toDateKey(editing.startDate)
    : renewalOf
      ? addDaysToKey(toDateKey(renewalOf.endDate), 1)
      : todayInIndia();

  const initialAmount = editing?.amount ?? renewalOf?.amount ?? 0;
  const initialDuration = editing?.durationMonths ?? renewalOf?.durationMonths ?? 12;

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      courseId: resolvedCourseId,
      startDate: defaultStart,
      durationMonths: initialDuration,
      customEndDate: false,
      amount: initialAmount,
      notes: editing?.notes ?? "",
      recordPayment: !isEdit,
      payment: emptyPayment(initialAmount > 0 ? initialAmount : 1, todayInIndia()),
    },
  });

  const recordPayment = form.watch("recordPayment");
  const startDate = form.watch("startDate");
  const durationMonths = form.watch("durationMonths");
  const customEndDate = form.watch("customEndDate");
  const amount = form.watch("amount");
  const paymentAmountDirty = Boolean(form.formState.dirtyFields.payment?.amount);
  const derivedEnd =
    startDate && durationMonths
      ? calculatePackageEndDate(startDate, Number(durationMonths) || 0)
      : "";

  useEffect(() => {
    if (isEdit || !recordPayment || paymentAmountDirty) return;
    if (typeof amount === "number" && amount >= 1) {
      form.setValue("payment.amount", amount);
    }
  }, [amount, form, isEdit, paymentAmountDirty, recordPayment]);

  useEffect(() => {
    if (customEndDate && derivedEnd && !form.getValues("endDate")) {
      form.setValue("endDate", derivedEnd);
    }
  }, [customEndDate, derivedEnd, form]);

  const busy = isPending || isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      if (isEdit && editing && onUpdate) {
        await onUpdate(editing.id, {
          startDate: values.startDate,
          durationMonths: values.durationMonths,
          amount: values.amount,
          notes: values.notes,
          ...(values.customEndDate && values.endDate ? { endDate: values.endDate } : {}),
        });
      } else {
        await onCreate({
          studentId,
          courseId: values.courseId,
          startDate: values.startDate,
          durationMonths: values.durationMonths,
          amount: values.amount,
          ...(values.customEndDate && values.endDate ? { endDate: values.endDate } : {}),
          ...(values.notes ? { notes: values.notes } : {}),
          ...(renewalOf ? { renewalOfId: renewalOf.id } : {}),
          ...(values.recordPayment && values.payment
            ? { initialPayment: toPaymentPayload(values.payment) }
            : {}),
        });
      }
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  });

  const presetActive = DURATION_PRESETS.includes(
    durationMonths as (typeof DURATION_PRESETS)[number],
  );
  const courseLocked = lockCourse || isEdit || isRenew;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="package-course">Course</FieldLabel>
          <select
            id="package-course"
            className={fieldClassName}
            disabled={courseLocked || isLoadingCourses}
            aria-invalid={Boolean(form.formState.errors.courseId)}
            aria-describedby="package-course-error"
            {...form.register("courseId")}
          >
            <option value="">
              {isLoadingCourses ? "Loading courses…" : "Select a course…"}
            </option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {courseLabel(course)}
              </option>
            ))}
          </select>
          <FieldError
            id="package-course-error"
            message={form.formState.errors.courseId?.message}
          />
        </div>

        <div>
          <FieldLabel htmlFor="package-duration">Duration</FieldLabel>
          <div className="mb-2 flex flex-wrap gap-2">
            {DURATION_PRESETS.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() =>
                  form.setValue("durationMonths", months, { shouldValidate: true })
                }
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  durationMonths === months
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {months === 12 ? "1 year" : `${months} month${months === 1 ? "" : "s"}`}
              </button>
            ))}
          </div>
          <input
            id="package-duration"
            type="number"
            inputMode="numeric"
            min={1}
            max={36}
            step={1}
            className={fieldClassName}
            aria-invalid={Boolean(form.formState.errors.durationMonths)}
            aria-describedby="package-duration-error"
            {...form.register("durationMonths", { valueAsNumber: true })}
          />
          <FieldError
            id="package-duration-error"
            message={form.formState.errors.durationMonths?.message}
          />
          {!presetActive && durationMonths ? (
            <FieldHint>Custom duration: {durationMonths} months</FieldHint>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} label="Start date" />
              )}
            />
            <FieldError
              id="package-start-error"
              message={form.formState.errors.startDate?.message}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-700">End date</span>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  {...form.register("customEndDate")}
                />
                Override
              </label>
            </div>
            {customEndDate ? (
              <Controller
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    label="Custom end date"
                  />
                )}
              />
            ) : (
              <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {derivedEnd ? formatShortDate(derivedEnd) : "—"}
              </p>
            )}
            <FieldError
              id="package-end-error"
              message={form.formState.errors.endDate?.message}
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="package-amount">Package amount (₹)</FieldLabel>
          <input
            id="package-amount"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            className={fieldClassName}
            aria-invalid={Boolean(form.formState.errors.amount)}
            aria-describedby="package-amount-error"
            {...form.register("amount", { valueAsNumber: true })}
          />
          <FieldError
            id="package-amount-error"
            message={form.formState.errors.amount?.message}
          />
        </div>

        <div>
          <FieldLabel htmlFor="package-notes" optional>
            Notes
          </FieldLabel>
          <input
            id="package-notes"
            type="text"
            maxLength={500}
            className={fieldClassName}
            {...form.register("notes")}
          />
          <FieldError
            id="package-notes-error"
            message={form.formState.errors.notes?.message}
          />
        </div>

        {!isEdit ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                {...form.register("recordPayment")}
              />
              Record a payment with this package
            </label>
            {recordPayment ? <PaymentFields /> : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => closeModal()}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy
              ? "Saving…"
              : isEdit
                ? "Update package"
                : isRenew
                  ? "Renew package"
                  : "Add package"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
