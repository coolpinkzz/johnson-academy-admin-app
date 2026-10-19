"use client";

import { Search } from "lucide-react";
import type { MrtRecordSortField, MrtRecordStatus, MrtReportingRecord } from "@/types/mrtReporting";
import { formatScore, formatSubmittedAt } from "./format";

interface MrtRecordsTableProps {
  records: MrtReportingRecord[];
  page: number;
  totalPages: number;
  totalResults: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  search: string;
  status: "" | MrtRecordStatus;
  sortBy: MrtRecordSortField;
  sortOrder: "asc" | "desc";
  onSearch: (value: string) => void;
  onStatus: (value: "" | MrtRecordStatus) => void;
  onSort: (field: MrtRecordSortField) => void;
  onPage: (page: number) => void;
}

const COLUMNS: { id: MrtRecordSortField; header: string }[] = [
  { id: "studentName", header: "Student" },
  { id: "rollNumber", header: "Roll no." },
  { id: "branchName", header: "Branch" },
  { id: "teacherName", header: "Teacher" },
  { id: "className", header: "Class" },
  { id: "instrument", header: "Instrument" },
  { id: "month", header: "Month" },
  { id: "status", header: "Status" },
  { id: "totalScore", header: "Score" },
  { id: "submittedAt", header: "Submitted" },
];

function cellValue(record: MrtReportingRecord, field: MrtRecordSortField): string {
  switch (field) {
    case "studentName":
      return record.studentName;
    case "rollNumber":
      return record.rollNumber ?? "—";
    case "branchName":
      return record.branchName;
    case "teacherName":
      return record.teachers.map((teacher) => teacher.teacherName).join(", ") || "Unassigned";
    case "className":
      return record.className;
    case "instrument":
      return record.instrument;
    case "month":
      return record.monthLabel;
    case "status":
      return record.status === "submitted" ? "Submitted" : "Pending";
    case "totalScore":
      return formatScore(record.totalScore, 30);
    case "averageScore":
      return formatScore(record.averageScore, 5);
    case "submittedAt":
      return formatSubmittedAt(record.submittedAt);
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
}

export function MrtRecordsTable({
  records,
  page,
  totalPages,
  totalResults,
  isLoading,
  isError,
  errorMessage,
  search,
  status,
  sortBy,
  sortOrder,
  onSearch,
  onStatus,
  onSort,
  onPage,
}: MrtRecordsTableProps) {
  return (
    <section id="mrt-records" className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Detailed reports</h2>
          <p className="text-sm text-gray-500">
            One row is one student, class, course, and month. Pending means no MRT record exists.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block text-sm font-medium text-gray-700">
            <span className="sr-only">Search students</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search name or roll number"
              className="h-10 w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            <span className="sr-only">Report status</span>
            <select
              value={status}
              onChange={(event) => onStatus(event.target.value as "" | MrtRecordStatus)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm font-normal text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="missing">Pending</option>
            </select>
          </label>
        </div>
      </div>

      {isError ? (
        <p className="px-4 py-8 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {COLUMNS.map((column) => {
                  const active = sortBy === column.id;
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      aria-sort={active ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                      className="px-4 py-3 font-medium"
                    >
                      <button
                        type="button"
                        onClick={() => onSort(column.id)}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        {column.header}
                        <span aria-hidden className="text-[10px]">
                          {active ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading && records.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-gray-500">
                    Loading reports…
                  </td>
                </tr>
              ) : null}
              {!isLoading && records.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-gray-500">
                    No MRT rows match these filters.
                  </td>
                </tr>
              ) : null}
              {records.map((record) => (
                <tr
                  key={`${record.studentId}-${record.classId}-${record.courseId}-${record.month}`}
                  className="border-t border-gray-100"
                >
                  {COLUMNS.map((column) => (
                    <td key={column.id} className="whitespace-nowrap px-4 py-3 text-gray-800">
                      {column.id === "status" ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            record.status === "submitted"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {cellValue(record, column.id)}
                        </span>
                      ) : column.id === "totalScore" ? (
                        <div className="text-right">
                          <div className="font-medium tabular-nums">{formatScore(record.totalScore, 30)}</div>
                          <div className="text-xs tabular-nums text-gray-500">
                            {formatScore(record.averageScore, 5)} avg
                          </div>
                        </div>
                      ) : (
                        cellValue(record, column.id)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <p>{isLoading ? "Updating results…" : `${totalResults} rows`}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1 || isLoading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="tabular-nums">
            Page {totalPages === 0 ? 0 : page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={totalPages === 0 || page >= totalPages || isLoading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
