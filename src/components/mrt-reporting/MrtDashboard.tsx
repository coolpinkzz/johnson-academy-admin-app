"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Clock3, Percent, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { getMrtReportingDashboard, reportingErrorMessage } from "@/services/mrtReporting";
import type { MrtBranchRow, MrtInstrumentRow, MrtTeacherRow } from "@/types/mrtReporting";
import { formatCount, formatPercent, formatScore, formatSigned, monthLabel } from "./format";
import {
  emptyMrtFilters,
  MrtFilters,
  toDashboardParams,
  toFilterOptionParams,
  type MrtFilterValues,
} from "./MrtFilters";
import { CompletionCell, CountCell, MrtLeaderboard, type LeaderboardColumn } from "./MrtLeaderboard";

function metricColumns<
  T extends {
    eligibleStudents: number;
    expected: number;
    submitted: number;
    missing: number;
    completionPercentage: number | null;
    averageTotalScore: number | null;
    averageScore: number | null;
  },
>(): LeaderboardColumn<T>[] {
  return [
    {
      id: "eligibleStudents",
      header: "Students",
      align: "right",
      sortValue: (row) => row.eligibleStudents,
      render: (row) => <CountCell value={row.eligibleStudents} />,
    },
    {
      id: "expected",
      header: "Expected",
      align: "right",
      sortValue: (row) => row.expected,
      render: (row) => <CountCell value={row.expected} />,
    },
    {
      id: "submitted",
      header: "Submitted",
      align: "right",
      sortValue: (row) => row.submitted,
      render: (row) => <CountCell value={row.submitted} />,
    },
    {
      id: "missing",
      header: "Pending",
      align: "right",
      sortValue: (row) => row.missing,
      render: (row) => <CountCell value={row.missing} />,
    },
    {
      id: "completionPercentage",
      header: "Completion",
      align: "right",
      sortValue: (row) => row.completionPercentage,
      render: (row) => <CompletionCell value={row.completionPercentage} />,
    },
    {
      id: "averageTotalScore",
      header: "Score",
      align: "right",
      sortValue: (row) => row.averageTotalScore,
      render: (row) => (
        <div className="text-right">
          <div className="font-medium tabular-nums text-gray-900">
            {formatScore(row.averageTotalScore, 30)}
          </div>
          <div className="text-xs tabular-nums text-gray-500">{formatScore(row.averageScore, 5)} avg</div>
        </div>
      ),
    },
  ];
}

