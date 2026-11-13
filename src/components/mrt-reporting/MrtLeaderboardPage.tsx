"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getMrtReportingDashboard,
  getMrtReportingRecords,
  reportingErrorMessage,
} from "@/services/mrtReporting";
import type { MrtRecordSortField, MrtRecordStatus } from "@/types/mrtReporting";
import {
  emptyMrtFilters,
  MrtFilters,
  toDashboardParams,
  toFilterOptionParams,
  type MrtFilterValues,
} from "./MrtFilters";
import { MrtRecordsTable } from "./MrtRecordsTable";

const PAGE_SIZE = 20;

export function MrtLeaderboardPage() {
  const [filters, setFilters] = useState<MrtFilterValues>(emptyMrtFilters);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | MrtRecordStatus>("");
  const [sortBy, setSortBy] = useState<MrtRecordSortField>("month");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filters, search, status, sortBy, sortOrder]);

  const recordParams = toDashboardParams(filters);
  const optionParams = toFilterOptionParams(filters);

  const optionsQuery = useQuery({
    queryKey: ["mrt-reporting", "dashboard", optionParams],
    queryFn: () => getMrtReportingDashboard(optionParams),
    placeholderData: keepPreviousData,
  });

  const recordsQuery = useQuery({
    queryKey: ["mrt-reporting", "records", recordParams, search, status, sortBy, sortOrder, page],
    queryFn: () =>
      getMrtReportingRecords({
        ...recordParams,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        sortBy,
        sortOrder,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const resetFilters = () => {
    setFilters(emptyMrtFilters());
    setSearchInput("");
    setSearch("");
    setStatus("");
  };

  const onSort = (field: MrtRecordSortField) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortOrder(field === "studentName" || field === "month" ? "asc" : "desc");
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center border-b bg-white px-4 sm:px-6">
        <div className="flex w-full items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Leaderboard</h1>
            <p className="text-sm text-gray-600">Filter monthly reports and review each student row</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void optionsQuery.refetch();
              void recordsQuery.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${optionsQuery.isFetching || recordsQuery.isFetching ? "animate-spin" : ""}`}
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
          onReset={resetFilters}
        />

        <MrtRecordsTable
          records={recordsQuery.data?.results ?? []}
          page={recordsQuery.data?.page ?? page}
          totalPages={recordsQuery.data?.totalPages ?? 0}
          totalResults={recordsQuery.data?.totalResults ?? 0}
          isLoading={recordsQuery.isLoading || recordsQuery.isFetching}
          isError={recordsQuery.isError}
          errorMessage={reportingErrorMessage(recordsQuery.error, "Unable to load MRT records.")}
          search={searchInput}
          status={status}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearch={setSearchInput}
          onStatus={setStatus}
          onSort={onSort}
          onPage={setPage}
        />
      </main>
    </div>
  );
}
