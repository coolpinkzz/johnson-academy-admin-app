"use client";

import type { MrtDashboardParams, MrtFilterOptions } from "@/types/mrtReporting";
import { currentReportingMonth, monthLabel } from "./format";

export interface MrtFilterValues {
  branch: string;
  teacherId: string;
  instrument: string;
  month: string;
}

export function emptyMrtFilters(): MrtFilterValues {
  return {
    branch: "",
    teacherId: "",
    instrument: "",
    month: currentReportingMonth(),
  };
}

export function toDashboardParams(values: MrtFilterValues): MrtDashboardParams {
  return {
    ...(values.branch ? { branch: values.branch } : {}),
    ...(values.teacherId ? { teacherId: values.teacherId } : {}),
    ...(values.instrument ? { instrument: values.instrument } : {}),
    ...(values.month ? { month: values.month } : {}),
  };
}

/** Branch, teacher, and instrument choices stay complete after a selection. */
export function toFilterOptionParams(values: MrtFilterValues): MrtDashboardParams {
  return values.month ? { month: values.month } : {};
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      {children}
    </label>
  );
}

const controlClass =
  "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm font-normal text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

export function MrtFilters({
  values,
  options,
  errorMessage,
  onChange,
  onReset,
}: {
  values: MrtFilterValues;
  options?: MrtFilterOptions;
  errorMessage?: string;
  onChange: (values: MrtFilterValues) => void;
  onReset: () => void;
}) {
  const monthOptions = options?.months ?? [];
  const monthChoices =
    values.month && monthOptions.some((option) => option.month === values.month)
      ? monthOptions
      : [{ month: values.month, label: monthLabel(values.month) }, ...monthOptions];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>
          <p className="text-sm text-gray-500">
            Pick one reporting month. A report is expected once per student, class, and course.
          </p>
        </div>
        <button type="button" onClick={onReset} className="text-sm font-medium text-blue-700 hover:underline">
          Reset
        </button>
      </div>
      {errorMessage ? (
        <p className="mb-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Branch">
          <select
            className={controlClass}
            value={values.branch}
            onChange={(event) => onChange({ ...values, branch: event.target.value })}
          >
            <option value="">All branches</option>
            {(options?.branches ?? []).map((option) => (
              <option key={option.branch} value={option.branch}>
                {option.branchName}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Teacher">
          <select
            className={controlClass}
            value={values.teacherId}
            onChange={(event) => onChange({ ...values, teacherId: event.target.value })}
          >
            <option value="">All teachers</option>
            {(options?.teachers ?? []).map((option) => (
              <option key={option.teacherId} value={option.teacherId}>
                {option.teacherName}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Instrument">
          <select
            className={controlClass}
            value={values.instrument}
            onChange={(event) => onChange({ ...values, instrument: event.target.value })}
          >
            <option value="">All instruments</option>
            {(options?.instruments ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Month">
          <select
            className={controlClass}
            value={values.month}
            onChange={(event) => onChange({ ...values, month: event.target.value })}
          >
            {monthChoices.map((option) => (
              <option key={option.month} value={option.month}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>
      </div>
    </section>
  );
}