export function MrtDashboard() {
  const [filters, setFilters] = useState<MrtFilterValues>(emptyMrtFilters);
  const dashboardParams = toDashboardParams(filters);
  const optionParams = toFilterOptionParams(filters);

  const optionsQuery = useQuery({
    queryKey: ["mrt-reporting", "dashboard", optionParams],
    queryFn: () => getMrtReportingDashboard(optionParams),
    placeholderData: keepPreviousData,
  });

  const dashboardQuery = useQuery({
    queryKey: ["mrt-reporting", "dashboard", dashboardParams],
    queryFn: () => getMrtReportingDashboard(dashboardParams),
    placeholderData: keepPreviousData,
  });

  const data = dashboardQuery.data;
  const teacherColumns = useMemo<LeaderboardColumn<MrtTeacherRow>[]>(
    () => [
      {
        id: "name",
        header: "Teacher",
        sortValue: (row) => row.teacherName,
        render: (row) => row.teacherName,
      },
      {
        id: "branches",
        header: "Branches",
        render: (row) => row.branches.map((item) => item.branchName).join(", ") || "—",
      },
      ...metricColumns<MrtTeacherRow>(),
    ],
    [],
  );
  const branchColumns = useMemo<LeaderboardColumn<MrtBranchRow>[]>(
    () => [
      {
        id: "name",
        header: "Branch",
        sortValue: (row) => row.branchName,
        render: (row) => row.branchName,
      },
      ...metricColumns<MrtBranchRow>(),
    ],
    [],
  );
  const instrumentColumns = useMemo<LeaderboardColumn<MrtInstrumentRow>[]>(
    () => [
      {
        id: "name",
        header: "Instrument",
        sortValue: (row) => row.instrument,
        render: (row) => row.instrument,
      },
      ...metricColumns<MrtInstrumentRow>(),
    ],
    [],
  );

  const summary = data?.summary;
  const comparison = data?.comparison;
  const reportingMonth = data?.filters.monthFrom ?? filters.month;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center border-b bg-white px-4 sm:px-6">
        <div className="flex w-full items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">MRT Dashboard</h1>
            <p className="text-sm text-gray-600">
              Monthly report completion for {monthLabel(reportingMonth)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void optionsQuery.refetch();
              void dashboardQuery.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${optionsQuery.isFetching || dashboardQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-6 bg-gray-50 p-4 sm:p-6">
        <MrtFilters
          values={filters}
          options={optionsQuery.data?.options}
          errorMessage={
            optionsQuery.isError
              ? reportingErrorMessage(optionsQuery.error, "Unable to load filters.")
              : undefined
          }
          onChange={setFilters}
          onReset={() => setFilters(emptyMrtFilters())}
        />

        {dashboardQuery.isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {reportingErrorMessage(dashboardQuery.error, "Unable to load MRT reporting.")}
          </p>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Expected reports"
            value={summary ? formatCount(summary.expected) : "—"}
            icon={<ClipboardCheck className="h-5 w-5" />}
            tone="bg-blue-50 text-blue-700"
            loading={dashboardQuery.isLoading}
          />
          <SummaryCard
            label="Submitted"
            value={summary ? formatCount(summary.submitted) : "—"}
            icon={<ClipboardCheck className="h-5 w-5" />}
            tone="bg-emerald-50 text-emerald-700"
            loading={dashboardQuery.isLoading}
          />
          <SummaryCard
            label="Pending"
            value={summary ? formatCount(summary.missing) : "—"}
            icon={<Clock3 className="h-5 w-5" />}
            tone="bg-amber-50 text-amber-800"
            loading={dashboardQuery.isLoading}
          />
          <SummaryCard
            label="Completion"
            value={formatPercent(summary?.completionPercentage)}
            icon={<Percent className="h-5 w-5" />}
            tone="bg-violet-50 text-violet-700"
            loading={dashboardQuery.isLoading}
          />
        </section>

        {comparison ? (
          <p className="text-sm text-gray-600">
            {monthLabel(comparison.month)} versus {monthLabel(comparison.previousMonth)}:{" "}
            <span className="font-medium text-gray-900">
              {formatSigned(comparison.submittedDelta)} submitted
            </span>
            {comparison.completionPercentageDelta == null
              ? ". Completion change is unavailable when either month has no expected reports."
              : ` and ${formatSigned(comparison.completionPercentageDelta, 1)} pts completion.`}
            {summary ? ` ${formatCount(summary.eligibleStudents)} students are included.` : ""}
          </p>
        ) : null}

        <MrtLeaderboard
          title="Teacher performance"
          description="Each teacher on a class is counted. Shared classes appear on every assigned teacher."
          rows={data?.teachers ?? []}
          columns={teacherColumns}
          getRowId={(row) => row.teacherId}
          isLoading={dashboardQuery.isLoading}
          defaultSortId="completionPercentage"
          emptyMessage="No teacher enrollments match these filters."
        />

        <MrtLeaderboard
          title="Branch performance"
          description="Class branch for each enrollment."
          rows={data?.branches ?? []}
          columns={branchColumns}
          getRowId={(row) => row.branch}
          isLoading={dashboardQuery.isLoading}
          defaultSortId="completionPercentage"
          emptyMessage="No branch enrollments match these filters."
        />

        <MrtLeaderboard
          title="Instrument performance"
          description="Instrument comes from the enrolled course."
          rows={data?.instruments ?? []}
          columns={instrumentColumns}
          getRowId={(row) => row.instrument}
          isLoading={dashboardQuery.isLoading}
          defaultSortId="completionPercentage"
          emptyMessage="No instrument enrollments match these filters."
        />

        {data?.notes?.length ? (
          <details className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-800">How these numbers are calculated</summary>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {data.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className={`rounded-lg p-2.5 ${tone}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-gray-900">{loading ? "…" : value}</p>
      </div>
    </div>
  );
}
