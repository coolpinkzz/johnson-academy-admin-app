"use client";

import { useMemo, useState } from "react";
import { formatCount, formatPercent } from "./format";

export interface LeaderboardColumn<T> {
  id: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number | null;
}

interface MrtLeaderboardProps<T> {
  title: string;
  description: string;
  rows: T[];
  columns: LeaderboardColumn<T>[];
  getRowId: (row: T) => string;
  selectedId?: string;
  onSelect?: (id: string) => void;
  isLoading?: boolean;
  defaultSortId: string;
  defaultDirection?: "asc" | "desc";
  emptyMessage?: string;
}

function compareValues(
  left: string | number | null,
  right: string | number | null,
  direction: "asc" | "desc",
): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  const order =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right));
  return direction === "asc" ? order : -order;
}

export function CompletionCell({ value }: { value: number | null }) {
  const width = value == null ? 0 : Math.min(100, Math.max(0, value));
  return (
    <div className="min-w-28">
      <div className="text-right text-sm font-medium tabular-nums text-gray-900">
        {formatPercent(value)}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden>
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function CountCell({ value }: { value: number }) {
  return <span className="tabular-nums">{formatCount(value)}</span>;
}

export function MrtLeaderboard<T>({
  title,
  description,
  rows,
  columns,
  getRowId,
  selectedId,
  onSelect,
  isLoading = false,
  defaultSortId,
  defaultDirection = "desc",
  emptyMessage = "No enrollments match these filters.",
}: MrtLeaderboardProps<T>) {
  const [sortId, setSortId] = useState(defaultSortId);
  const [direction, setDirection] = useState<"asc" | "desc">(defaultDirection);

  const sorted = useMemo(() => {
    const column = columns.find((item) => item.id === sortId);
    if (!column?.sortValue) return rows;
    return [...rows].sort((left, right) => {
      const primary = compareValues(column.sortValue?.(left) ?? null, column.sortValue?.(right) ?? null, direction);
      if (primary !== 0) return primary;
      return getRowId(left).localeCompare(getRowId(right));
    });
  }, [columns, direction, getRowId, rows, sortId]);

  const toggleSort = (id: string) => {
    if (sortId === id) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortId(id);
    setDirection(id === "name" || id === "month" ? "asc" : "desc");
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium" scope="col">
                Rank
              </th>
              {columns.map((column) => {
                const active = sortId === column.id;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={
                      active ? (direction === "asc" ? "ascending" : "descending") : "none"
                    }
                    className={`px-4 py-3 font-medium ${column.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.id)}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        {column.header}
                        <span aria-hidden className="text-[10px]">
                          {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!isLoading && sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {sorted.map((row, index) => {
              const id = getRowId(row);
              const selected = selectedId != null && selectedId !== "" && selectedId === id;
              return (
                <tr
                  key={id}
                  className={selected ? "bg-blue-50" : "border-t border-gray-100 hover:bg-gray-50"}
                >
                  <td className="px-4 py-3 tabular-nums text-gray-500">{index + 1}</td>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-4 py-3 text-gray-800 ${column.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {column.id === "name" && onSelect ? (
                        <button
                          type="button"
                          onClick={() => onSelect(id)}
                          className="text-left font-medium text-blue-700 hover:underline"
                        >
                          {column.render(row)}
                        </button>
                      ) : (
                        column.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
